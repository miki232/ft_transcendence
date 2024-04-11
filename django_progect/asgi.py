"""
ASGI config for django_progect project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application
from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_progect.settings')

django_asgi_app = get_asgi_application()

import chat.routing
import pong.routing
application = ProtocolTypeRouter(
    {
        "http": get_asgi_application(),
        "websocket": AllowedHostsOriginValidator(
            AuthMiddlewareStack(URLRouter(pong.routing.websocket_urlpatterns 
                                            + chat.routing.websocket_urlpatterns))
        ),
        # Just HTTP for now. (We can add other protocols later.)
    }
)
