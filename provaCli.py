import argparse
import requests
import getpass
import urllib3
import threading
from collections import defaultdict
from pynput import keyboard
from pynput.keyboard import Key, KeyCode
import curses
import os
from time import monotonic
import json
import ssl
from websocket import create_connection

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

KEY_BINDINGS: dict[str, Key | KeyCode] = {
    "quit": Key.esc,
    "up": Key.up,
    "up2": KeyCode(char="w"),
    "down": Key.down,
    "down2": KeyCode(char="s"),
}

SERVER_URL = 'https://127.0.0.1:8001'
WSS_URL = 'https://127.0.0.1:8000'

parser = argparse.ArgumentParser(description='CLI for playing Pong.')
parser.add_argument('--username', type=str, help='Your username')
args = parser.parse_args()

class GameEngine:
    def __init__(self, username, password):
        self.username = username
        self.password = password
        self.cookie_str = ''
        self.game_state = {}
        self.room_name = ''
        self.result = None
        self.ws = None
        self.ws_pong = None

    def authenticate(self):
        print('Authenticating... for user:', self.username)
        response = requests.post(f'{SERVER_URL}/accounts/login/?next=/csrf-token', data={'username': self.username, 'password': self.password}, verify=False)
        if response.status_code == 200:
            print('Successfully authenticated!')
            self.cookie_str = '; '.join([f'{key}={value}' for key, value in response.cookies.items()])
            return response.cookies
        else:
            print('Failed to authenticate.')
            exit(1)

    def connect_matchmaking_websocket(self):
        self.ws = create_connection(
            f"{WSS_URL.replace('https', 'wss')}/ws/matchmaking/",
            cookie=self.cookie_str,
            sslopt={"cert_reqs": ssl.CERT_NONE}
        )
        self.ws.send(json.dumps({"action": "join_queue"}))
        self.result = json.loads(self.ws.recv())


    def connect_to_pong_websocket(self):
        self.ws_pong = create_connection(
            f"{WSS_URL.replace('https', 'wss')}/ws/pong/{self.room_name}/",
            cookie=self.cookie_str,
            sslopt={"cert_reqs": ssl.CERT_NONE}
        )
        self.ws.close()
        self.game_state = json.loads(self.ws_pong.recv())

    def run(self):
        curses.wrapper(self._run)

    def _run(self, screen):
        curses.curs_set(0)
        screen.nodelay(True)

        game_state = self.game_state
        resized = True

        pressed_keys = defaultdict(bool)

        def on_press(key):
            pressed_keys[key] = True

        def on_release(key):
            pressed_keys[key] = False

        listener = keyboard.Listener(on_press=on_press, on_release=on_release)
        listener.daemon = True
        listener.start()

        try:
            last_time = monotonic()
            print(self.result)
            while self.result['status']:
                screen.clear()
                screen.addstr(0, 0, 'Waiting for opponent...')
                self.result = json.loads(self.ws.recv())
                if self.result['status'] == 5:
                    self.room_name = self.result['room_name']
                    self.opp_username = self.result['opponent']
                    screen.addstr(1, 0, 'Opponent found')
                    screen.addstr(2, 0, f'Playing against {self.opp_username}')
                if self.result['status'] == 2:
                    screen.addstr(10, 0, 'Game started!')
                    break
                screen.refresh()
                
            screen.clear()
            self.connect_to_pong_websocket()
            while True:
                current_time = monotonic()
                dt = current_time - last_time
                last_time = current_time
                if resized:
                    height, width = screen.getmaxyx()
                    resized = False

                # self.print_game_state(game_state, screen)
                up = (
                    pressed_keys[KEY_BINDINGS["up"]]
                    or pressed_keys[KEY_BINDINGS["up2"]]
                    )
                down = (
                    pressed_keys[KEY_BINDINGS["down"]]
                    or pressed_keys[KEY_BINDINGS["down2"]]
                )
                if up:
                    self.ws_pong.send(json.dumps({"action": "move_up", "user": self.username}))
                if down:
                    self.ws_pong.send(json.dumps({"action": "move_down", "user" : self.username}))
                self.print_game_state(self.game_state, screen)
                self.game_state = json.loads(self.ws_pong.recv())
                if self.game_state['victory'] == self.username:
                    screen.clear()
                    screen.addstr(10, 0, 'You win!')
                    screen.refresh()
                    
                    break
                elif self.game_state['victory'] == self.opp_username:
                    screen.clear()
                    screen.addstr(10, 0, 'You lose!')
                    screen.refresh()

                    break
                # Update game_state based on pressed_keys...

        finally:
            listener.stop()

    def print_game_state(self, game_state, screen):
        screen.clear()
        height, width = screen.getmaxyx()
        ball_size = int(min(width, height) * 0.05)
        paddle_size = int(height * 100 / 600)

        if ball_size < 1 or paddle_size < 1:
            screen.addstr(0, 0, "Screen is too small to display the game. Please resize the window.")
            screen.refresh()
            return
        
        for y in range(height - 1):
            screen.addch(y, 0, '|')
            screen.addch(y, width - 1, '|')
            screen.addch(y, width // 2, '|')

        # Draw horizontal lines
        for x in range(width-1):
            screen.addch(0, x, '̅')
            screen.addch(height - 1, x, '̲')

        # Draw usernames and scores
        screen.addstr(0, 0, f'{self.username} vs {self.opp_username}')
        screen.addstr(height - 1, 0, f'{game_state["score1"]} - {game_state["score2"]}')


        ball_x = int(game_state['ball_x'] * width / 800)  - ball_size // 2
        ball_y = int(game_state['ball_y'] * height / 600) - ball_size // 2

        for i in range(ball_size):
            for j in range(ball_size):
                if 0 <= ball_x + j < width and 0 <= ball_y + i < height:
                    screen.addch(ball_y + i, ball_x + j, 'O')
        
        # Calculate paddle distance from the border as 5% of screen width
        paddle_distance = int(width * 0.05)

        for i in range(paddle_size + 1):
            paddle1_y = round(game_state['paddle1_y'] * height / 600) + i
            paddle2_y = round(game_state['paddle2_y'] * height / 600) + i
            if 0 <= paddle1_y < height:
                screen.addch(paddle1_y, paddle_distance -1, '|')
            if 0 <= paddle2_y < height:
                screen.addch(paddle2_y, width-paddle_distance - 1, '|')

        screen.refresh()

if __name__ == "__main__":
    password = getpass.getpass('Password: ')
    game_engine = GameEngine(args.username, password)
    game_engine.authenticate()
    game_engine.connect_matchmaking_websocket()
    game_thread = threading.Thread(target=game_engine.run())
    game_thread.daemon = True
    game_thread.start()
    
    # game_engine.run()