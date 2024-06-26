import AbstractView from "./AbstractView.js";

export default class ChatRoom extends AbstractView {
    constructor(userOBJ, roomName) {
        super();
        this.userObj = userOBJ;
        this.otherUser = null;
        this.roomName = roomName;
        this.content = document.querySelector("#content");
        this.nav = document.querySelector("header");
		    this.nav.innerHTML = this.getNav();
        // Initialize WebSocket as a field
        this.chatSocket = null;
        this.initialize();
    }

    async initialize() {
        await this.getRoomUsers();
        this.content.innerHTML = this.getContent();
        this.setupChatInput();
        this.chatSocket = await this.initializeWebSocket();
    }

    // Api call to get the user in room
    async getRoomUsers() {
        const csrftoken = await this.getCSRFToken();

        await fetch('/room_users_list/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,
            },
            body: JSON.stringify({
                'name': this.roomName,
            }),
        })
        .then((response) => response.json())
        .then((data) => {
            this.otherUser = data['user2']['username'] === this.userObj.username ? data['user1'] : data['user2'];
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    }

    // Ritorno API
  //   {
  //     "user1": {
  //         "username": "admin",
  //         "email": "admin@asd.it",
  //         "first_name": "",
  //         "last_name": "",
  //         "pro_pic": "https://api.dicebear.com/8.x/thumbs/svg?seed=Nala&scale=90&radius=50&backgroundColor=ffdfbf",
  //         "status_login": true,
  //         "is_active": true,
  //         "level": 0,
  //         "exp": 0,
  //         "paddle_color": "#00FF99",
  //         "pong_color": "#141414",
  //         "alias": "None",
  //         "language": "en"
  //     },
  //     "user2": {
  //         "username": "suca",
  //         "email": "duca@sad.it",
  //         "first_name": "",
  //         "last_name": "",
  //         "pro_pic": "https://api.dicebear.com/8.x/thumbs/svg?seed=Nala&scale=90&radius=50&backgroundColor=ffdfbf",
  //         "status_login": false,
  //         "is_active": true,
  //         "level": 0,
  //         "exp": 0,
  //         "paddle_color": "#00FF99",
  //         "pong_color": "#141414",
  //         "alias": "None",
  //         "language": "en"
  //     }
  // }


    closeWebSocket() {
      if (this.chatSocket)
        {
          this.chatSocket.close();
          console.log("Chat socket closed");
        }

    }

    formatDate(dateString) {
      const date = new Date(dateString);
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
  }

    async initializeWebSocket() {
        const chatSocket = new WebSocket(
            'wss://' + window.location.hostname + ':8000' + '/ws/chat/' + this.roomName + '/'
        );

        chatSocket.onmessage = function(e) {
            const data = JSON.parse(e.data);
            const message_container = document.createElement('container');
            message_container.classList.add('message-container');
            const message_element = document.createElement('div');
            const message_time = document.createElement('div');
            message_element.classList.add('message-element');
            message_time.classList.add('message-time');

            message_container.appendChild(message_element);
            const user_id = data['user_id'];
            const logged_user_id = this.userObj.username;

            //formatting the timestamp
            const timestamp_formatted = this.formatDate(data['timestamp']);

            message_element.innerText = data['message'];
            message_time.innerText = timestamp_formatted;
            message_container.appendChild(message_time);


            // Add 'message-right' class if the user_id matches logged_user_id, else 'message-left'
            if (user_id === logged_user_id) {
                message_element.classList.add('message', 'message-right');
                message_container.classList.add('message-container-right');
            } else {
                message_element.classList.add('message', 'message-left');
                message_container.classList.add('message-container-left');
            }

            document.querySelector('#chat-log').appendChild(message_container);
            document.querySelector('#chat-log').scrollTop = document.querySelector('#chat-log').scrollHeight;
        }.bind(this); // Use .bind(this) to ensure 'this' inside the function refers to the outer 'this'

        chatSocket.onclose = function(e) {
            console.log('Chat socket closed unexpectedly');
        };

        return chatSocket;
    }

    setupChatInput() {
        const messageInput = document.querySelector('#chat-message-input');
        messageInput.focus();
        messageInput.onkeyup = (e) => {
            if (e.key === 'Enter') {
                document.querySelector('#chat-message-submit').click();
            }
        };

        document.querySelector('#chat-message-submit').onclick = (e) => {
            const message = messageInput.value;
            this.chatSocket.send(JSON.stringify({ 'message': message }));
            messageInput.value = '';
        };
    }

    getContent() {
      //const other_user = data['user_2'] === this.userObj.username ? data['user_1'] : data['user_2'];
        return `
            <h1 style="color: white; text-align:center;">Chat Room: ${this.roomName} </h1>
            <div class="chat-room">
            <div class="user-profile">
              <a href="/friends/user_info_${this.otherUser['username']}" class="profile-link">${this.otherUser['username']}</a>
              <img src="${this.otherUser['pro_pic']}" alt="Profile Picture" class="profile-pic">
            </div>
                <div id="chat-log">
                </div>
                <input id="chat-message-input" type="text" size="100">
                <input id="chat-message-submit" type="button" value="Send">
            </div>
        `;
    }

    getNav() {
        const navHTML = `
            <nav class="navbar navbar-expand-lg bg-body-tertiary">
              <div class="container-fluid">
                <a href="/dashboard" id="logo" class="nav-brand" aria-current="page" data-link>
                    <img src="/static/img/Logo.png" alt="Logo" class="logo"/>
                </a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
                    <span class="navbar-toggler-icon"><ion-icon name="menu-outline" class="toggler-icon"></ion-icon></span>
                </button>
                <div class="collapse navbar-collapse" id="navbarNavDropdown">
                  <ul class="navbar-nav">
                    <li class="nav-item">
                      <a class="nav-link" href="/local_game" data-translate="local" data-link>Local Game</a>
                    </li>
                    <li class="nav-item">
                      <a class="nav-link" href="/online" data-translate="online" data-link>Online Game</a>
                    </li>
                    <li class="nav-item">
                      <a class="nav-link" href="/ranking" data-translate="ranking" data-link>Ranking</a>
                    </li>
                    <li class="nav-item">
                      <a class="nav-link" href="/friends" data-translate="friends" data-link>Friends</a>
                    </li>
                    <li class="nav-item">
                      <a class="nav-link" href="/chat" data-link>Chat</a>
                    </li>
                    <li class="nav-item">
                      <a class="nav-link" href="/dashboard" data-link>Dashboard</a>
                    </li>
                  </ul>
                </div>
              </div>
            </nav>
        `;
        return navHTML;
    }
}