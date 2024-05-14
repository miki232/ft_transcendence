"""
Per mandare una notifica
"""
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from chat.models import Notifications
from channels.db import database_sync_to_async

async def send_message(receiverid, channel_layer, notification):
    content = await get_db(notification)
    print("Send Message 11", content.content, content.read)
    await channel_layer.group_send(
        f"notifications_{receiverid}", {"type": "notifier", "message": content.content, "status" : content.read}
    )

def send_save_notification(receiver, message):
    #save notifications
    notification = Notifications.objects.create(user=receiver, content=message)    

    channel_layer = get_channel_layer()
    async_to_sync(send_message)(receiver.id, channel_layer, notification)

@database_sync_to_async
def get_db(notification):
    print("Get_db 25", notification.user.id, "   ", notification.id)
    return (Notifications.objects.get(id=notification.id))

def update_db_notifications(sender, receiver):
    print("Update DB Notifications 29", receiver, sender)
    Notifications.objects.get(user=receiver, content__icontains=sender).delete()
    print("ok")

