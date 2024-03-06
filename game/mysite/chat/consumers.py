import json

from channels.layers import get_channel_layer
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
import time

class ChatConsumer(WebsocketConsumer):
    def connect(self):
        self.room_group_name = "chat"
        self.user = self.scope["user"]
        print(self.user)
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name,
            self.channel_name
        )

        self.accept()

    def disconnect(self, close_code):
        pass

    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json["message"]
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": message
            }
        )
    
    def chat_message(self, event):
        message = event["message"]

        self.send(text_data=json.dumps({
            "type": "chat",
            "message": message
        }))

# class PongConsumer(WebsocketConsumer):
#     def connect(self):
#         self.room_group_name = "pong"
#         async_to_sync(self.channel_layer.group_add)(
#             self.room_group_name,
#             self.channel_name
#         )
#         self.accept()
#         self.paddle_y = 0
#         self.ball_x = 400
#         self.ball_y = 200
#         self.scope['player_paddle_y'] = self.scope['query_string'].decode()

#     def disconnect(self, close_code):
#         pass

#     def receive(self, text_data):
#         text_data_json = json.loads(text_data)
#         action = text_data_json.get('action')
#         if action == 'move_up':
#             # Process the move up action
#             self.move_paddle_up()
#         elif action == 'move_down':
#             # Process the move down action
#             self.move_paddle_down() 
#         # elif action == 'start_game':
#         #     # Process the start game action
#         #     self.start_game()

#             # self.start_game()

#     def paddle_moved(self, event):
#         # Handle the paddle moved event
#         self.send(json.dumps({'opponent_paddle_y': event['opponent_paddle_y']}))

#     def ball_moved(self, event):
#         # Handle the ball moved event
#         self.send(json.dumps({'ball_x': event['ball_x'], 'ball_y': event['ball_y']}))
    
#     # def start_game(self):
#         # Start the game


#     def move_paddle_up(self):
#         self.paddle_y -= 10
#         async_to_sync(self.channel_layer.group_send)(
#             self.room_group_name,
#             {
#                 'type': 'paddle_moved',
#                 'opponent_paddle_y': self.paddle_y
#             }
#         )
#         # self.send(json.dumps({'opponent_paddle_y': self.paddle_y}))

#     def move_paddle_down(self):
#         self.paddle_y += 10
#         async_to_sync(self.channel_layer.group_send)(
#             self.room_group_name,
#             {
#                 'type': 'paddle_moved',
#                 'opponent_paddle_y': self.paddle_y
#             }
#         )
        # self.send(json.dumps({'opponent_paddle_y': self.paddle_y}))

# consumers.py

import json
from channels.generic.websocket import AsyncWebsocketConsumer
import random
import asyncio

class PongConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = 'pong'
        self.user = self.scope['user']
        print(self.user)
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        self.state = {
            'ball_x': 400,
            'ball_y': 200,
            'ball_speed_x': random.choice([-0.5, 0.5]),
            'ball_speed_y': random.choice([-0.5, 0.5]),
            'paddle1_y': 150,
            'paddle2_y': 150,
            'score1': 0,
            'score2': 0,
            'up_player_paddle_y': 0,
            'down_player_paddle_y': 0
        }

        self.loop_task = asyncio.create_task(self.game_loop())

    async def disconnect(self, close_code):
        self.loop_task.cancel()
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        message = json.loads(text_data)

        if 'action' in message:
            action = message['action']

            if action == 'move_up':
                self.state['up_player_paddle_y'] = 1
            elif action == 'move_down':
                self.state['down_player_paddle_y'] = 1

    async def move_paddle_up(self):
        if self.state['paddle1_y'] > 0:
            self.state['paddle1_y'] -= 2
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'game_state',
                    'state': self.state
                }
            )

    async def move_paddle_down(self):
        if self.state['paddle1_y'] < 300:
            self.state['paddle1_y'] += 2
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'game_state',
                    'state': self.state
                }
            )
    
    async def update_paddley_1_position(self):
        if self.state['up_player_paddle_y'] == 1:
            await self.move_paddle_up()
            self.state['up_player_paddle_y'] = 0
        if self.state['down_player_paddle_y'] == 1:
            await self.move_paddle_down()
            self.state['down_player_paddle_y'] = 0
    
    async def game_loop(self):
        while True:
            await asyncio.sleep(0.002)  # Adjust the sleep time for desired speed
            await self.update_ball_position()
            await self.update_paddley_1_position()
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'game_state',
                    'state': self.state
                }
            )

    async def update_ball_position(self):
        if self.state['ball_y'] <= 0 or self.state['ball_y'] >= 400:
            self.state['ball_speed_y'] *= -1
        if self.state['ball_x'] == 5 and (self.state['ball_y'] >= self.state['paddle1_y'] and self.state['ball_y'] <= self.state['paddle1_y'] + 100):
            self.state['ball_speed_x'] *= -1
        if self.state['ball_x'] == 785 and (self.state['ball_y'] >= self.state['paddle2_y'] and self.state['ball_y'] <= self.state['paddle2_y'] + 100):
            self.state['ball_speed_x'] *= -1
        if self.state['ball_x'] <= 0:
            self.state['score2'] += 1
            self.state['ball_x'] = 400
            self.state['ball_y'] = 200
            self.state['ball_speed_x'] = random.choice([-0.5, 0.5])
            self.state['ball_speed_y'] = random.choice([-0.5, 0.5])
        if self.state['ball_x'] >= 800:
            self.state['score1'] += 1
            self.state['ball_x'] = 400
            self.state['ball_y'] = 200
            self.state['ball_speed_x'] = random.choice([-0.5, 0.5])
            self.state['ball_speed_y'] = random.choice([-0.5, 0.5])
        self.state['ball_x'] += self.state['ball_speed_x']
        self.state['ball_y'] += self.state['ball_speed_y']

        # Check for collisions and scoring
        # Update ball position based on speed and game logic

    async def game_state(self, event):
        await self.send(text_data=json.dumps(event['state']))