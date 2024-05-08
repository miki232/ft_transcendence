# pong/consumers.py
import json
import uuid
import asyncio
import random
import time

from asgiref.sync import async_to_sync
from channels.db import database_sync_to_async
from channels.generic.websocket import WebsocketConsumer
from channels.generic.websocket import AsyncWebsocketConsumer
from django.core.cache import cache
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Q

from accounts.models import Match, CustomUser
from .models import WaitingUser, RoomName

SCREEN_WIDTH = 800
SCREEN_HEIGHT = 400

# Paddle settings
PADDLE_WIDTH = 10
PADDLE_HEIGHT = 100
PADDLE_SPEED = 10

# Ball settings
BALL_SIZE = 5

reaction_delay = 0.5
counter = 0
ai_paddle_pos = SCREEN_HEIGHT // 2 - PADDLE_HEIGHT // 2

ai_target_pos = ai_paddle_pos


def ai_update(ball_pos, ball_velocity):
    global ai_target_pos, counter

    # Only update the AI's target position every 'reaction_delay' frames
    counter += 2
    if counter % reaction_delay != 0:
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

        # Set the target position for the AI paddle with some randomness
        randomness = random.uniform(-50, 50)
        ai_target_pos = intercept_y - PADDLE_HEIGHT // 2 + randomness

        # Ensure the target position is within paddle movement limits
        ai_target_pos = max(0, min(SCREEN_HEIGHT - PADDLE_HEIGHT, ai_target_pos))
        print("AI TARGET POS", ai_target_pos)

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

    @database_sync_to_async
    def getAi(self):
        return RoomName.objects.get(name=self.room_name).opponent

    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = "pong_%s" % self.room_name
        self.user = self.scope['user']
        ai = await self.getAi()
        print(self.user, "opponent", ai.username, ai.Ai)
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
                'ball_y': 200,
                'ball_speed_x': random.choice([-3, 3]),
                'ball_speed_y': random.choice([-3, 3]),
                'paddle1_y': 150,
                'paddle2_y': 150,
                'score1': 0,
                'score2': 0,
                'up_player_paddle_y': 0,
                'down_player_paddle_y': 0,
                'up_player2_paddle_y': 0,
                'down_player2_paddle_y': 0,
                'player': self.user.username,
                'victory' : "none"
            }
            PongConsumer.shared_state = self.state  # Store the state in the class variable
            if ai.Ai:
                print("AI", ai.username, len(PongConsumer.players[self.room_name]))
                PongConsumer.players[self.room_name].append(ai.username)
            
            print("SUCA", len(PongConsumer.players[self.room_name]))
        if len(PongConsumer.players[self.room_name]) == 2:
            print("SUCA2", self.user.Ai)
            # This is the second user, inherit the state from the first user
            self.state = PongConsumer.shared_state
            await self.start_game()
            print(self.user1, self.user2)
            if (ai.Ai):
                if (self.user1 == None):
                    self.user1 = ai
                elif (self.user2 == None):
                    self.user2 = ai
            print(self.user1, self.user2)

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
        print(score, user, self.match.user1)
        if (self.match.user1 == CustomUser.objects.get(username=user)):
            match.score_user1 = score
        else:
            match.score_user2 = score
        match.save()

    @database_sync_to_async
    def set_winner(self, match, winner):
        print(winner, "Set winner", self.room_name, self.room_group_name)
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
        print(roomname)
        return Match.objects.get(room_name=roomname)

    async def disconnect(self, close_code):
        # Remove the disconnected user from the players list and cancel the game loop task
        if (self.room_name in PongConsumer.status and PongConsumer.status[self.room_name]):
            return
        if self.user.username in PongConsumer.players[self.room_name]:
            PongConsumer.players[self.room_name].remove(self.user.username)
        # If there are no players left in the room, set status[self.room_name] to True
        if not PongConsumer.players[self.room_name]:
            PongConsumer.status[self.room_name] = True

        if self.loop_task is not None:
            self.loop_task.cancel()

        # If there's only one player left, stop the game and send a "Victory" message
        if len(PongConsumer.players[self.room_name]) == 1:
            PongConsumer.status[self.room_name] = True
            print(PongConsumer.players[self.room_name][0], " Disconneted from room ", self.room_name)
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
        print(f"User {self.scope['user']} disconnected with code {close_code}")

    async def receive(self, text_data):
        message = json.loads(text_data)
        print(f"Message from {message['user']}")
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
            print("paddle1_y", self.state['paddle1_y'])
            if self.state['paddle1_y'] > 0:
                self.state['paddle1_y'] -= 5
        else:
            if self.state['paddle2_y'] > 0:
                self.state['paddle2_y'] -= 5

    async def move_paddle_down(self, player):
        if player == PongConsumer.players[self.room_name][0]:
            print("paddle1_y", self.state['paddle1_y'])
            if self.state['paddle1_y'] < 300:
                self.state['paddle1_y'] += 5
        else:
            if self.state['paddle2_y'] < 300:
                self.state['paddle2_y'] += 5

    async def game_loop(self):
        last_ai_update_time = time.time()
        while (PongConsumer.status[self.room_name]) == False:
            current_time = time.time()
            # print(self.user1.Ai, "AI", self.user1.username, self.user2.Ai, "AI2", self.user2.username)
            """Find who is the AI and move the paddle accordingly"""
            if (self.user1.Ai or self.user2.Ai):
                if current_time - last_ai_update_time >= 1:
                    ai_update([self.state['ball_x'], self.state['ball_y']], [self.state['ball_speed_x'], self.state['ball_speed_y']])
                    last_ai_update_time = current_time
                if (self.user1.Ai):
                    self.state['paddle1_y'] = move_paddle(self.state['paddle1_y'], ai_target_pos, 5)
                else:
                    self.state['paddle2_y'] = move_paddle(self.state['paddle2_y'], ai_target_pos, 5)
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
                print("up_player_paddle_y")
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
            if self.state['ball_y'] <= 0:
                self.state['ball_speed_y'] = -self.state['ball_speed_y']
            if self.state['ball_y'] >= 400:
                self.state['ball_speed_y'] = -self.state['ball_speed_y']

            # # Collision with paddles
            if (
                self.state['ball_x'] <= 10
                and self.state['paddle1_y'] <= self.state['ball_y'] <= self.state['paddle1_y'] + 100
            ):
                self.state['ball_speed_x'] = -self.state['ball_speed_x']
            if (
                self.state['ball_x'] >= 790
                and self.state['paddle2_y'] <= self.state['ball_y'] <= self.state['paddle2_y'] + 100
            ):
                self.state['ball_speed_x'] = -self.state['ball_speed_x']
            # Scoring
            if self.state['ball_x'] <= 0:
                self.state['score2'] += 1
                await self.set_score(self.match, self.state['score2'], PongConsumer.players[self.room_name][1])
                self.state['ball_x'] = 400
                self.state['ball_y'] = 200
                self.state['ball_speed_x'] = +self.state['ball_speed_y'] #can be used to increase the speed of the ball
                self.state['ball_speed_y'] = +self.state['ball_speed_y'] 
            elif self.state['ball_x'] >= 800:
                self.state['score1'] += 1
                await self.set_score(self.match, self.state['score1'], PongConsumer.players[self.room_name][0])
                self.state['ball_x'] = 400
                self.state['ball_y'] = 200
                self.state['ball_speed_x'] = +self.state['ball_speed_y']
                self.state['ball_speed_y'] = +self.state['ball_speed_y'] 
            if self.state['score1']  >= 7 or self.state['score2'] >= 7:
                if self.state['score1'] >= 7:
                    await self.set_winner(self.match, PongConsumer.players[self.room_name][0])
                elif self.state['score2'] >= 7:
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
            print("THE winner is", self.match.winner)
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
    async def connect(self):
        self.user = self.scope["user"]
        print(self.user)
        await self.accept()
        self.time_passed = 0
        self.connected = True
        # notificationslist = await self.get_notifications()
        # for notification in notificationslist:
        #     await self.send(text_data=json.dumps(
        #         {
        #             'content' : notification.content,
        #             'read' : notification.read
        #         }
        #     ))

    async def disconnect(self, close_code):
        print(self.user, "Disconnected")
        self.connected = False
        await self.leave_queue()
        self.queue_task.cancel()
        
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        action = text_data_json['action']
        print(action)
        await self.send(json.dumps({"status": "Joining Queue"}))
        if action == 'join_queue':
            await self.handle_join_queue()
        elif action == 'leave_queue':
            await self.leave_queue()

    @database_sync_to_async
    def join_queue(self):
        user_level = self.user.calculate_level()

        existing_room = RoomName.objects.filter(Q(created_by=self.user) | Q(opponent=self.user)).first()
        if existing_room:
            print("ss", self.user.username == existing_room.created_by.username, existing_room.created_by.username, existing_room.opponent.username, self.user)
            if (self.user.username == existing_room.created_by.username):
                opponent = existing_room.opponent.username
            else:
                opponent = existing_room.created_by.username
            return ({"status": 2, "room_name": existing_room.name, "opponent" : opponent, "group_name": f"matchmaking_{existing_room.name}" , "User_self" : self.user.username})

        if not WaitingUser.objects.filter(user=self.user).exists():
            WaitingUser.objects.create(user=self.user, level=user_level)

        waiting_users = WaitingUser.objects.exclude(user=self.user)

        print("Suca", len(waiting_users), self.user, self.time_passed)
        self.time_passed += 1
        if self.time_passed >= 10:
            self.time_passed = 0
            WaitingUser.objects.filter(user=self.user).delete()
            room_name = str(uuid.uuid1()).replace('-', '')
            ai_user = CustomUser.objects.get(Ai=True)
            print("AI USER", ai_user.username)
            room = RoomName.objects.create(name=room_name, created_by=self.user, opponent=ai_user)

            return({"status": 2, "room_name": room_name, "opponent" : ai_user.username, "group_name": f"matchmaking_{room_name}", "User_self" : self.user.username})
        for waiting_user in waiting_users:
            print("SUCA")
            level_difference = abs(user_level - waiting_user.level)

            if level_difference <= 2:
                WaitingUser.objects.filter(user__in=[self.user, waiting_user.user]).delete()

                room_name = str(uuid.uuid1()).replace('-', '')
                room = RoomName.objects.create(name=room_name, created_by=self.user, opponent=waiting_user.user)

                return({"status": 2, "room_name": room_name, "opponent" : waiting_user.user.username, "group_name": f"matchmaking_{room_name}", "User_self" : self.user.username})

    @database_sync_to_async
    def leave_queue(self):
        WaitingUser.objects.filter(user=self.user).delete()
    
    async def handle_join_queue(self):
        self.queue_task = asyncio.create_task(self.queue_loop())

    async def queue_loop(self):
        result = ""
        while self.connected:
            await self.send(text_data=json.dumps({"status" : 1}))
            result = await self.join_queue()
            if result:
                await self.channel_layer.group_add(result["group_name"], self.channel_name)
                 # Send the result to the group
                
                await self.channel_layer.group_send(result["group_name"], {
                    "type": "chat.message",
                    "text": json.dumps(result)
                })
                break
            await asyncio.sleep(2)  # Wait for 1 second
        print("SUCAaaaaa")
        await self.channel_layer.group_discard(
            result["group_name"],
            self.channel_name
        )

    async def chat_message(self, event):
    # Send a message to the WebSocket
        await self.send(text_data=event["text"])
    # async def receive(self, text_data):
    #     # text_data_json = json.loads(text_data)
    #     # content = text_data_json["action"]
    #     # print(content)
    #     # await self.update_notifications()
    #     # # await self.send(text_data=json.dumps({
    #     # #     'message' : content
    #     # # }))

    # async def notifier(self, event):
    #     print("Notifier method called")
    #     print(event)

    #     await self.send(text_data=json.dumps({
    #         'content' : event['message'],
    #         'read': event['status']

    #     }))