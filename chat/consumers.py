# chat/consumers.py
import json
from asgiref.sync import async_to_sync

from channels.generic.websocket import WebsocketConsumer

class ChatConsumer(WebsocketConsumer):
    def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = "chat_%s" % self.room_name
        print(self.scope["user"])

        # Join room group
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name, self.channel_name
        )

        self.accept()

    def disconnect(self, close_code):
        # Leave room group
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name, self.channel_name
        )

    # Receive message from WebSocket
    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json["message"]

        # Send message to room group
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name, {"type": "chat_message", "message": message, "user": self.scope["user"].username}
        )

    # Receive message from room group
    def chat_message(self, event):
        message = event["message"]

        # Send message to WebSocket
        self.send(text_data=json.dumps({"message": message, "user": event["user"]}))

import json
from channels.generic.websocket import AsyncWebsocketConsumer
import random
import asyncio

# class PongConsumer(AsyncWebsocketConsumer):
#     players = []
#     def __init__(self, *args, **kwargs):
#         super().__init__(*args, **kwargs)
#         self.state = {}
    
#     async def connect(self):
#         self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
#         self.room_group_name = "pong_%s" % self.room_name
#         # self.room_group_name = 'pong'
#         self.user = self.scope['user']
#         print(self.user)
#         await self.channel_layer.group_add(
#             self.room_group_name,
#             self.channel_name
#         )

#         await self.accept()

#         self.players.append(self.user.username)
#         print(len(self.players))
#         if len(self.players) == 2:
#             self.state = {
#                 'ball_x': 400,
#                 'ball_y': 200,
#                 'ball_speed_x': random.choice([-0.5, 0.5]),
#                 'ball_speed_y': random.choice([-0.5, 0.5]),
#                 'paddle1_y': 150,
#                 'paddle2_y': 150,
#                 'score1': 0,
#                 'score2': 0,
#                 'up_player_paddle_y': 0,
#                 'down_player_paddle_y': 0,
#                 'up_player2_paddle_y': 0,
#                 'down_player2_paddle_y': 0,
#                 'player': self.user.username,
#             }
#             print(self.players[0])
#             print(self.players[1])

#             self.loop_task = asyncio.create_task(self.game_loop())

#     async def disconnect(self, close_code):
#         await self.channel_layer.group_discard(
#             self.room_group_name,
#             self.channel_name
#         )
#         self.players.remove(self.user.username)
#         self.loop_task.cancel()

#     async def receive(self, text_data):
#         message = json.loads(text_data)
#         print("was sent by ", message["user"])
#         if 'action' in message:
#             action = message['action']
#             print("was sent by2 ", message["user"])
#             print("action ", action)
#             if self.user.username == self.players[0]:
#                 print("was sent by3 ", message["user"])
#                 if action == 'move_up':
#                     self.state['up_player_paddle_y'] = 1
#                 elif action == 'move_down':
#                     self.state['down_player_paddle_y'] = 1
#             else:
#                 print("was sent by4 ", message["user"])
#                 if action == 'move_up':
#                     self.state['up_player2_paddle_y'] = 1
#                 elif action == 'move_down':
#                     self.state['down_player2_paddle_y'] = 1
#             await self.channel_layer.group_send(
#                 self.room_group_name,
#                 {
#                     'type': 'game_state',
#                     'state': self.state
#                 }
#             )

#     async def move_paddle_up(self):
#         if self.user.username == self.players[0]:
#             if self.state['paddle1_y'] > 0:
#                 self.state['paddle1_y'] -= 2
#         else:
#             if self.state['paddle2_y'] > 0:
#                 self.state['paddle2_y'] -= 2
#         await self.channel_layer.group_send(
#             self.room_group_name,
#             {
#                 'type': 'game_state',
#                 'state': self.state
#             }
#         )

#     async def move_paddle_down(self):
#         print("user ", self.user.username)
#         print("player[0] ", self.players[0])
#         print("player[1] ", self.players[1])
#         if self.user.username == self.players[0]:
#             if self.state['paddle1_y'] < 300:
#                 self.state['paddle1_y'] += 2
#         else:
#             if self.state['paddle2_y'] < 300:
#                 self.state['paddle2_y'] += 2   
        
#         await self.channel_layer.group_send(
#             self.room_group_name,
#             {
#                 'type': 'game_state',
#                 'state': self.state
#             }
#         )
    
#     # async def update_paddley_1_position(self):
#     #     if self.state['up_player_paddle_y'] == 1:
#     #         await self.move_paddle_up()
#     #         self.state['up_player_paddle_y'] = 0
#     #     if self.state['down_player_paddle_y'] == 1:
#     #         await self.move_paddle_down()
#     #         self.state['down_player_paddle_y'] = 0

#     # async def update_paddley_2_position(self):
#     #     if self.state['up_player2_paddle_y'] == 1:
#     #         await self.move_paddle_up()
#     #         self.state['up_player2_paddle_y'] = 0
#     #     if self.state['down_player2_paddle_y'] == 1:
#     #         await self.move_paddle_down()
#     #         self.state['down_player2_paddle_y'] = 0
    
#     async def update_paddley_1_position(self):
#         if self.state['up_player_paddle_y'] == 1:
#             if self.state['paddle1_y'] > 0:
#                 self.state['paddle1_y'] -= 2
#             self.state['up_player_paddle_y'] = 0
#         if self.state['down_player_paddle_y'] == 1:
#             if self.state['paddle1_y'] < 300:
#                 self.state['paddle1_y'] += 2
#             self.state['down_player_paddle_y'] = 0

#     async def update_paddley_2_position(self):
#         if self.state['up_player2_paddle_y'] == 1:
#             print("up_player2_paddle_y", self.state['paddle2_y'])
#             if self.state['paddle2_y'] > 0:
#                 self.state['paddle2_y'] -= 2
#             self.state['up_player2_paddle_y'] = 0
#         if self.state['down_player2_paddle_y'] == 1:
#             if self.state['paddle2_y'] < 300:
#                 self.state['paddle2_y'] += 2
#             self.state['down_player2_paddle_y'] = 0

#     async def game_loop(self):
#         while True:
#             await asyncio.sleep(0.002)  # Adjust the sleep time for desired speed
#             await self.update_ball_position()
#             await self.update_paddley_1_position()
#             await self.update_paddley_2_position()
#             await self.channel_layer.group_send(
#                 self.room_group_name,
#                 {
#                     'type': 'game_state',
#                     'state': self.state
#                 }
#             )

#     async def update_ball_position(self):
#         if self.state['ball_y'] <= 0 or self.state['ball_y'] >= 400:
#             self.state['ball_speed_y'] *= -1
#         if self.state['ball_x'] == 5 and (self.state['ball_y'] >= self.state['paddle1_y'] and self.state['ball_y'] <= self.state['paddle1_y'] + 100):
#             self.state['ball_speed_x'] *= -1
#         if self.state['ball_x'] == 785 and (self.state['ball_y'] >= self.state['paddle2_y'] and self.state['ball_y'] <= self.state['paddle2_y'] + 100):
#             self.state['ball_speed_x'] *= -1
#         if self.state['ball_x'] <= 0:
#             self.state['score2'] += 1
#             self.state['ball_x'] = 400
#             self.state['ball_y'] = 200
#             self.state['ball_speed_x'] = random.choice([-0.5, 0.5])
#             self.state['ball_speed_y'] = random.choice([-0.5, 0.5])
#         if self.state['ball_x'] >= 800:
#             self.state['score1'] += 1
#             self.state['ball_x'] = 400
#             self.state['ball_y'] = 200
#             self.state['ball_speed_x'] = random.choice([-0.5, 0.5])
#             self.state['ball_speed_y'] = random.choice([-0.5, 0.5])
#         self.state['ball_x'] += self.state['ball_speed_x']
#         self.state['ball_y'] += self.state['ball_speed_y']

#         # Check for collisions and scoring
#         # Update ball position based on speed and game logic

#     async def game_state(self, event):
#         await self.send(text_data=json.dumps(event['state']))


from channels.generic.websocket import AsyncWebsocketConsumer
import json
import asyncio

class PongConsumer(AsyncWebsocketConsumer):
    players = []
    spectators = []
    shared_state = None  # Class variable to store the shared state
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.spectator = False

    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = "pong_%s" % self.room_name
        self.user = self.scope['user']

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        self.players.append(self.user.username)

        if len(self.players) == 1:
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
            }
            PongConsumer.shared_state = self.state  # Store the state in the class variable
        elif len(self.players) == 2:
            # This is the second user, inherit the state from the first user
            self.state = PongConsumer.shared_state
        elif len(self.players) > 2:
            # This is a spectator
            self.spectators.append(self.user.username)
            self.spectator = True


        if len(self.players) >= 2:
            self.loop_task = asyncio.create_task(self.game_loop())

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        self.players.remove(self.user.username)
        # If the user was the last one, cancel the game loop task
        if len(self.players) == 0 and self.loop_task:
            self.loop_task.cancel()

    async def receive(self, text_data):
        message = json.loads(text_data)
        print(f"Message from {message['user']}")
        if self.spectator:
            return
        if 'action' in message:
            action = message['action']
            if self.user.username == self.players[0]:
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
        if player == self.players[0]:
            print("paddle1_y", self.state['paddle1_y'])
            if self.state['paddle1_y'] > 0:
                self.state['paddle1_y'] -= 5
        else:
            if self.state['paddle2_y'] > 0:
                self.state['paddle2_y'] -= 5

    async def move_paddle_down(self, player):
        if player == self.players[0]:
            print("paddle1_y", self.state['paddle1_y'])
            if self.state['paddle1_y'] < 300:
                self.state['paddle1_y'] += 5
        else:
            if self.state['paddle2_y'] < 300:
                self.state['paddle2_y'] += 5

    async def game_loop(self):
        while True:
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
                await self.move_paddle_up(self.players[0])
                self.state['up_player_paddle_y'] = 0
            if self.state['down_player_paddle_y'] == 1:
                await self.move_paddle_down(self.players[0])
                self.state['down_player_paddle_y'] = 0
            if self.state['up_player2_paddle_y'] == 1:
                await self.move_paddle_up(self.players[1])
                self.state['up_player2_paddle_y'] = 0
            if self.state['down_player2_paddle_y'] == 1:
                await self.move_paddle_down(self.players[1])
                self.state['down_player2_paddle_y'] = 0


            # Update ball position
            self.state['ball_x'] += self.state['ball_speed_x']
            self.state['ball_y'] += self.state['ball_speed_y']

            # Collision with top and bottom walls
            if self.state['ball_y'] <= 0:
                self.state['ball_speed_y'] = -self.state['ball_speed_y']
            if self.state['ball_y'] >= 400:
                self.state['ball_speed_y'] = -self.state['ball_speed_y']

            # Collision with paddles
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
                self.state['ball_x'] = 400
                self.state['ball_y'] = 200
                self.state['ball_speed_x'] = +self.state['ball_speed_y'] #can be used to increase the speed of the ball
                self.state['ball_speed_y'] = +self.state['ball_speed_y'] 
            elif self.state['ball_x'] >= 800:
                self.state['score1'] += 1
                self.state['ball_x'] = 400
                self.state['ball_y'] = 200
                self.state['ball_speed_x'] = +self.state['ball_speed_y']
                self.state['ball_speed_y'] = +self.state['ball_speed_y'] 

            # Send updated game state to all clients
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'game_state',
                    'state': self.state
                }
            )

    async def handle_message(self, event):
        message_type = event['type']
        if message_type == 'game_state':
            # We already have a handler for the game_state message
            pass  # Do nothing for now (game state is handled

    async def game_state(self, event):
        # Send the game state to the client
        await self.send(text_data=json.dumps(event['state']))
