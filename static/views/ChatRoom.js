import AbstractView from "./AbstractView.js";

export default class ChatRoom extends AbstractView {
    constructor(userOBJ, roomName) {
        super();
        this.userObj = userOBJ;
        this.roomName = roomName;
        this.content = document.querySelector("#content");
        this.nav = document.querySelector("header");
		    this.nav.innerHTML = this.getNav();
        this.content.innerHTML = this.getContent();
        // Initialize WebSocket as a field
        this.chatSocket = this.initializeWebSocket();
        this.initialize();
    }

    initialize() {
        console.log(this.userObj);
        console.log(this.roomName);
        this.setupChatInput();
    }


    closeWebSocket() {
      if (this.chatSocket)
        {
          this.chatSocket.close();
          console.log("Chat socket closed");
        }

    }

    initializeWebSocket() {
        const chatSocket = new WebSocket(
            'wss://' + window.location.hostname + ':8000' + '/ws/chat/' + this.roomName + '/'
        );

        chatSocket.onmessage = function(e) {
            const data = JSON.parse(e.data);
            const message_element = document.createElement('div');
            const user_id = data['user_id']; // Ensure this matches the JSON property name
            const logged_user_id = this.userObj.username; // Assuming this.userObj.username exists and is accessible

            message_element.innerText = data['message'];

            // Add 'message-right' class if the user_id matches logged_user_id, else 'message-left'
            if (user_id === logged_user_id) {
                message_element.classList.add('message', 'message-right');
            } else {
                message_element.classList.add('message', 'message-left');
            }

            document.querySelector('#chat-log').appendChild(message_element);
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
        return `
            <h1 style="color: white; text-align:center;">Chat Room: ${this.roomName} </h1>
            <div class="chat-room">
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