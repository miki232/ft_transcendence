# pong/consumers.py
import json
from asgiref.sync import async_to_sync

from channels.generic.websocket import WebsocketConsumer
from channels.generic.websocket import AsyncWebsocketConsumer
import json
import asyncio
import random

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
