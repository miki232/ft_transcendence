# chat/consumers.py
import json
from asgiref.sync import async_to_sync, sync_to_async
from .models import Notifications
from channels.db import database_sync_to_async
from channels.generic.websocket import WebsocketConsumer, AsyncWebsocketConsumer

class ChatConsumer(WebsocketConsumer):
    def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = "chat_%s" % self.room_name
        print(self.scope["user"])

        # Join room group
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name, self.channel_name
        )
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name, {"type": "chat_message", "message": "message", "user": self.scope["user"].username}
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

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        await self.channel_layer.group_add(
            f"notifications_{self.user.id}", self.channel_name
        )
        print(f"Connected and joined group notifications_{self.user.id}")
        await self.accept()

        notificationslist = await self.get_notifications()
        for notification in notificationslist:
            await self.send(text_data=json.dumps(
                {
                    'content' : notification.content,
                    'read' : notification.read
                }
            ))

    @database_sync_to_async
    def get_notifications(self):
        return list(Notifications.objects.filter(user=self.user))

    @database_sync_to_async
    def update_notifications(self):
        Notifications.objects.filter(user=self.user, read=False).update(read=True)

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            f"notifications_{self.user.id}", self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        content = text_data_json["action"]
        print(content)
        await self.update_notifications()
        # await self.send(text_data=json.dumps({
        #     'message' : content
        # }))

    async def notifier(self, event):
        print("Notifier method called")
        print(event)

        await self.send(text_data=json.dumps({
            'content' : event['message'],
            'read': event['status']

        }))