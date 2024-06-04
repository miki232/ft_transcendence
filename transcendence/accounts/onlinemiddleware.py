# online_status_middleware.py
import time
import redis

r = redis.Redis(host='redis', port=6379, db=0)  # Connect to your Redis instance

class OnlineStatusMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            user_id = request.user.id
            current_time = int(time.time())
            result = r.zadd('online_users', {user_id: current_time})
        response = self.get_response(request)
        return response