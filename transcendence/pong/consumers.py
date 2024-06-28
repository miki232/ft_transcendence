# pong/consumers.py
import json
import uuid
import asyncio
import random
import time
import math

from asgiref.sync import async_to_sync
from channels.db import database_sync_to_async
from channels.generic.websocket import WebsocketConsumer
from channels.generic.websocket import AsyncWebsocketConsumer
from django.core.cache import cache
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Q

from accounts.models import Match, CustomUser
from frontend.models import roomLocal
from .models import WaitingUser,TournamentRoomName, RoomName, Tournament_Waitin, Tournament_Match, Tournament, TournamentPlaceHolder, TournamentPartecipants
from chat.notifier import send_save_notification_async
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 600

# Paddle settings
PADDLE_WIDTH = 20
PADDLE_HEIGHT = 100
PADDLE_SPEED = 10
PADDLE_DEFAULT_POS = SCREEN_HEIGHT // 2 - PADDLE_HEIGHT // 2

# Ball settings
BALL_SIZE = 20
BALL_DEFAULT_POS = (SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - BALL_SIZE // 2)
# Winning score
POINTS_TO_WIN = 5

# def map_value(value, start1, stop1, start2, stop2):
#     return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1))
def map_value(value, from_low, from_high, to_low, to_high):
    from_range = from_high - from_low
    to_range = to_high - to_low
    scaled_value = float(value - from_low) / float(from_range)
    return to_low + (scaled_value * to_range)

def move_paddle(paddle_pos, target_pos, speed):
    if paddle_pos < target_pos:
        return min(paddle_pos + speed, target_pos)
    elif paddle_pos > target_pos:
        return max(paddle_pos - speed, target_pos)
    return paddle_pos


class PongConsumer(AsyncWebsocketConsumer):
    players = {}
    status = {}
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.spectator = False
        self.spectators = []
        self.shared_state = None  # Class variable to store the shared state
        self.match = None
        self.user1 = None
        self.user2 = None
        self.reaction_delay = 1
        self.counter = 0
        self.opponent = None
        self.speed_increase = 1.10
        self.ai_paddle_pos = SCREEN_HEIGHT // 2 - PADDLE_HEIGHT // 2
        self.ai_target_pos = self.ai_paddle_pos

    def ai_update(self, ball_pos, ball_velocity):
        

        # Only update the AI's target position every 'reaction_delay' frames
        self.counter += 1
        if self.counter % self.reaction_delay != 0:
            return

        # Calculate the ball's projected position when it reaches the AI paddle side
        if ball_velocity[0] > 0:  # If ball is moving toward the AI paddle
            time_to_reach_ai = (SCREEN_WIDTH - PADDLE_WIDTH - BALL_SIZE - ball_pos[0]) / ball_velocity[0]
            intercept_y = ball_pos[1] + ball_velocity[1] * time_to_reach_ai

            # Handle bounces off top/bottom walls
            while intercept_y < 0 or intercept_y > SCREEN_HEIGHT:
                if intercept_y < 0:
                    intercept_y = -intercept_y
                else:
                    intercept_y = 2 * SCREEN_HEIGHT - intercept_y
        else:
            intercept_y = ball_pos[1]  # Set intercept_y to the current y-coordinate of the ball
            # Set the target position for the AI paddle with some randomness
        randomness = random.uniform(-55, 55)
        self.ai_target_pos = intercept_y - PADDLE_HEIGHT // 2 + randomness
        # Ensure the target position is within paddle movement limits
        self.ai_target_pos = max(0, min(SCREEN_HEIGHT - PADDLE_HEIGHT, self.ai_target_pos))
        print("AI Update 67", "AI TARGET POS", self.ai_target_pos)



    @database_sync_to_async
    def getAi(self):
        opponent = RoomName.objects.get(name=self.room_name)
        print("BBB", opponent.opponent, opponent.name)
        return opponent.opponent
    """
    When Connection is established, add the user to the group and initialize the game state
    Check if The opponent Is an AI, if so, add the AI to the group
    """
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = "pong_%s" % self.room_name
        self.user = self.scope['user']
        ai = await self.getAi()
        print("-------------------------------Pong Consumer 101", self.user, "opponent", ai.username, ai.Ai, "-------------------")
        await self.accept()
        self.loop_task = None


        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        if self.room_name not in PongConsumer.players:
            PongConsumer.players[self.room_name] = []
        PongConsumer.players[self.room_name].append(self.user.username)
        
        if self.room_name in PongConsumer.status and PongConsumer.status[self.room_name]:
            winner_of_the_room = await self.get_winner(self.room_name)
            await self.send(text_data=json.dumps({
                'message': 'Game Terminated',
                'victory' : winner_of_the_room
            }))
            await self.close()
            return
        else:
            PongConsumer.status[self.room_name] = False

        if len(PongConsumer.players[self.room_name]) == 1:
            # This is the first user, initialize the state
            self.state = {
                'ball_x': 400,
                'ball_y': 290,
                'ball_speed_x': random.choice([-3, 3]),
                'ball_speed_y': random.choice([-3, 3]),
                'paddle1_y': 250,
                'paddle2_y': 250,
                'score1': 0,
                'score2': 0,
                'up_player_paddle_y': 0,
                'down_player_paddle_y': 0,
                'up_player2_paddle_y': 0,
                'down_player2_paddle_y': 0,
                'player': self.user.username,
                'victory' : "none",
                'countdown' : 'none',
                'status' : 'none',
                'Game' : 'none'
            }
            PongConsumer.shared_state = self.state  # Store the state in the class variable

            if ai.Ai:
                print("Pong Consumer 146", ai.username, len(PongConsumer.players[self.room_name]))
                PongConsumer.players[self.room_name].append(ai.username)
            else:
                print("Pong Consumer 166", self.user.username, len(PongConsumer.players[self.room_name]))
                self.opponent, friendly = await self.get_opponent_from_room(self.room_name)
                print("Pong Consumer 168", self.opponent)
                if friendly:
                    await self.send(text_data=json.dumps({'status' : "waiting", 'message': 'Waiting for the opponent to join...', 'player': self.user.username}))
                    await send_save_notification_async(self.opponent, f"{self.user.username} is waiting for you in the room {self.room_name}")
            
            print("Pong Consumer 149", len(PongConsumer.players[self.room_name]))
        if len(PongConsumer.players[self.room_name]) == 2:
            print("Pong Consumer 151", self.user.Ai)
            # This is the second user, inherit the state from the first user
            self.state = PongConsumer.shared_state
            if self.user.username == PongConsumer.players[self.room_name][0] and not (ai.Ai):
                await asyncio.sleep(0.01)
            else:    
                await self.start_game()
            print("Pong Consumer 155", self.user1, self.user2)
            if (ai.Ai):
                if (self.user1 == None):
                    self.user1 = ai
                elif (self.user2 == None):
                    self.user2 = ai
            print("Pong Consumer 161", self.user1, self.user2)

        elif len(PongConsumer.players[self.room_name]) > 2:
            # This is a spectator
            self.spectators.append(self.user.username)
            self.spectator = True


        if len(PongConsumer.players[self.room_name] or ai) == 2:
            self.loop_task = asyncio.create_task(self.game_loop())

    async def start_game(self):
        self.user1 = await self.get_user(PongConsumer.players[self.room_name][0])
        self.user2 = await self.get_user(PongConsumer.players[self.room_name][1])
        print("User2", self.user2.username, "AI", self.user2.Ai)
        await self.get_room_istance_delete(self.room_name)
        self.match = await self.create_match(self.user1, self.user2)
        print("CREA MATHC " , self.match.id)

    @database_sync_to_async
    def get_opponent_from_room(self, room_name):
        room = RoomName.objects.get(name=room_name)
        if self.user.username == room.created_by.username:
            return room.opponent, room.friendly
        return room.created_by, room.friendly

    @database_sync_to_async
    def get_room_istance_delete(self, roomname):
        try:
            print("-----------TRY TO DELETE THE ROOM ISTANCE ------")
            room_istance = RoomName.objects.get(name=roomname)
            print("ROOM ISTANCE ", room_istance.id)
            room_istance.delete()
            print("-----------ISTANCE DELTED SUCCESS ------")

        except:
            print("----------------FAILED TO DELETE ------------")


    @database_sync_to_async
    def get_winner(self, room_name):
        try:
            # Query the Match model for a match with the given room name
            # Get the last istance created, if for any reason there is multiple istance with same room_name
            # But based on the way is treated a room it shouldn't happen
            match = Match.objects.filter(room_name=room_name).latest('date')

            # Return the winner's username
            return match.winner.username
        except ObjectDoesNotExist:
            # If no match is found with the given room name, return None
            return None

    @database_sync_to_async
    def set_score(self, match, score, user):
        print("Pong Consumer 209", score, user, self.match.user1)
        if (self.match.user1 == CustomUser.objects.get(username=user)):
            match.score_user1 = score
        else:
            match.score_user2 = score
        match.save()

    @database_sync_to_async
    def set_winner(self, match, winner):
        print("Pong Consumer 218", winner, "Set winner", self.room_name, self.room_group_name)
        prova = CustomUser.objects.get(username=winner)
        print("GET USER ", type(prova), prova)
        print("MATCH: ", match)
        match.winner = prova
        print("FROME MATCH.WINNER " , match.winner.username)
        match.save()


    @database_sync_to_async
    def get_user(self, username):
        return CustomUser.objects.get(username=username)

    @database_sync_to_async
    def create_match(self, user1, user2):
        matchs = Match(room_name=self.room_name, user1=user1, user2=user2, score_user1=0, score_user2=0)
        matchs.save()
        return matchs

    @database_sync_to_async
    def get_match_from_db(self, roomname):
        print("Pong Consumer 239", roomname)
        return Match.objects.get(room_name=roomname)

    async def disconnect(self, close_code):
        # Remove the disconnected user from the players list and cancel the game loop task
        if (self.room_name in PongConsumer.status and PongConsumer.status[self.room_name]):
            return
        if self.user.username in PongConsumer.players[self.room_name]:
            await self.FreeAi()
            PongConsumer.players[self.room_name].remove(self.user.username)
        # If there are no players left in the room, set status[self.room_name] to True
        if not PongConsumer.players[self.room_name]:
            PongConsumer.status[self.room_name] = True

        if self.loop_task is not None:
            self.loop_task.cancel()


        # If there's only one player left, stop the game and send a "Victory" message
        if len(PongConsumer.players[self.room_name]) == 1:
            PongConsumer.status[self.room_name] = True
            print("Pong Consumer 258", PongConsumer.players[self.room_name][0], " Disconneted from room ", self.room_name)
            print("------------------ RETRIVE MATCH FORM DB -----------------------------")
            matchdb = await self.get_match_from_db(self.room_name)
            self.match = matchdb
            print("------------------MATCH FORM DB IS: ", matchdb.id, self.match.id)
            print("DISCONNETED ", PongConsumer.players[self.room_name][0], "SETTING VICTORY")
            winner = PongConsumer.players[self.room_name][0]
            print("WINNER: ", winner, self.match.id)
            await self.set_winner(self.match, winner)
            self.state['victory'] = PongConsumer.players[self.room_name][0]
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'game_state',
                    'state': self.state
                }
            )

        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        # await self.FreeAi()
        print("Pong Consumer 280",f"User {self.scope['user']} disconnected with code {close_code}")

    async def receive(self, text_data):
        message = json.loads(text_data)
        if self.spectator:
            return
        if 'action' in message:
            action = message['action']
            if self.user.username == PongConsumer.players[self.room_name][0]:
                if action == 'move_up':
                    self.state['up_player_paddle_y'] = 1
                elif action == 'move_down':
                    self.state['down_player_paddle_y'] = 1
            else:
                if action == 'move_up':
                    self.state['up_player2_paddle_y'] = 1
                elif action == 'move_down':
                    self.state['down_player2_paddle_y'] = 1

    async def move_paddle_up(self, player):
        if player == PongConsumer.players[self.room_name][0]:
            if self.state['paddle1_y'] > 0:
                self.state['paddle1_y'] -= 10
        else:
            if self.state['paddle2_y'] > 0:
                self.state['paddle2_y'] -= 10

    async def move_paddle_down(self, player):
        if player == PongConsumer.players[self.room_name][0]:
            if self.state['paddle1_y'] < 500:
                self.state['paddle1_y'] += 10
        else:
            if self.state['paddle2_y'] < 500:
                self.state['paddle2_y'] += 10

    async def countdown(self):
        for i in range(3, 0, -1):
            self.state['countdown'] = i
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'game_state',
                    'state': self.state
                }
            )
            await asyncio.sleep(1)
        self.state['status'] = 1
        self.state['Game'] = 'Start'
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game_state',
                'state': self.state
            }
        )
        await asyncio.sleep(1)
        self.state['Game'] = 'none'
        self.state['status'] = 0
        self.state['countdown'] = None
        

    # def check_collision(self):
    #     if (
    #         self.state['ball_x'] <= 10
    #         and self.state['paddle1_y'] <= self.state['ball_y'] <= self.state['paddle1_y'] + 100
    #     ):
    #         diff = self.state['ball_y'] - (self.state['paddle1_y'] + 50)
    #         print("Left Collision", diff, self.state['ball_speed_x'], self.state['ball_speed_y'])
    #         rad = math.radians(45)
    #         angle = map_value(diff, -50, 50, -rad, rad)
    #         # self.state['ball_speed_x'] = -self.state['ball_speed_x']
    #         self.state['ball_speed_x'] = 5 * math.cos(angle)
    #         self.state['ball_speed_y'] = 5 * math.sin(angle)
    #     if (
    #         self.state['ball_x'] >= 790
    #         and self.state['paddle2_y'] <= self.state['ball_y'] <= self.state['paddle2_y'] + 100
    #     ):
    #         # self.state['ball_speed_x'] = -self.state['ball_speed_x']
    #         diff = self.state['ball_y'] - (self.state['paddle2_y'] + 50)
    #         angle = map_value(diff, -50, 50, math.radians(255), math.radians(135))
    #         # self.state['ball_speed_x'] = -self.state['ball_speed_x']
    #         self.state['ball_speed_x'] = 5 * math.cos(angle)
    #         self.state['ball_speed_y'] = 5 * math.sin(angle)
    # async def check_collision(self):
    #     rad = math.radians(45)
    #     if (
    #         self.state['ball_x'] <= 50 and self.state['ball_x'] >= 25
    #         and (self.state['paddle1_y'] - 10) <= self.state['ball_y'] <= self.state['paddle1_y'] + 100
    #     ):
    #         diff = self.state['ball_y'] - (self.state['paddle1_y'] + 50)
    #         if self.speed_increase < 2:
    #             self.speed_increase += 0.05
    #         angle = map_value(diff, -50, 50, -rad, rad)
    #         await self.send(text_data=json.dumps({'hit': "paddleRight", 'angle': angle, 'stop' : 0}))
    #         self.state['ball_speed_x'] = 4 * math.cos(angle) * self.speed_increase
    #         self.state['ball_speed_y'] = 4 * math.sin(angle) * self.speed_increase
    #     if (
    #         self.state['ball_x'] >= 750  and self.state['ball_x'] <= 775
    #         and self.state['paddle2_y'] <= self.state['ball_y'] <= self.state['paddle2_y'] + 100
    #     ):
    #         diff = self.state['ball_y'] - (self.state['paddle2_y'] + 50)
    #         if self.speed_increase < 2:
    #             self.speed_increase += 0.05
    #         angle = map_value(diff, -50, 50, -rad, rad) + math.pi
    #         self.state['ball_speed_x'] = 4 * math.cos(angle) * self.speed_increase
    #         self.state['ball_speed_y'] = 4 * math.sin(angle) * self.speed_increase

    # def check_collision(self):
    #     def calculate_reflection(paddle_y, paddle_x, ball_x, ball_y):
    #         diff = ball_y - (paddle_y + PADDLE_HEIGHT / 2)
    #         normalized_diff = diff / (PADDLE_HEIGHT / 2)
    #         reflection_angle = normalized_diff * (math.pi / 4)
    #         speed = math.sqrt(self.state['ball_speed_x'] ** 2 + self.state['ball_speed_y'] ** 2)
    #         new_speed_x = speed * math.cos(reflection_angle)
    #         new_speed_y = speed * math.sin(reflection_angle)
    #         if ball_x < SCREEN_WIDTH / 2:
    #             new_speed_x = abs(new_speed_x)
    #         else:
    #             new_speed_x = -abs(new_speed_x)
    #         return new_speed_x, new_speed_y
    #     # Collision with paddle 1
    #     if self.state['ball_x'] - (BALL_SIZE / 2) <= 20 + PADDLE_WIDTH:
    #         if self.state['paddle1_y'] - (BALL_SIZE / 2) <= self.state['ball_y'] <= self.state['paddle1_y'] + PADDLE_HEIGHT + (BALL_SIZE / 2):
    #             self.state['ball_speed_x'], self.state['ball_speed_y'] = calculate_reflection(self.state['paddle1_y'], 20, self.state['ball_x'], self.state['ball_y'])
    #     if self.state['ball_x'] + (BALL_SIZE / 2) >= SCREEN_WIDTH - (PADDLE_WIDTH + 20):
    #         if self.state['paddle2_y'] - (BALL_SIZE / 2) <= self.state['ball_y'] <= self.state['paddle2_y'] + PADDLE_HEIGHT + (BALL_SIZE / 2):
    #             self.state['ball_speed_x'], self.state['ball_speed_y'] = calculate_reflection(self.state['paddle2_y'], SCREEN_WIDTH - (PADDLE_WIDTH + 20), self.state['ball_x'], self.state['ball_y'])
    
    def check_collision(self):
        def calculate_reflection(paddle_y, paddle_x, ball_x, ball_y):
            if self.speed_increase < 2:
                self.speed_increase += 0.05
            diff = ball_y - (paddle_y + PADDLE_HEIGHT / 2)
            normalized_diff = diff / (PADDLE_HEIGHT / 2)
            reflection_angle = normalized_diff * (math.pi / 4)
            speed = math.sqrt(self.state['ball_speed_x'] ** 2 + self.state['ball_speed_y'] ** 2)
            if speed > 6:
                speed = 6
            new_speed_x = speed * math.cos(reflection_angle)
            new_speed_y = speed * math.sin(reflection_angle)
            if ball_x < SCREEN_WIDTH / 2:
                new_speed_x = abs(new_speed_x)
            else:
                new_speed_x = -abs(new_speed_x)
            if ball_y <= paddle_y or ball_y >= paddle_y + PADDLE_HEIGHT:
                speed_angle = self.speed_increase + abs(PADDLE_SPEED / 2) * 0.001
                increaser = min(speed_angle * self.speed_increase, 1)
                new_speed_x = speed * math.cos(reflection_angle) * increaser
                new_speed_y = speed * math.sin(reflection_angle) * increaser
                if ball_x < SCREEN_WIDTH / 2:
                    new_speed_x = abs(new_speed_x)
                else:
                    new_speed_x = -abs(new_speed_x)
            return new_speed_x * self.speed_increase, new_speed_y * self.speed_increase
        
        # Collision with paddle 1
        if self.state['ball_x'] - (BALL_SIZE / 2) <= 20 + PADDLE_WIDTH and self.state['ball_x'] >= 20:
            if self.state['paddle1_y'] - (BALL_SIZE / 2) <= self.state['ball_y'] <= self.state['paddle1_y'] + PADDLE_HEIGHT + (BALL_SIZE / 2):
                self.state['ball_speed_x'], self.state['ball_speed_y'] = calculate_reflection(self.state['paddle1_y'], 20, self.state['ball_x'], self.state['ball_y'])
        if self.state['ball_x'] + (BALL_SIZE / 2) >= SCREEN_WIDTH - (PADDLE_WIDTH + 25) and self.state['ball_x'] <= SCREEN_WIDTH - (PADDLE_WIDTH + 20):
            if self.state['paddle2_y'] - (BALL_SIZE / 2) <= self.state['ball_y'] <= self.state['paddle2_y'] + PADDLE_HEIGHT + (BALL_SIZE / 2):
                self.state['ball_speed_x'], self.state['ball_speed_y'] = calculate_reflection(self.state['paddle2_y'], SCREEN_WIDTH - (PADDLE_WIDTH + 20), self.state['ball_x'], self.state['ball_y'])


    def simulate_input(self, paddle, player, new_paddle_pos):
            if self.state[paddle] < new_paddle_pos - PADDLE_SPEED:
                self.state[f'down_{player}_paddle_y'] = 1
                self.state[f'up_{player}_paddle_y'] = 0
            elif self.state[paddle] > new_paddle_pos + PADDLE_SPEED:
                self.state[f'up_{player}_paddle_y'] = 1
                self.state[f'down_{player}_paddle_y'] = 0

    async def game_loop(self):
        last_ai_update_time = time.time()
        while (PongConsumer.status[self.room_name]) == False:
            current_time = time.time()
            if self.user.username == PongConsumer.players[self.room_name][0] and not (self.user1.Ai or self.user2.Ai):
                await asyncio.sleep(0.01)
                continue
            """Find who is the AI and move the paddle accordingly"""
            if (self.user1.Ai or self.user2.Ai):
                if current_time - last_ai_update_time >= 1:
                    self.ai_update([self.state['ball_x'], self.state['ball_y']], [self.state['ball_speed_x'], self.state['ball_speed_y']])
                    last_ai_update_time = current_time
                if (self.user1.Ai):
                    self.simulate_input("paddle1_y", "player", self.ai_target_pos)
                else:
                    self.simulate_input("paddle2_y", "player2", self.ai_target_pos)
            await asyncio.sleep(0.01)
            if self.spectator:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'game_state',
                        'state': self.state
                    }
                )
                continue
            # Move paddles based on player input
            if self.state['up_player_paddle_y'] == 1:
                await self.move_paddle_up(PongConsumer.players[self.room_name][0])
                self.state['up_player_paddle_y'] = 0
            if self.state['down_player_paddle_y'] == 1:
                await self.move_paddle_down(PongConsumer.players[self.room_name][0])
                self.state['down_player_paddle_y'] = 0
            if self.state['up_player2_paddle_y'] == 1:
                await self.move_paddle_up(PongConsumer.players[self.room_name][1])
                self.state['up_player2_paddle_y'] = 0
            if self.state['down_player2_paddle_y'] == 1:
                await self.move_paddle_down(PongConsumer.players[self.room_name][1])
                self.state['down_player2_paddle_y'] = 0


            # Update ball position
            self.state['ball_x'] += self.state['ball_speed_x']
            self.state['ball_y'] += self.state['ball_speed_y']

            # Collision with top and bottom walls
            if self.state['ball_y'] - BALL_SIZE / 2 <= 0:
                self.state['ball_y'] = BALL_SIZE / 2
                self.state['ball_speed_y'] = abs(self.state['ball_speed_y']) + 0.1
            if self.state['ball_y'] + BALL_SIZE / 2 >= 600:
                self.state['ball_y'] = 600 - BALL_SIZE / 2
                self.state['ball_speed_y'] = -abs(self.state['ball_speed_y']) - 0.1

            # # Collision with paddles
            self.check_collision()
            # if (
            #     self.state['ball_x'] <= 10
            #     and self.state['paddle1_y'] <= self.state['ball_y'] <= self.state['paddle1_y'] + 100
            # ):
            #     self.state['ball_speed_x'] = -self.state['ball_speed_x']
            # if (
            #     self.state['ball_x'] >= 790
            #     and self.state['paddle2_y'] <= self.state['ball_y'] <= self.state['paddle2_y'] + 100
            # ):
            #     self.state['ball_speed_x'] = -self.state['ball_speed_x']

            # Scoring
            if self.state['ball_x'] <= 0:
                self.state['score2'] += 1
                await self.set_score(self.match, self.state['score2'], PongConsumer.players[self.room_name][1])
                self.state['ball_x'] = 400
                self.state['ball_y'] = 290
                # self.state['ball_speed_x'] = +self.state['ball_speed_y'] #can be used to increase the speed of the ball
                # self.state['ball_speed_y'] = +self.state['ball_speed_y'] 

                self.state['ball_speed_x'] = 3 #can be used to increase the speed of the ball
                self.state['ball_speed_y'] = 3
                self.speed_increase = 1.10
                if self.state['score2'] < POINTS_TO_WIN:
                    await self.countdown()

            elif self.state['ball_x'] >= 800:
                self.state['score1'] += 1
                await self.set_score(self.match, self.state['score1'], PongConsumer.players[self.room_name][0])
                self.state['ball_x'] = 400
                self.state['ball_y'] = 290
                # self.state['ball_speed_x'] = +self.state['ball_speed_y']
                # self.state['ball_speed_y'] = +self.state['ball_speed_y'] 
                self.state['ball_speed_x'] = -3 #can be used to increase the speed of the ball
                self.state['ball_speed_y'] = -3
                self.speed_increase = 1.10
                if self.state['score1'] < POINTS_TO_WIN:
                    await self.countdown()

            if self.state['score1']  >= POINTS_TO_WIN or self.state['score2'] >= POINTS_TO_WIN:
                if self.state['score1'] >= POINTS_TO_WIN:
                    await self.set_winner(self.match, PongConsumer.players[self.room_name][0])
                elif self.state['score2'] >= POINTS_TO_WIN:
                    await self.set_winner(self.match, PongConsumer.players[self.room_name][1])
                PongConsumer.status[self.room_name] = True
                
            # Send updated game state to all clients
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'game_state',
                    'state': self.state
                }
            )
        if self.room_name in PongConsumer.status and PongConsumer.status[self.room_name]:
            print("Pong Consumer 444","THE winner is", type(self.match.winner.username), self.match.winner.username, self.user.username)
            await self.FreeAi()
            self.state['victory'] = self.match.winner.username
            await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game_state',
                'state': self.state
            }
            )
            await asyncio.sleep(1.5)  # Wait for 1 second
            await self.close()
            return

    @database_sync_to_async
    def FreeAi(self):
        try:
            print("Pong Consumer 464", PongConsumer.players[self.room_name][1])
            ai = CustomUser.objects.get(username=PongConsumer.players[self.room_name][1])
            ai.Occupied = False
            ai.save()
        except:
            print("Pong Consumer 471", "AI NOT FOUND")

    async def handle_message(self, event):
        message_type = event['type']
        if message_type == 'game_state':
            # We already have a handler for the game_state message
            pass  # Do nothing for now (game state is handled

    async def game_state(self, event):
        # Send the game state to the client
        await self.send(text_data=json.dumps(event['state']))


class Pong_LocalConsumer(AsyncWebsocketConsumer):
    players = {}
    status = {}
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.reaction_delay = 1
        self.counter = 0
        self.ai_paddle_pos = SCREEN_HEIGHT // 2 - PADDLE_HEIGHT // 2
        self.ai_target_pos = self.ai_paddle_pos
        self.speed_increase = 1.10
    
    def ai_update(self, ball_pos, ball_velocity):
        

        # Only update the AI's target position every 'reaction_delay' frames
        self.counter += 1
        if self.counter % self.reaction_delay != 0:
            return

        # Calculate the ball's projected position when it reaches the AI paddle side
        if ball_velocity[0] > 0:  # If ball is moving toward the AI paddle
            time_to_reach_ai = (SCREEN_WIDTH - PADDLE_WIDTH - BALL_SIZE - ball_pos[0]) / ball_velocity[0]
            intercept_y = ball_pos[1] + ball_velocity[1] * time_to_reach_ai

            # Handle bounces off top/bottom walls
            while intercept_y < 0 or intercept_y > SCREEN_HEIGHT:
                if intercept_y < 0:
                    intercept_y = -intercept_y
                else:
                    intercept_y = 2 * SCREEN_HEIGHT - intercept_y
        else:
            intercept_y = ball_pos[1]  # Set intercept_y to the current y-coordinate of the ball
            # Set the target position for the AI paddle with some randomness
        randomness = random.uniform(-55, 55)
        self.ai_target_pos = intercept_y - PADDLE_HEIGHT // 2 + randomness
        # Ensure the target position is within paddle movement limits
        self.ai_target_pos = max(0, min(SCREEN_HEIGHT - PADDLE_HEIGHT, self.ai_target_pos))
        print("AI Update 67", "AI TARGET POS", self.ai_target_pos)

    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = "pong_%s" % self.room_name
        self.user = self.scope['user']
        self.loop_task = None
        print("Pong Local Consumer 476",self.user, self.room_group_name, self.room_name)
        await self.accept()


        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        Pong_LocalConsumer.players[self.room_name] = []
        Pong_LocalConsumer.players[self.room_name].append(self.user.username)
        print("Pong Local Consumer 486","connected", self.room_group_name, self.channel_name)
        self.state = {
            'ball_x': BALL_DEFAULT_POS[0],
            'ball_y': BALL_DEFAULT_POS[1],
            'ball_speed_x': random.choice([-3, 3]),
            'ball_speed_y': random.choice([-3, 3]),
            'paddle1_y': PADDLE_DEFAULT_POS,
            'paddle2_y': PADDLE_DEFAULT_POS,
            'score1': 0,
            'score2': 0,
            'up_player_paddle_y': 0,
            'down_player_paddle_y': 0,
            'up_player2_paddle_y': 0,
            'down_player2_paddle_y': 0,
            'player': self.user.username,
            'victory' : "none"
        }

    async def receive(self, text_data):
        message = json.loads(text_data)
        match message['Handling']:
            case "lobby":
                if message['opponent'] != None:
                    if message['opponent'] not in Pong_LocalConsumer.players[self.room_name]:
                        Pong_LocalConsumer.players[self.room_name].append(message['opponent'])
                await self.send(text_data=json.dumps("FUCK YOU"))
                if len(Pong_LocalConsumer.players[self.room_name]) == 2:
                    await self.send(text_data=json.dumps("THE GAME CAN START NOW"))
                    if message["status"] == "ready":
                        Pong_LocalConsumer.players[self.room_name][0] = message['username']
                        Pong_LocalConsumer.status[self.room_name] = False
                        self.loop_task = asyncio.create_task(self.game_loop())
                    else :
                        await self.send(text_data=json.dumps({'status' : 0, 'opponent' : Pong_LocalConsumer.players[self.room_name][1]}))
            case "ingame":
                if 'action' in message:
                    action = message['action']
                    self.user = message['user']
                    if self.user == Pong_LocalConsumer.players[self.room_name][0]:
                        if action == 'move_up':
                            self.state['up_player_paddle_y'] = 1
                        elif action == 'move_down':
                            self.state['down_player_paddle_y'] = 1
                        elif action == 'mouse_move':
                            self.state['ball_x'] = message['x']
                            self.state['ball_y'] = message['y']
                    else:
                        if action == 'move_up':
                            self.state['up_player2_paddle_y'] = 1
                        elif action == 'move_down':
                            self.state['down_player2_paddle_y'] = 1

    @database_sync_to_async
    def free_room(self, roomname):
        try:
            roomLocal.objects.get(roomname=roomname).delete()
        except:
            return False
        return True
        
    async def disconnect(self, code):
        if self.loop_task is not None:
            self.loop_task.cancel()

        result = await self.free_room(self.room_name)
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        return super().disconnect(code)
    
    async def countdown(self):
        for i in range(3, 0, -1):
            await self.send(text_data=json.dumps({'countdown': i, 'score1': self.state['score1'], 'score2': self.state['score2']}))
            await asyncio.sleep(1)
        await self.send(text_data=json.dumps({'status': 1, 'Game': 'Start', 'score1': self.state['score1'], 'score2': self.state['score2']}))
        await asyncio.sleep(1)

    async def move_paddle_up(self, player):
        if player == Pong_LocalConsumer.players[self.room_name][0]:
            if self.state['paddle1_y'] > 0:
                self.state['paddle1_y'] -= PADDLE_SPEED
        else:
            if self.state['paddle2_y'] > 0:
                self.state['paddle2_y'] -= PADDLE_SPEED

    async def move_paddle_down(self, player):
        if player == Pong_LocalConsumer.players[self.room_name][0]:
            if self.state['paddle1_y'] < 500:
                self.state['paddle1_y'] += PADDLE_SPEED
        else:
            if self.state['paddle2_y'] < 500:
                self.state['paddle2_y'] += PADDLE_SPEED

    # async def check_collision(self):
    #     rad = math.radians(45)
    #     if (
    #         self.state['ball_x'] <= 50 and self.state['ball_x'] >= 25
    #         and (self.state['paddle1_y'] - 10) <= self.state['ball_y'] <= self.state['paddle1_y'] + 100
    #     ):
    #         diff = self.state['ball_y'] - (self.state['paddle1_y'] + 50)
    #         if self.speed_increase < 2:
    #             self.speed_increase += 0.05
    #         angle = map_value(diff, -50, 50, -rad, rad)
    #         await self.send(text_data=json.dumps({'hit': "paddleRight", 'angle': angle, 'stop' : 0}))
    #         self.state['ball_speed_x'] = 4 * math.cos(angle) * self.speed_increase
    #         self.state['ball_speed_y'] = 4 * math.sin(angle) * self.speed_increase
    #     if (
    #         self.state['ball_x'] >= 750  and self.state['ball_x'] <= 775
    #         and self.state['paddle2_y'] <= self.state['ball_y'] <= self.state['paddle2_y'] + 100
    #     ):
    #         diff = self.state['ball_y'] - (self.state['paddle2_y'] + 50)
    #         if self.speed_increase < 2:
    #             self.speed_increase += 0.05
    #         angle = map_value(diff, -50, 50, -rad, rad) + math.pi
    #         self.state['ball_speed_x'] = 4 * math.cos(angle) * self.speed_increase
    #         self.state['ball_speed_y'] = 4 * math.sin(angle) * self.speed_increase

    async def check_collision(self):
        def calculate_reflection(paddle_y, paddle_x, ball_x, ball_y):
            if self.speed_increase < 2:
                self.speed_increase += 0.05
            diff = ball_y - (paddle_y + PADDLE_HEIGHT / 2)
            normalized_diff = diff / (PADDLE_HEIGHT / 2)
            reflection_angle = normalized_diff * (math.pi / 4)
            speed = math.sqrt(self.state['ball_speed_x'] ** 2 + self.state['ball_speed_y'] ** 2)
            if speed > 6:
                speed = 6
            new_speed_x = speed * math.cos(reflection_angle)
            new_speed_y = speed * math.sin(reflection_angle)
            if ball_x < SCREEN_WIDTH / 2:
                new_speed_x = abs(new_speed_x)
            else:
                new_speed_x = -abs(new_speed_x)
            if ball_y <= paddle_y or ball_y >= paddle_y + PADDLE_HEIGHT:
                speed_angle = self.speed_increase + abs(PADDLE_SPEED / 2) * 0.001
                increaser = min(speed_angle * self.speed_increase, 1)
                new_speed_x = speed * math.cos(reflection_angle) * increaser
                new_speed_y = speed * math.sin(reflection_angle) * increaser
                if ball_x < SCREEN_WIDTH / 2:
                    new_speed_x = abs(new_speed_x)
                else:
                    new_speed_x = -abs(new_speed_x)
            return new_speed_x * self.speed_increase, new_speed_y * self.speed_increase
        
        # Collision with paddle 1
        if self.state['ball_x'] - (BALL_SIZE / 2) <= 20 + PADDLE_WIDTH and self.state['ball_x'] >= 20:
            if self.state['paddle1_y'] - (BALL_SIZE / 2) <= self.state['ball_y'] <= self.state['paddle1_y'] + PADDLE_HEIGHT + (BALL_SIZE / 2):
                self.state['ball_speed_x'], self.state['ball_speed_y'] = calculate_reflection(self.state['paddle1_y'], 20, self.state['ball_x'], self.state['ball_y'])
        if self.state['ball_x'] + (BALL_SIZE / 2) >= SCREEN_WIDTH - (PADDLE_WIDTH + 20) and self.state['ball_x'] <= SCREEN_WIDTH - (PADDLE_WIDTH + 20):
            if self.state['paddle2_y'] - (BALL_SIZE / 2) <= self.state['ball_y'] <= self.state['paddle2_y'] + PADDLE_HEIGHT + (BALL_SIZE / 2):
                self.state['ball_speed_x'], self.state['ball_speed_y'] = calculate_reflection(self.state['paddle2_y'], SCREEN_WIDTH - (PADDLE_WIDTH + 20), self.state['ball_x'], self.state['ball_y'])
    
    async def reset(self):
        self.speed_increase = 1.10
        self.state['ball_x'] = BALL_DEFAULT_POS[0]
        self.state['ball_y'] = BALL_DEFAULT_POS[1]
        self.state['paddle1_y'] = PADDLE_DEFAULT_POS
        self.state['paddle2_y'] = PADDLE_DEFAULT_POS
        await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'game_state',
                    'state': self.state
                }
            )
        
    def simulate_input(self, new_paddle_pos):
        if self.state['paddle2_y'] < new_paddle_pos - PADDLE_SPEED:
            self.state['down_player2_paddle_y'] = 1
            self.state['up_player2_paddle_y'] = 0
        elif self.state['paddle2_y'] > new_paddle_pos + PADDLE_SPEED:
            self.state['up_player2_paddle_y'] = 1
            self.state['down_player2_paddle_y'] = 0

    async def game_loop(self):
        last_ai_update_time = time.time()
        await self.countdown()
        while (Pong_LocalConsumer.status[self.room_name]) == False:
            current_time = time.time()
            await asyncio.sleep(0.01)
            if (Pong_LocalConsumer.players[self.room_name].count("AI") > 0):
                if current_time - last_ai_update_time >= 1:
                    self.ai_update([self.state['ball_x'], self.state['ball_y']], [self.state['ball_speed_x'], self.state['ball_speed_y']])
                    # print("Seconds since last AI update:", current_time - last_ai_update_time)  # Print the time elapsed since the last AI update 
                    last_ai_update_time = current_time
                self.simulate_input(self.ai_target_pos)

            # Move paddles based on player input
            if self.state['up_player_paddle_y'] == 1:
                await self.move_paddle_up(Pong_LocalConsumer.players[self.room_name][0])
                self.state['up_player_paddle_y'] = 0
            if self.state['down_player_paddle_y'] == 1:
                await self.move_paddle_down(Pong_LocalConsumer.players[self.room_name][0])
                self.state['down_player_paddle_y'] = 0
            if self.state['up_player2_paddle_y'] == 1:
                await self.move_paddle_up(Pong_LocalConsumer.players[self.room_name][1])
                self.state['up_player2_paddle_y'] = 0
            if self.state['down_player2_paddle_y'] == 1:
                await self.move_paddle_down(Pong_LocalConsumer.players[self.room_name][1])
                self.state['down_player2_paddle_y'] = 0


            # Update ball position
            self.state['ball_x'] += self.state['ball_speed_x']
            self.state['ball_y'] += self.state['ball_speed_y']

            # Collision with top and bottom walls
            if self.state['ball_y'] - BALL_SIZE / 2 <= 0:
                self.state['ball_y'] = BALL_SIZE / 2
                self.state['ball_speed_y'] = abs(self.state['ball_speed_y']) + 0.1
            if self.state['ball_y'] + BALL_SIZE / 2 >= 600:
                self.state['ball_y'] = 600 - BALL_SIZE / 2
                self.state['ball_speed_y'] = -abs(self.state['ball_speed_y']) - 0.1

            # # Collision with paddles
            await self.check_collision()
            # Scoring
            if self.state['ball_x'] <= 5:
                self.state['score2'] += 1
                self.state['ball_x'] = 400
                self.state['ball_y'] = 290
                self.state['ball_speed_x'] = 3 #can be used to increase the speed of the ball
                self.state['ball_speed_y'] = 3
                await self.reset()
                if self.state['score2'] < POINTS_TO_WIN:
                    await self.countdown()

            elif self.state['ball_x'] >= 795:
                self.state['score1'] += 1
                # await self.set_score(self.match, self.state['score1'], Pong_LocalConsumer.players[self.room_name][0])
                self.state['ball_x'] = 400
                self.state['ball_y'] = 290
                # self.state['ball_speed_x'] = +self.state['ball_speed_y']
                # self.state['ball_speed_y'] = +self.state['ball_speed_y'] 
                self.state['ball_speed_x'] = -3 #can be used to increase the speed of the ball
                self.state['ball_speed_y'] = -3
                await self.reset()
                if self.state['score1'] < POINTS_TO_WIN:
                    await self.countdown()


            if self.state['score1']  >= POINTS_TO_WIN or self.state['score2'] >= POINTS_TO_WIN:
                if self.state['score1'] >= POINTS_TO_WIN:
                    self.state['victory'] = Pong_LocalConsumer.players[self.room_name][0]
                elif self.state['score2'] >= POINTS_TO_WIN:
                    self.state['victory'] = Pong_LocalConsumer.players[self.room_name][1]
                Pong_LocalConsumer.status[self.room_name] = True
            # Send updated game state to all clients
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'game_state',
                    'state': self.state
                }
            )
        if self.room_name in Pong_LocalConsumer.status and Pong_LocalConsumer.status[self.room_name]:
            await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game_state',
                'state': self.state
            }
            )
            await asyncio.sleep(1.5)  # Wait for 1 second
            await self.close()
            return

    async def handle_message(self, event):
        message_type = event['type']
        if message_type == 'game_state':
            # We already have a handler for the game_state message
            pass  # Do nothing for now (game state is handled

    async def game_state(self, event):
        # Send the game state to the client
        await self.send(text_data=json.dumps(event['state']))


class MatchMaking(AsyncWebsocketConsumer):
    room_name = ""
    player = 0
    queue_task = None
    async def connect(self):
        self.user = self.scope["user"]
        print("MatchMaking 767", self.user)
        await self.accept()
        self.time_passed = 0
        self.connected = True
        self.freeroom = True
        self.group_name = ""
        self.next_match = False
        # notificationslist = await self.get_notifications()
        # for notification in notificationslist:
        #     await self.send(text_data=json.dumps(
        #         {
        #             'content' : notification.content,
        #             'read' : notification.read
        #         }
        #     ))

    async def disconnect(self, close_code):
        print("MatchMaking 781", self.user, "Disconnected", self.group_name)
        self.connected = False
        await self.leave_queue()
        if(self.queue_task):
            self.queue_task.cancel()
        print("MatchMaking 785", self.user, "Disconnected", self.group_name)
        if self.group_name:
            await self.channel_layer.group_discard(
                        self.group_name,
                        self.channel_name
                    )
        
        
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        action = text_data_json['action']
        try:
            status = text_data_json['status']
        except:
            pass
        print("MatchMaking 789", action)
        if action == 'join_queue':
            await self.send(json.dumps({"status": "Joining Queue"}))
            await self.handle_join_queue()
        elif action == 'leave_queue':
            await self.leave_queue()
        elif action == 'joinTournamentQueue':
            await self.send(json.dumps({"status": "Joining Queue"}))
            print("MatchMaking 795", "Joining Tournament Queue")
            self.freeroom = False
            if (status == "not_ready_nextmatch"):
                self.next_match = True
                await self.channel_layer.group_add("waitingroom", self.channel_name)
            await self.handle_join_tournament()
        elif action == 'torunametInfo':
            print("MatchMaking 798", "Tournament Info")
            numberofplayers = await self.get_tournament_info()
            await self.channel_layer.group_add("waitingroom", self.channel_name)
            self.group_name = "waitingroom"
            await self.channel_layer.group_send("waitingroom", {
                "type": "chat.message",
                "text": json.dumps({"status": "Waiting for players", "numberofplayers_reached": numberofplayers})
            })
        elif action == 'to-pong':
            self.freeroom = False

    @database_sync_to_async
    def get_tournament_info(self):
        numberofplayers = Tournament_Waitin.objects.all()
        return len(numberofplayers)

    @database_sync_to_async
    def queue_tournament(self):
        user_level = self.user.calculate_level()
        tournamName = TournamentPlaceHolder.objects.get(Q(status=True) | Q(status=False))
        print("MatchMaking 1041", tournamName.name)
        tournament, created = Tournament.objects.get_or_create(name=tournamName.name)
        divided = 2
        print(user_level)
        if not Tournament_Waitin.objects.filter(user=self.user).exists():
            Tournament_Waitin.objects.create(user=self.user, level=user_level)
        waiting_users = Tournament_Waitin.objects.all()
        print("MatchMaking 814", len(waiting_users), self.user)
        try:
            numberofplayers = TournamentPlaceHolder.objects.get(status=True)
        except:
            numberofplayers = TournamentPlaceHolder.objects.get(status=False)
        print("MatchMaking 839", numberofplayers.playerNumber)
        # self.send(json.dumps({"status": "Waiting for players", "numberofplayers_reached": len(waiting_users), "numberofplayers-to-reach": numberofplayers}))
        if len(waiting_users) == numberofplayers.playerNumber:
            alias1 = Nonealias2 = None
            waiting_users.order_by('level')
            TournamentPlaceHolder.objects.update(status=False)
            print("MatchMaking 814", len(waiting_users), self.user, self.time_passed)
            waiting_users_list = list(waiting_users)
            for user1, user2 in zip(waiting_users_list[::2], waiting_users_list[1::2]):
                print("user ", user1.user.username, user2.user.username, user1.level, user2.level)
                room_name = str(uuid.uuid4()).replace('-', '')
                match = TournamentRoomName.objects.create(name=room_name, created_by=user1.user, alias1=user1.user.alias, opponent=user2.user, alias2=user2.user.alias, tournament=True)
                tmatch = Tournament_Match.objects.create(room_name=room_name, user1=user1.user, user2=user2.user)
                print("MatchMaking 1061", "Room Name", room_name, "Opponent", user2.user.username, user2.user.alias)

                tournament.matches.add(tmatch)
                print("MatchMaking 1063", "Room Name", room_name, "Opponent", user2.user.username)
                user1.delete()
                user2.delete()
            matching_dict = {}
            for match in TournamentRoomName.objects.filter(tournament=True):
                matching_dict[f'{match.name}'] = [match.created_by.username, match.alias1, match.opponent.username, match.alias2]
            lenround = len(TournamentRoomName.objects.filter(tournament=True))
            if lenround >= 4:
                lenround -= 1
            TournamentPlaceHolder.objects.update(round=lenround)
            return len(waiting_users), numberofplayers.playerNumber, matching_dict, None
            # for waiting_user in waiting_users:
        if (self.next_match):
            print("MatchMaking 839", "Next Match")
            self.next_match = False
            if (TournamentPlaceHolder.objects.get(status=False).round == 1):
                print("MatchMaking 1069", "Tournamet finish", self.user.username)
                Tournament_Waitin.objects.all().delete()
                return None, None, None, self.user.username
            if (TournamentPlaceHolder.objects.get(status=False).round == 2 and TournamentPlaceHolder.objects.get(status=False).playerNumber == 8):
                divided = 4
            numberofplayers_nextmatch = numberofplayers.playerNumber // divided
            print("MatchMaking 839", numberofplayers_nextmatch)
            if len(waiting_users) == numberofplayers_nextmatch:
                waiting_users_list = list(waiting_users)
                
                for user1, user2 in zip(waiting_users_list[::2], waiting_users_list[1::2]):
                    print("user ", user1.user.username, user2.user.username, user1.level, user2.level)
                    room_name = str(uuid.uuid4()).replace('-', '')
                    match = TournamentRoomName.objects.create(name=room_name, created_by=user1.user, alias1=user1.user.alias, opponent=user2.user, alias2=user2.user.alias, tournament=True)
                    tmatch = Tournament_Match.objects.create(room_name=room_name, user1=user1.user, user2=user2.user)
                    tournament.matches.add(tmatch)
                    user1.delete()
                    user2.delete()
                matching_dict = {}
                for match in TournamentRoomName.objects.filter(tournament=True):
                    matching_dict[f'{match.name}'] = [match.created_by.username, match.alias1, match.opponent.username, match.alias2]
                lenround = len(TournamentRoomName.objects.filter(tournament=True))
                if lenround >= 4:
                    lenround -= 1
                TournamentPlaceHolder.objects.update(round=lenround)
            return len(waiting_users), numberofplayers_nextmatch, matching_dict, None
            #     print("840 ", waiting_user.user.username, waiting_user.level)
        return len(waiting_users), numberofplayers.playerNumber, None, None
            #     print("840 ", waiting_user.user.username, waiting_user.level)
        # if len(waiting_users) == 3:
        #     for waiting_user in waiting_users:
        #         level_difference = abs(user_level - waiting_user.level)
        #         self.time_passed = 0
        #         print("MatchMaking 8sda32", "Room Name", room_name, "Opponent", waiting_user.user.username)
        #         if level_difference <= 3:
        #             Tournament_Waitin.objects.filter(user__in=[self.user, waiting_user.user]).delete()

        #             room_name = str(uuid.uuid1()).replace('-', '')
        #             match = Tournament_Match(name=room_name, player1=waiting_user[0], player2=waiting_user[1])
                    
        #             # match = Tournament.objects.create(room_name=room_name, created_by=self.user, opponent=waiting_user.user)
        #             # room = RoomName.objects.create(name=room_name, created_by=self.user, opponent=waiting_user.user)
        #             print("MatchMaking 832", "Room Name", room_name, "Opponent", waiting_user.user.username)
        #             return({"status": 2, "room_name": room_name, "opponent" : waiting_user.user.username, "group_name": f"matchmaking_{room_name}", "User_self" : self.user.username})



    async def handle_join_tournament(self):
        # await self.queue_tournament()
        # print("MatchMaking 801", "User", self.user.username, "Joined Tournament", "len", len(Tournament.objects.all()))
        self.queue_task = asyncio.create_task(self.turnament_loop())


    async def turnament_loop(self):
        result = ""
        print("In loop 875")
        await self.send(text_data=json.dumps({"status" : 1}))
        result, numberofplayers, matching_dict, victory = await self.queue_tournament()
        print("MatchMaking 880", result)
        print("MatchMaking 883", result, numberofplayers)
        if result:
            if result == numberofplayers:
                print("MatchMaking 886", "Number of players reached", matching_dict)
                #ADV
                await self.channel_layer.group_send("waitingroom", {
                    "type": "chat.message",
                    "text": json.dumps({"status" : "6", "dict" : matching_dict})
                })
                await asyncio.sleep(6)
                # await self.channel_layer.group_add(result["group_name"], self.channel_name)
                # Send the result to the group
                await self.channel_layer.group_send("waitingroom", {
                    "type": "chat.message",
                    "text": json.dumps({"status" : "Tournament start", "dict" : matching_dict})
                })
            elif result < numberofplayers:
                # await self.channel_layer.group_add("waitingroom", self.channel_name)
                await self.channel_layer.group_send("waitingroom", {
                    "type": "chat.message",
                    "text": json.dumps({"status": "Waiting for players", "numberofplayers_reached": result, "numberofplayers-to-reach": numberofplayers})
                })
        if victory:
            await self.channel_layer.group_send("waitingroom", {
                "type": "chat.message",
                "text": json.dumps({"status": "Tournament Finish", "winner": victory})
            })
        # await self.send(json.dumps({"status": "Waiting for players", "numberofplayers_reached": result, "numberofplayers-to-reach": numberofplayers}))
        await asyncio.sleep(2)
    
    @database_sync_to_async
    def join_queue(self):
        user_level = self.user.calculate_level()

        existing_room = RoomName.objects.filter(Q(created_by=self.user, friendly=False) | Q(opponent=self.user, friendly=False)).first()
        if existing_room:
            print("MatchMaking 802", self.user.username == existing_room.created_by.username, existing_room.created_by.username, existing_room.opponent.username, self.user)
            if (self.user.username == existing_room.created_by.username):
                opponent = existing_room.opponent.username
            else:
                opponent = existing_room.created_by.username
            return ({"status": 4, "room_name": existing_room.name, "opponent" : opponent, "group_name": f"matchmaking_{existing_room.name}" , "User_self" : self.user.username})

        if not WaitingUser.objects.filter(user=self.user).exists():
            WaitingUser.objects.create(user=self.user, level=user_level)

        waiting_users = WaitingUser.objects.exclude(user=self.user)

        print("MatchMaking 814", len(waiting_users), self.user, self.time_passed)
        self.time_passed += 1
        if self.time_passed >= 5: # TO DO INCREASE TO 10
            self.time_passed = 0
            WaitingUser.objects.filter(user=self.user).delete()
            room_name = str(uuid.uuid1()).replace('-', '')
            print("ROOM NAME", room_name)
            try:
                ai_user = CustomUser.objects.filter(Ai=True, Occupied=False).first()
                ai_user.Occupied = True
                ai_user.save()
                print("AI USER", ai_user)
                print("AI USER", ai_user.username)
                room = RoomName.objects.create(name=room_name, created_by=self.user, opponent=ai_user)

                return({"status": 3, "room_name": room_name, "opponent" : ai_user.username, "group_name": f"matchmaking_{room_name}", "User_self" : self.user.username})
            except:
                print("AI USER NOT FOUND")
        for waiting_user in waiting_users:
            level_difference = abs(user_level - waiting_user.level)
            self.time_passed = 0

            if level_difference <= 2:
                WaitingUser.objects.filter(user__in=[self.user, waiting_user.user]).delete()

                room_name = str(uuid.uuid1()).replace('-', '')
                room = RoomName.objects.create(name=room_name, created_by=self.user, opponent=waiting_user.user)

                return({"status": 2, "room_name": room_name, "opponent" : waiting_user.user.username, "group_name": f"matchmaking_{room_name}", "User_self" : self.user.username})

    @database_sync_to_async
    def leave_queue(self):
        print("MatchMaking 853", "User", self.user.username, "Left Queue")
        try:
            if self.freeroom:
                RoomName.objects.filter(Q(created_by=self.user) (friendly=False) | Q(opponent=self.user) (friendly=False)).delete()
                print("MatchMaking 856", "Room Deleted")
        except:
            print("MatchMaking 858", "Room Not Found")
        try:
            if self.group_name == "waitingroom":
                Tournament_Waitin.objects.filter(user=self.user).delete()
                print("MatchMaking 862", "Tournament User Deleted")
        except:
            pass
        WaitingUser.objects.filter(user=self.user).delete()
    
    async def handle_join_queue(self):
        self.queue_task = asyncio.create_task(self.queue_loop())

    async def sendAdvisor(self, result):
        print("MatchMaking Sending ADVISOR")
        if result['status'] == 2 or result['status'] == 3 or result['status'] == 4:
            if result['status'] == 4:
                result['status'] = 5
                await self.send(text_data=json.dumps(result))
                await asyncio.sleep(5)
                return
            result['status'] = 5
            await self.channel_layer.group_send(result["group_name"], {
                    "type": "chat.message",
                    "text": json.dumps(result)
                })
            await asyncio.sleep(5)
    
    @database_sync_to_async
    def getroom(self, roomname):
        try:
            RoomName.objects.get(name=roomname)
            return True
        except:
            return False

    async def queue_loop(self):
        result = ""
        while self.connected:
            await self.send(text_data=json.dumps({"status" : 1}))
            result = await self.join_queue()
            if result:
                print("MatchMaking 983", result)
                await self.channel_layer.group_add(result["group_name"], self.channel_name)
                self.group_name = result["group_name"]
                 # Send the result to the group
                await self.sendAdvisor(result)
                try:
                    print("MatchMaking 989", self.user, "Room Name", result["room_name"], await self.getroom(result["room_name"]))
                    if await self.getroom(result["room_name"]) == False:
                        await self.channel_layer.group_send(result["group_name"], {
                                "type": "chat.message",
                                "text": json.dumps({"status" : 6, "user" : result['opponent']})
                            })
                        print("MatchMaking 994 Restarting queue")
                        continue
                except:
                    print("MatchMaking 991", "Room Name", result["room_name"])
                result['status'] = 2
                await self.channel_layer.group_send(result["group_name"], {
                    "type": "chat.message",
                    "text": json.dumps(result)
                })
                break
            await asyncio.sleep(2)  # Wait for 1 second
        print("MatchMaking 858")
        # await self.channel_layer.group_discard(
        #     result["group_name"],
        #     self.channel_name
        # )

    async def chat_message(self, event):
    # Send a message to the WebSocket
        await self.send(text_data=event["text"])
    # async def receive(self, text_data):
    #     # text_data_json = json.loads(text_data)
    #     # content = text_data_json["action"]
    #     # await self.update_notifications()
    #     # # await self.send(text_data=json.dumps({
    #     # #     'message' : content
    #     # # }))

    # async def notifier(self, event):

    #     await self.send(text_data=json.dumps({
    #         'content' : event['message'],
    #         'read': event['status']

    #     }))