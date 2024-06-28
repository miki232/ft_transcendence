# chat/consumers.py
import json
from asgiref.sync import async_to_sync, sync_to_async
from .models import Notifications, Chat_RoomName, Message
import asyncio
from channels.db import database_sync_to_async

from channels.generic.websocket import WebsocketConsumer, AsyncWebsocketConsumer

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"chat_{self.room_name}"
        self.user = self.scope["user"]
        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        await self.send_message_from_database()


    @database_sync_to_async
    def retrive_message_room(self, room_name):
        return list(Message.objects.filter(name=room_name))

    @database_sync_to_async
    def get_all_messages_for_chat(self, chat):
        # Assuming 'content' is the related name for accessing Message objects related to a Chat.
        # Adjust the method to match your model's structure.
        return list(chat.content.all())

    @database_sync_to_async
    def get_messages_n_user_for_chat(self, chat):
        return chat.content, chat.sender, chat.timestamp

    # Cerca la Room
    async def send_message_from_database(self):
        chats = await self.retrive_message_room(self.room_name)
        for chat in chats:
            # Assuming 'messages' is a related name for accessing related objects,
            # you would iterate over them here. Adjust the following line according to your model's structure.
            # messages = await self.get_all_messages_for_chat(chat)
            content, user, timestamp = await self.get_messages_n_user_for_chat(chat)
            await self.send(text_data=json.dumps({"message": content, "user_id": user.username, "timestamp": str(timestamp)}))

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    @database_sync_to_async
    def get_room(self, room_name):
        return Chat_RoomName.objects.get(name=room_name)

    @database_sync_to_async
    def create_n_save_message(self, user, room, message):
        chat = Message.objects.create(sender=user, name=room, content=message)
        chat.save()
        return chat.timestamp

    @database_sync_to_async
    def get_user_blocked(self, user):
        return list(user.blocked_users.all())

    @database_sync_to_async
    def block_check(self, room, user):
        other_user = room.user1 if room.user2 == user else room.user2
        print("Block Check 74", other_user.blocked_users)
        print("Block Check 75", list(user.blocked_users.all()))
        print("Block Check 76", user, other_user)
        if user in other_user.blocked_users.all() or other_user in user.blocked_users.all():
            return True
        # if user or room.user2 in other_user.blocked_users.all():
        #     return True
        return False
            

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json["message"]

        # Cerca la Room
        room = await self.get_room(self.room_name)
        # Cerca gli utenti bloccati
        # block = await self.get_user_blocked(self.user)
        # Cerca se l'utente è bloccato
        if await self.block_check(room, self.user):
            print("You are blocked")
            await self.send(text_data=json.dumps({"status": "2"})) # status : 2 per utente bloccato
            return
        # Salva il messaggio
        if (len(message) > 125):
            await self.send(text_data=json.dumps({"status": "1"})) # status : 1 per limite raggiunto
            return

        timestamp = await self.create_n_save_message(self.user, self.room_name, message)
        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name, {"type": "chat.message", "message": message, "user_id": self.user.username, "timestamp": str(timestamp)}
        )

    # Receive message from room group
    async def chat_message(self, event):
        message = event["message"]
        user_id = event["user_id"]
        timestamp = event["timestamp"]

        # Send message to WebSocket
        await self.send(text_data=json.dumps({"message": message, "user_id": user_id, "timestamp": timestamp}))


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
            try:
                notificationslist = await self.get_notifications()
                for notification in notificationslist:
                    await self.send(text_data=json.dumps(
                        {
                            'content' : notification.content,
                            'read' : notification.read
                        }
                    ))
                await asyncio.sleep(15)
            except:
                break

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
        self.notificationloop.cancel()

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