# chat/consumers.py
import json
from asgiref.sync import async_to_sync, sync_to_async
from .models import Notifications
import asyncio
from channels.db import database_sync_to_async
from channels.generic.websocket import WebsocketConsumer, AsyncWebsocketConsumer

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"chat_{self.room_name}"

        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json["message"]
        self.user_id = self.scope["user"].id

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name, {"type": "chat.message", "message": message, "user_id": self.user_id}
        )

    # Receive message from room group
    async def chat_message(self, event):
        message = event["message"]
        user_id = event["user_id"]

        # Send message to WebSocket
        await self.send(text_data=json.dumps({"message": message, "user_id": user_id}))

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        await self.channel_layer.group_add(
            f"notifications_{self.user.id}", self.channel_name
        )
        print("Connect 53", f"Connected and joined group notifications_{self.user.id}")
        await self.accept()
        self.notificationloop = asyncio.create_task(self.notificationloop())
        # notificationslist = await self.get_notifications()
        # for notification in notificationslist:
        #     await self.send(text_data=json.dumps(
        #         {
        #             'content' : notification.content,
        #             'read' : notification.read
        #         }
        #     ))

    async def notificationloop(self):
        while True:
            notificationslist = await self.get_notifications()
            for notification in notificationslist:
                await self.send(text_data=json.dumps(
                    {
                        'content' : notification.content,
                        'read' : notification.read
                    }
                ))
            await asyncio.sleep(15)

    @database_sync_to_async
    def get_notifications(self):
        print("Get Notifications 67", self.user, " dd ", self.user.id)
        return list(Notifications.objects.filter(user=self.user.id, read=False))

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
        print("Receive 82", content)
        await self.update_notifications()
        # await self.send(text_data=json.dumps({
        #     'message' : content
        # }))

    async def notifier(self, event):
        print("Notifier 89", "Notifier method called")
        print("Notifier 90", event)

        await self.send(text_data=json.dumps({
            'content' : event['message'],
            'read': event['status']

        }))