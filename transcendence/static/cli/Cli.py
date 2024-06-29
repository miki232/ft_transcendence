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
import time
import json
import ssl
import select
from websocket import create_connection, WebSocketException

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Key bindings for game controls
KEY_BINDINGS: dict[str, Key | KeyCode] = {
    "quit": Key.esc,
    "quit2": KeyCode(char="q"),
    "rematch": KeyCode(char="r"),
    "up": Key.up,
    "up2": KeyCode(char="w"),
    "down": Key.down,
    "down2": KeyCode(char="s"),
    "game": KeyCode(char="g"),
    "invite": KeyCode(char="f"),
    "match_friendly": KeyCode(char="m"),
    "y": KeyCode(char="y"),
    "enter": Key.enter
}

SERVER_URL = 'https://127.0.0.1:8443'
WSS_URL = 'https://127.0.0.1:8000'

parser = argparse.ArgumentParser(description='CLI for playing Pong.')
parser.add_argument('--username', '-u', type=str, help='Your username')
parser.add_argument('--host', type=str, help='Ip address of the server, if not setting the default is localhost')

args = parser.parse_args()

class GameEngine:
    def __init__(self, username, password):
        self.username = username
        self.password = password
        self.cookie_str = ''
        self.game_state = {}
        self.room_name = None
        self.result = None
        self.notification = None
        self.ws = None
        self.ws_pong = None
        self.ws_notifications = None
        self.temp = None
        self.matches = {}

    def authenticate(self):
        """Authenticate user with the server and obtain session cookies."""
        print('Authenticating... for user:', self.username)
        try:
            response = requests.post(f'{SERVER_URL}/accounts/login/?next=/csrf-token', data={'username': self.username, 'password': self.password}, verify=False)
            if response.status_code == 200:
                print('Successfully authenticated!')
                self.cookie_str = '; '.join([f'{key}={value}' for key, value in response.cookies.items()])
                return response.cookies
            else:
                print('Failed to authenticate')
                exit(1)
        except requests.RequestException as e:
            print(f'Connection error: {e}. Please check your internet connection.')
            exit(1)

    def display_matches(self, screen):
        """Display the matches on the screen."""
        y = 8  # start displaying matches from the 8th row
        for match, details in self.matches.items():
            room_name, user = match
            opponent = details['opponent']
            result = details['result']
            screen.addstr(y, 0, f'{user} Vs {opponent}, Result: You {result}, score: {details["score1"]} - {details["score2"]}')
            y += 1  # move to the next row for the next match

    def connect_matchmaking_websocket(self):
        """Connect to the matchmaking websocket and join the queue."""
        try:
            self.ws = create_connection(
                f"{WSS_URL.replace('https', 'wss')}/ws/matchmaking/",
                cookie=self.cookie_str,
                sslopt={"cert_reqs": ssl.CERT_NONE}
            )
            self.ws.send(json.dumps({"action": "join_queue"}))
            self.result = json.loads(self.ws.recv())
        except (WebSocketException, json.JSONDecodeError) as e:
            print(f'Error connecting to matchmaking websocket: {e}')
            exit(1)
    
    def connect_notfications_websocket(self):
        """Connect to the notifications websocket."""
        try:
            self.ws_notifications = create_connection(
                f"{WSS_URL.replace('https', 'wss')}/ws/notifications/",
                cookie=self.cookie_str,
                sslopt={"cert_reqs": ssl.CERT_NONE}
            )
            # self.notification = json.loads(self.ws_notifications.recv())
        except (WebSocketException, json.JSONDecodeError) as e:
            print(f'Error connecting to matchmaking websocket: {e}')
            exit(1)

    def connect_to_pong_websocket(self, screen):
        """Connect to the Pong game websocket once a match is found."""
        try:
            self.ws_pong = create_connection(
                f"{WSS_URL.replace('https', 'wss')}/ws/pong/{self.room_name}/",
                cookie=self.cookie_str,
                sslopt={"cert_reqs": ssl.CERT_NONE}
            )
            try:
                self.ws.close()
            except:
                pass
            self.game_state = self.ws_pong.recv()
            if self.game_state:
                self.game_state = json.loads(self.game_state)
                print('Connected to pong websocket')
            else:
                print('Failed to connect to pong websocket')
                print(self.game_state)
        except (WebSocketException, json.JSONDecodeError) as e:
            print(f'Error connecting to Pong websocket: {e}')
            exit(1)

    def display_input(self, screen):
        screen.clear()
        self.display_matches(screen)
        screen.addstr(0, 0, 'Press g to start the game...')
        screen.addstr(2, 0, 'Press f to invite a friend to play')
        screen.addstr(4, 0, 'Press m to play a friendly match')
        screen.addstr(6, 0, 'Press q/esc to quit')
        screen.refresh()

    def _pre_gameinput(self, screen, pressed_keys):
        """Display pre-game instructions and wait for user input."""
        # self.connect_notfications_websocket()
        state = 0
        # exit = False
        self.room_name = None
        if state == 0:
            self.display_input(screen)
        while state == 0:
            exit = (
                pressed_keys[KEY_BINDINGS["quit"]]
                or pressed_keys[KEY_BINDINGS["quit2"]]
            )
            match_friendly = (
                pressed_keys[KEY_BINDINGS["match_friendly"]]
            )
            game = (
                pressed_keys[KEY_BINDINGS["game"]]
            )
            invite = (
                pressed_keys[KEY_BINDINGS["invite"]]
            )
            
            if exit:  # ESC key is 27
                screen.clear()
                screen.addstr(0, 0, 'Exiting...')
                screen.addstr(1, 0, 'ARE YOU SURE?')
                screen.addstr(2, 0, 'Press y to confirm, enter to cancel')
                screen.refresh()
                while True:
                    y = (
                        pressed_keys[KEY_BINDINGS["y"]]
                    )
                    enter = (
                        pressed_keys[KEY_BINDINGS['enter']]
                    )
                    if y:
                        exit(0)
                    if enter:
                        break
                self.display_input(screen)
            elif invite:
                state = self.invite_friend(screen, pressed_keys)
                if state == 0:
                    self.display_input(screen)
            elif match_friendly:
                state = self.friendlyMatch(screen, pressed_keys)
                if state == 0:
                    self.display_input(screen)
            elif game:
                self.connect_matchmaking_websocket()
                state = 1
            time.sleep(0.01)  # Add a sleep interval to avoid busy-waiting
            
    
    def get_list(self, screen):
        """Get the list of rooms from the server."""
        headers = {'Cookie': self.cookie_str}
        try:
            response = requests.get(f'{SERVER_URL}/rooms_list/', headers=headers, verify=False)
            if response.status_code == 200:
                room_list = response.json()
                print("Room list fetched successfully!")
                room_names = []
                for room in room_list:
                    room_info = (room['name'], room['created_by'], room['opponent'])  # Store as a tuple
                    room_names.append(room_info)
                return room_names
            else:
                print("Failed to fetch room list")
                print("Status code:", response.status_code)
                print("Response:", response.text)
        except requests.RequestException as e:
            print("An error occurred while fetching the room list:", e)

    def friendlyMatch(self, screen, pressed_keys):
        """"Display the option to play a friendly match."""
        rooms = self.get_list(screen)
        screen.clear()
        screen.addstr(0, 0, "Select a room:")
        for idx, room in enumerate(rooms):
            roomname, createby, opponent = room  # Unpack the tuple here
            screen.addstr(idx + 1, 0, f"{idx + 1}. {createby} vs {opponent}")
        screen.addstr(len(rooms) + 1, 0, "Press q to go back")
        screen.refresh()
            
        while True:
            exit = (
                pressed_keys[KEY_BINDINGS["quit"]]
                or pressed_keys[KEY_BINDINGS["quit2"]]
            )
            if exit:
                time.sleep(0.1)
                return 0
            key = screen.getch()
            if key in range(ord('1'), ord('1') + len(rooms)):
                selected_room = rooms[key - ord('1')]
                roomname, createby, opponent = selected_room
                self.room_name = roomname
                self.opp_username = opponent
                screen.clear()
                screen.refresh()
                return 1
            time.sleep(0.01)  # Add a sleep interval to avoid busy-waiting

    def friendList(self):
        """Get list of friends from the server."""
        headers = {'Cookie': self.cookie_str}
        try:
            response = requests.get(f'{SERVER_URL}/friend/list/', headers=headers, verify=False)
            if response.status_code == 200:
                friend_list = response.json()
                print("Friend list fetched successfully!")
                friend_names = []
                for user in friend_list:
                    for friend in user['friends']:
                        friend_names.append(friend['username'])
                return friend_names
            else:
                print("Failed to fetch friend list")
                print("Status code:", response.status_code)
                print("Response:", response.text)
        except requests.RequestException as e:
            print("An error occurred while fetching the friend list:", e)

    def invite_friend(self, screen, pressed_keys):
        """Display friend list and handle friend invitation."""
        friends = self.friendList()
        screen.clear()
        screen.addstr(0, 0, "Select a friend to invite:")
        for idx, friend in enumerate(friends):
            screen.addstr(idx + 1, 0, f"{idx + 1}. {friend}")
        screen.addstr(len(friends) + 1, 0, "Press q to go back")
        screen.refresh()
            
        while True:
            exit = (
                pressed_keys[KEY_BINDINGS["quit"]]
                or pressed_keys[KEY_BINDINGS["quit2"]]
            )
            if exit:
                time.sleep(0.1)
                return 0
            key = screen.getch()
            if key in range(ord('1'), ord('1') + len(friends)):
                selected_friend = friends[key - ord('1')]
                self.send_invite(selected_friend, screen)
                screen.clear()
                screen.addstr(0, 0, f"Invitation sent to {selected_friend}!")
                screen.addstr(1, 0, "Press any key to go back")
                screen.refresh()
                screen.getch()
                return 0
            time.sleep(0.01)  # Add a sleep interval to avoid busy-waiting
    
    def csrf_token(self, screen):
        headers = {'Cookie': self.cookie_str}
        response = requests.get(f'{SERVER_URL}/csrf-token', headers=headers, verify=False)
        screen.clear()
        data = response.json()
        return data['csrfToken']

    def send_invite(self, friend, screen):
        """Send a friend invitation to the selected friend."""
        headers = {'Cookie': self.cookie_str, 'X-CSRFToken': self.csrf_token(screen), 'Referer': SERVER_URL}
        data = {"name":"1","created_by":self.username,"to_fight":friend}
        screen.clear()
        try:
            response = requests.post(f'{SERVER_URL}/pong/create/', headers=headers, data=data, verify=False)
            if response.status_code == 201:
                print("Friend invitation sent successfully!")
            else:
                print("Failed to send friend invitation")
                print("Status code:", response.status_code)
                print("Response:", response.text)
        except requests.RequestException as e:
            print("An error occurred while sending the friend invitation:", e)

    def run(self):
        """Main game loop using curses for terminal display."""
        try:
            pressed_keys = defaultdict(bool)

            def on_press(key):
                pressed_keys[key] = True

            def on_release(key):
                pressed_keys[key] = False

            listener = keyboard.Listener(on_press=on_press, on_release=on_release)
            listener.daemon = True
            listener.start()
            while True:
                curses.wrapper(self._pre_gameinput, pressed_keys)
                curses.wrapper(self._run, pressed_keys)
        except (WebSocketException, json.JSONDecodeError) as e:
            print(f'Error during game loop: {e}')
        finally:
            listener.stop()

    def _run(self, screen, pressed_keys):
        curses.curs_set(0)
        screen.nodelay(True)

        game_state = self.game_state
        resized = True

        def add_match(self, room_name, user, opponent, result, score1, score2):
            self.matches[(room_name, user)] = {'opponent': opponent, 'result': result, 'score1' : score1, 'score2' : score2}

        try:
            last_time = monotonic()
            print(self.result)
            if self.room_name is None:
                while self.result['status']:
                    screen.clear()
                    screen.addstr(0, 0, 'Waiting for opponent...')
                    screen.addstr(1, 0, 'you are in the queue')
                    screen.addstr(2, 0, 'You can\'t quit now')
                    self.result = json.loads(self.ws.recv())
                    if self.result['status'] == 5:
                        self.room_name = self.result['room_name']
                        self.opp_username = self.result['opponent']
                        screen.addstr(1, 0, 'Opponent found')
                        screen.addstr(2, 0, f'                                     ')
                        screen.addstr(2, 0, f'Playing against {self.opp_username}')
                    if self.result['status'] == 2:
                        screen.addstr(10, 0, 'Game started!')
                        break
                    screen.refresh()
                
            screen.clear()
            self.connect_to_pong_websocket(screen)
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
                quit = (
                    pressed_keys[KEY_BINDINGS["quit"]]
                    or pressed_keys[KEY_BINDINGS["quit2"]]
                )
                if up:
                    self.ws_pong.send(json.dumps({"action": "move_up", "user": self.username}))
                if down:
                    self.ws_pong.send(json.dumps({"action": "move_down", "user" : self.username}))
                if quit:
                    self.ws_pong.close()
                    pressed_keys[KEY_BINDINGS["quit"]] = False
                    pressed_keys[KEY_BINDINGS["quit2"]] = False
                    add_match(self, self.room_name, self.username, self.opp_username, 'lose', self.game_state["score1"], self.game_state["score2"])
                    time.sleep(1)
                    break
                self.print_game_state(self.game_state, screen)
                self.game_state = json.loads(self.ws_pong.recv())
                if self.game_state['victory'] == self.username:
                    screen.clear()
                    screen.addstr(10, 0, 'You win!')
                    add_match(self, self.room_name, self.username, self.opp_username, 'win', self.game_state["score1"], self.game_state["score2"])
                    screen.refresh()
                    time.sleep(2)
                    break
                elif self.game_state['victory'] == self.opp_username:
                    screen.clear()
                    screen.addstr(10, 0, 'You lose!')
                    add_match(self, self.room_name, self.username, self.opp_username, 'lose', self.game_state["score1"], self.game_state["score2"])
                    screen.refresh()
                    time.sleep(2)
                    break
                # Update game_state based on pressed_keys...
            # self.waiting_input(screen, pressed_keys)
        except (WebSocketException, json.JSONDecodeError) as e:
            print(f'Error during game loop: {e}')

    def waiting_input(self, screen, pressed_keys):
        """Handle input waiting after game ends for rematch or quit."""
        sat = False
        while True:
            q = (
                pressed_keys[KEY_BINDINGS["quit"]]
                or pressed_keys[KEY_BINDINGS["quit2"]]
            )
            r = pressed_keys[KEY_BINDINGS["rematch"]]
            if not sat:
                screen.addstr(0, 0, 'Press q/esc to quit')
                screen.addstr(1, 0, 'Press r to rematch')
                screen.refresh()
            if q:
                exit(0)
            if r and not sat:
                screen.clear()
                screen.addstr(0, 0, 'Rematching...')
                screen.refresh()
                sat = True
                # self.connect_matchmaking_websocket()
                self.run()

    def print_game_state(self, game_state, screen):
        """Render the game state on the screen."""
        screen.clear()
        height, width = screen.getmaxyx()
        ball_size = int(min(width, height) * 0.05)
        paddle_size = int(height * 100 / 600)
        if game_state['status'] == "waiting":
            screen.addstr(0, 0, "Game state not available. Please wait for the players to connect.")
            screen.refresh()
            return

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
        # if self.opp_username == self.username:
        #     screen.addstr(0, 0, f'{self.opp_username} vs {self.username} -d {self.temp}')
        # else:
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
    try:
        if args.host:
            SERVER_URL = f'https://{args.host}:8443'
            WSS_URL = f'https://{args.host}:8000'
        print('Connecting to server...\nAt :', SERVER_URL)
        if not args.username:
            args.username = input('Username: ')
        password = getpass.getpass('Password: ')
        game_engine = GameEngine(args.username, password)
        game_engine.authenticate()
        # game_engine.connect_matchmaking_websocket()
        game_thread = threading.Thread(target=game_engine.run())
        game_thread.daemon = True
        game_thread.start()

        while game_thread.is_alive():
            game_thread.join(1)
    except KeyboardInterrupt:
        print("\nGame interrupted. Exiting...")
        exit(0)
    except Exception as e:
        pass
        exit(1)