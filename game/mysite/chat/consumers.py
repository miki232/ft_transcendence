import json

from channels.layers import get_channel_layer
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
import time

class ChatConsumer(WebsocketConsumer):
    def connect(self):
        self.room_group_name = "chat"

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

class PongConsumer(WebsocketConsumer):
    def connect(self):
        self.room_group_name = "pong"
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name,
            self.channel_name
        )
        self.accept()
        self.paddle_y = 0
        self.ball_x = 400
        self.ball_y = 200
        self.scope['player_paddle_y'] = self.scope['query_string'].decode()

    def disconnect(self, close_code):
        pass

    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        action = text_data_json.get('action')
        if action == 'move_up':
            # Process the move up action
            self.move_paddle_up()
        elif action == 'move_down':
            # Process the move down action
            self.move_paddle_down() 
        # elif action == 'start_game':
        #     # Process the start game action
        #     self.start_game()

            # self.start_game()

    def paddle_moved(self, event):
        # Handle the paddle moved event
        self.send(json.dumps({'opponent_paddle_y': event['opponent_paddle_y']}))

    def ball_moved(self, event):
        # Handle the ball moved event
        self.send(json.dumps({'ball_x': event['ball_x'], 'ball_y': event['ball_y']}))
    
    # def start_game(self):
        # Start the game


    def move_paddle_up(self):
        self.paddle_y -= 10
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type': 'paddle_moved',
                'opponent_paddle_y': self.paddle_y
            }
        )
        # self.send(json.dumps({'opponent_paddle_y': self.paddle_y}))

    def move_paddle_down(self):
        self.paddle_y += 10
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type': 'paddle_moved',
                'opponent_paddle_y': self.paddle_y
            }
        )
        # self.send(json.dumps({'opponent_paddle_y': self.paddle_y}))