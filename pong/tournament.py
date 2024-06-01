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
from .models import WaitingUser, RoomName, Tournament_Waitin, Tournament_Match, Tournament, TournametPlaceHolder

SCREEN_WIDTH = 800
SCREEN_HEIGHT = 400

# Paddle settings
PADDLE_WIDTH = 10
PADDLE_HEIGHT = 100
PADDLE_SPEED = 10

# Ball settings
BALL_SIZE = 5



def map_value(value, start1, stop1, start2, stop2):
    return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1))


def move_paddle(paddle_pos, target_pos, speed):
    if paddle_pos < target_pos:
        return min(paddle_pos + speed, target_pos)
    elif paddle_pos > target_pos:
        return max(paddle_pos - speed, target_pos)
    return paddle_pos

class TournamentConsumer(AsyncWebsocketConsumer):
    players = {}
    status = {}
    shared_state = {}  # Class variable to store the shared state

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.spectator = False
        self.spectators = []
        self.match = None
        self.user1 = None
        self.user2 = None
        self.reaction_delay = 1
        self.counter = 0
     
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = "pong_%s" % self.room_name
        self.user = self.scope['user']
        print("Pong Consumer 101", self.user)
        await self.accept()
        self.loop_task = None


        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        print("Pong Consumer 73", TournamentConsumer.players, "'",self.room_group_name, "'")
        if self.room_name not in TournamentConsumer.players:
            print("Pong Consumer 75", self.room_name)
            TournamentConsumer.players[self.room_name] = []
            TournamentConsumer.players[self.room_name].append(self.user.username)
        else:
            TournamentConsumer.players[self.room_name].append(self.user.username)
            print("Pong Consumer 79", TournamentConsumer.players, self.room_name)
        
        if self.room_name in TournamentConsumer.status and TournamentConsumer.status[self.room_name]:
            winner_of_the_room = await self.get_winner(self.room_name)
            await self.send(text_data=json.dumps({
                'message': 'Game Terminated',
                'victory' : winner_of_the_room
            }))
            await self.close()
            return
        else:
            TournamentConsumer.status[self.room_name] = False


        if self.room_name not in TournamentConsumer.shared_state:
            # This is the first user, initialize the state
            TournamentConsumer.shared_state[self.room_name] = {
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
            # TournamentConsumer.shared_state = self.state  # Store the state in the class variable

        print("Pong Consumer 149 Len of Player in room_name", len(TournamentConsumer.players[self.room_name]))
        if len(TournamentConsumer.players[self.room_name]) == 2:
            # This is the second user, inherit the state from the first user
            await self.start_game()
            print("Pong Consumer 155", self.user1, self.user2)

        elif len(TournamentConsumer.players[self.room_name]) > 2:
            # This is a spectator
            self.spectators.append(self.user.username)
            self.spectator = True


        if len(TournamentConsumer.players[self.room_name]) == 2:
            self.loop_task = asyncio.create_task(self.game_loop())

    async def start_game(self):
        self.user1 = await self.get_user(TournamentConsumer.players[self.room_name][0])
        self.user2 = await self.get_user(TournamentConsumer.players[self.room_name][1])
        print("User2", self.user2.username, "AI", self.user2.Ai)
        await self.get_room_istance_delete(self.room_name)
        self.match = await self.get_create_match(self.user1, self.user2)
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
            match = Tournament_Match.objects.filter(room_name=room_name).latest('date')

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
        winner = CustomUser.objects.get(username=winner)
        print("GET USER ", winner)
        print("MATCH: ", match)
        match.winner = winner
        print("FROME MATCH.WINNER " , match.winner.username)
        match.save()
        try:
            round = TournametPlaceHolder.objects.get(status=False)
            print("Pong Consumer 183", round.round, round.name, match.winner.username)
            if round.round== 1:
                toot = Tournament.objects.get(name=round.name)
                toot.winner = match.winner
                toot.save()
        except:
            pass

    @database_sync_to_async
    def get_user(self, username):
        return CustomUser.objects.get(username=username)

    @database_sync_to_async
    def get_create_match(self, user1, user2):
        print("TPURN Consumer 190", user1, user2, self.room_name)
        matchs = Tournament_Match.objects.get(room_name=self.room_name)
        return matchs

    @database_sync_to_async
    def get_match_from_db(self, roomname):
        print("Pong Consumer 239", roomname)
        return Tournament_Match.objects.get(room_name=roomname)

    @database_sync_to_async
    def delete_place_holder(self):
        try:
            placehorde = TournametPlaceHolder.objects.get(status=False)
            print("Pong Consumer 245", placehorde.name, self.user)
            tournament = Tournament.objects.get(name=placehorde.name, winner=self.user)
            if tournament:
                placehorde.delete()
        except:
            print("Pong Consumer 249", "No tournament to delete")

    async def disconnect(self, close_code):
        
        await self.delete_place_holder()
        # Remove the disconnected user from the players list and cancel the game loop task
        if (self.room_name in TournamentConsumer.status and TournamentConsumer.status[self.room_name]):
            return
        if self.user.username in TournamentConsumer.players[self.room_name]:
            TournamentConsumer.players[self.room_name].remove(self.user.username)
        # If there are no players left in the room, set status[self.room_name] to True
        if not TournamentConsumer.players[self.room_name]:
            TournamentConsumer.status[self.room_name] = True

        if self.loop_task is not None:
            self.loop_task.cancel()

        # If there's only one player left, stop the game and send a "Victory" message
        if len(TournamentConsumer.players[self.room_name]) == 1:
            TournamentConsumer.status[self.room_name] = True
            print("Pong Consumer 258", TournamentConsumer.players[self.room_name][0], " Disconneted from room ", self.room_name)
            print("------------------ RETRIVE MATCH FORM DB -----------------------------")
            matchdb = await self.get_match_from_db(self.room_name)
            self.match = matchdb
            print("------------------MATCH FORM DB IS: ", matchdb.id, self.match.id)
            print("DISCONNETED ", TournamentConsumer.players[self.room_name][0], "SETTING VICTORY")
            winner = TournamentConsumer.players[self.room_name][0]
            print("WINNER: ", winner, self.match.id)
            await self.set_winner(self.match, winner)
            self.state['victory'] = TournamentConsumer.players[self.room_name][0]
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
        print("Pong Consumer 280",f"User {self.scope['user']} disconnected with code {close_code}")

    async def receive(self, text_data):
        message = json.loads(text_data)
        print("Pong Consumer 284",f"Message from {message['user']}")
        if self.spectator:
            return
        if 'action' in message:
            action = message['action']
            if self.user.username == TournamentConsumer.players[self.room_name][0]:
                if action == 'move_up':
                    TournamentConsumer.shared_state[self.room_name]['up_player_paddle_y'] = 1
                elif action == 'move_down':
                    TournamentConsumer.shared_state[self.room_name]['down_player_paddle_y'] = 1
            else:
                if action == 'move_up':
                    TournamentConsumer.shared_state[self.room_name]['up_player2_paddle_y'] = 1
                elif action == 'move_down':
                    TournamentConsumer.shared_state[self.room_name]['down_player2_paddle_y'] = 1

    async def move_paddle_up(self, player):
        if player == TournamentConsumer.players[self.room_name][0]:
            print("Pong Consumer 302","paddle1_y", TournamentConsumer.shared_state[self.room_name]['paddle1_y'])
            if TournamentConsumer.shared_state[self.room_name]['paddle1_y'] > 0:
                TournamentConsumer.shared_state[self.room_name]['paddle1_y'] -= 5
        else:
            if TournamentConsumer.shared_state[self.room_name]['paddle2_y'] > 0:
                TournamentConsumer.shared_state[self.room_name]['paddle2_y'] -= 5

    async def move_paddle_down(self, player):
        if player == TournamentConsumer.players[self.room_name][0]:
            print("Pong Consumer 311","paddle1_y", TournamentConsumer.shared_state[self.room_name]['paddle1_y'])
            if TournamentConsumer.shared_state[self.room_name]['paddle1_y'] < 300:
                TournamentConsumer.shared_state[self.room_name]['paddle1_y'] += 5
        else:
            if TournamentConsumer.shared_state[self.room_name]['paddle2_y'] < 300:
                TournamentConsumer.shared_state[self.room_name]['paddle2_y'] += 5

    def check_collision(self):
        if (
            TournamentConsumer.shared_state[self.room_name]['ball_x'] <= 10
            and TournamentConsumer.shared_state[self.room_name]['paddle1_y'] <= TournamentConsumer.shared_state[self.room_name]['ball_y'] <= TournamentConsumer.shared_state[self.room_name]['paddle1_y'] + 100
        ):
            diff = TournamentConsumer.shared_state[self.room_name]['ball_y'] - (TournamentConsumer.shared_state[self.room_name]['paddle1_y'] + 50)
            rad = math.radians(45)
            angle = map_value(diff, -50, 50, -rad, rad)
            # TournamentConsumer.shared_state[self.room_name]['ball_speed_x'] = -TournamentConsumer.shared_state[self.room_name]['ball_speed_x']
            TournamentConsumer.shared_state[self.room_name]['ball_speed_x'] = 5 * math.cos(angle)
            TournamentConsumer.shared_state[self.room_name]['ball_speed_y'] = 5 * math.sin(angle)
        if (
            TournamentConsumer.shared_state[self.room_name]['ball_x'] >= 790
            and TournamentConsumer.shared_state[self.room_name]['paddle2_y'] <= TournamentConsumer.shared_state[self.room_name]['ball_y'] <= TournamentConsumer.shared_state[self.room_name]['paddle2_y'] + 100
        ):
            # TournamentConsumer.shared_state[self.room_name]['ball_speed_x'] = -TournamentConsumer.shared_state[self.room_name]['ball_speed_x']
            diff = TournamentConsumer.shared_state[self.room_name]['ball_y'] - (TournamentConsumer.shared_state[self.room_name]['paddle2_y'] + 50)
            angle = map_value(diff, -50, 50, math.radians(255), math.radians(135))
            # TournamentConsumer.shared_state[self.room_name]['ball_speed_x'] = -TournamentConsumer.shared_state[self.room_name]['ball_speed_x']
            TournamentConsumer.shared_state[self.room_name]['ball_speed_x'] = 5 * math.cos(angle)
            TournamentConsumer.shared_state[self.room_name]['ball_speed_y'] = 5 * math.sin(angle)

    async def game_loop(self):
        last_ai_update_time = time.time()
        print(f"Room: {self.room_name}, State: {TournamentConsumer.shared_state[self.room_name]}")
        while (TournamentConsumer.status[self.room_name]) == False:
            current_time = time.time()
            await asyncio.sleep(0.01)
            if self.spectator:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'game_state',
                        'state': TournamentConsumer.shared_state[self.room_name]
                    }
                )
                continue
            # Move paddles based on player input
            if TournamentConsumer.shared_state[self.room_name]['up_player_paddle_y'] == 1:
                await self.move_paddle_up(TournamentConsumer.players[self.room_name][0])
                TournamentConsumer.shared_state[self.room_name]['up_player_paddle_y'] = 0
            if TournamentConsumer.shared_state[self.room_name]['down_player_paddle_y'] == 1:
                await self.move_paddle_down(TournamentConsumer.players[self.room_name][0])
                TournamentConsumer.shared_state[self.room_name]['down_player_paddle_y'] = 0
            if TournamentConsumer.shared_state[self.room_name]['up_player2_paddle_y'] == 1:
                await self.move_paddle_up(TournamentConsumer.players[self.room_name][1])
                TournamentConsumer.shared_state[self.room_name]['up_player2_paddle_y'] = 0
            if TournamentConsumer.shared_state[self.room_name]['down_player2_paddle_y'] == 1:
                await self.move_paddle_down(TournamentConsumer.players[self.room_name][1])
                TournamentConsumer.shared_state[self.room_name]['down_player2_paddle_y'] = 0


            # Update ball position
            TournamentConsumer.shared_state[self.room_name]['ball_x'] += TournamentConsumer.shared_state[self.room_name]['ball_speed_x']
            TournamentConsumer.shared_state[self.room_name]['ball_y'] += TournamentConsumer.shared_state[self.room_name]['ball_speed_y']

            # Collision with top and bottom walls
            if TournamentConsumer.shared_state[self.room_name]['ball_y'] <= 0:
                TournamentConsumer.shared_state[self.room_name]['ball_speed_y'] = -TournamentConsumer.shared_state[self.room_name]['ball_speed_y']
            if TournamentConsumer.shared_state[self.room_name]['ball_y'] >= 400:
                TournamentConsumer.shared_state[self.room_name]['ball_speed_y'] = -TournamentConsumer.shared_state[self.room_name]['ball_speed_y']

            # # Collision with paddles
            self.check_collision()

            # Scoring
            if TournamentConsumer.shared_state[self.room_name]['ball_x'] <= 0:
                TournamentConsumer.shared_state[self.room_name]['score2'] += 1
                await self.set_score(self.match, TournamentConsumer.shared_state[self.room_name]['score2'], TournamentConsumer.players[self.room_name][1])
                TournamentConsumer.shared_state[self.room_name]['ball_x'] = 400
                TournamentConsumer.shared_state[self.room_name]['ball_y'] = 200
                # TournamentConsumer.shared_state[self.room_name]['ball_speed_x'] = +TournamentConsumer.shared_state[self.room_name]['ball_speed_y'] #can be used to increase the speed of the ball
                # TournamentConsumer.shared_state[self.room_name]['ball_speed_y'] = +TournamentConsumer.shared_state[self.room_name]['ball_speed_y'] 
                print("Pong Consumer 410","ballspeed 1", TournamentConsumer.shared_state[self.room_name]['ball_speed_x'], TournamentConsumer.shared_state[self.room_name]['ball_speed_y'])

                TournamentConsumer.shared_state[self.room_name]['ball_speed_x'] = 3 #can be used to increase the speed of the ball
                TournamentConsumer.shared_state[self.room_name]['ball_speed_y'] = 3
                print("Pong Consumer 414","ballspeed 1", TournamentConsumer.shared_state[self.room_name]['ball_speed_x'], TournamentConsumer.shared_state[self.room_name]['ball_speed_y'])

            elif TournamentConsumer.shared_state[self.room_name]['ball_x'] >= 800:
                TournamentConsumer.shared_state[self.room_name]['score1'] += 1
                await self.set_score(self.match, TournamentConsumer.shared_state[self.room_name]['score1'], TournamentConsumer.players[self.room_name][0])
                TournamentConsumer.shared_state[self.room_name]['ball_x'] = 400
                TournamentConsumer.shared_state[self.room_name]['ball_y'] = 200
                # TournamentConsumer.shared_state[self.room_name]['ball_speed_x'] = +TournamentConsumer.shared_state[self.room_name]['ball_speed_y']
                # TournamentConsumer.shared_state[self.room_name]['ball_speed_y'] = +TournamentConsumer.shared_state[self.room_name]['ball_speed_y'] 
                print("Pong Consumer 423","ballspeed 1", TournamentConsumer.shared_state[self.room_name]['ball_speed_x'], TournamentConsumer.shared_state[self.room_name]['ball_speed_y'])
                TournamentConsumer.shared_state[self.room_name]['ball_speed_x'] = -3 #can be used to increase the speed of the ball
                TournamentConsumer.shared_state[self.room_name]['ball_speed_y'] = -3
                print("Pong Consumer 426","ballspeed 1", TournamentConsumer.shared_state[self.room_name]['ball_speed_x'], TournamentConsumer.shared_state[self.room_name]['ball_speed_y'])

            if TournamentConsumer.shared_state[self.room_name]['score1']  >= 7 or TournamentConsumer.shared_state[self.room_name]['score2'] >= 7:
                if TournamentConsumer.shared_state[self.room_name]['score1'] >= 7:
                    await self.set_winner(self.match, TournamentConsumer.players[self.room_name][0])
                elif TournamentConsumer.shared_state[self.room_name]['score2'] >= 7:
                    await self.set_winner(self.match, TournamentConsumer.players[self.room_name][1])
                TournamentConsumer.status[self.room_name] = True
                
            # Send updated game state to all clients
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'game_state',
                    'state': TournamentConsumer.shared_state[self.room_name]
                }
            )
        if self.room_name in TournamentConsumer.status and TournamentConsumer.status[self.room_name]:
            print("Pong Consumer 444","THE winner is", self.match.winner)
            TournamentConsumer.shared_state[self.room_name]['victory'] = self.match.winner.username
            await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game_state',
                'state': TournamentConsumer.shared_state[self.room_name]
            }
            )
            await asyncio.sleep(5.5)  # Wait for 1 second
            await self.close()
            return
        # print("Pong Consumer 456","Game Ended")
        # await self.remove_losers_from_room()
        # print("Pong Consumer 457 Starting next match", TournamentConsumer.players[self.room_name])
        
    async def remove_losers_from_room(self):
        for player in TournamentConsumer.players[self.room_name]:
            if player not in [self.match.winner.username]:
                print("Pong Consumer 463", player, " Removed from room")
                TournamentConsumer.players[self.room_name].remove(player)
        print("Pong Consumer 465", "Players in room", TournamentConsumer.players[self.room_name])
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )


    async def handle_message(self, event):
        message_type = event['type']
        if message_type == 'game_state':
            # We already have a handler for the game_state message
            pass  # Do nothing for now (game state is handled

    async def game_state(self, event):
        # Send the game state to the client
        await self.send(text_data=json.dumps(event['state']))
