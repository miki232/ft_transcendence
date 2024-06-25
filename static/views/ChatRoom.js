import AbstractView from "./AbstractView.js";

export default class ChatRoom extends AbstractView {
    constructor(userOBJ, roomName) {
        super();
        this.userObj = userOBJ;
        this.roomName = roomName;
        this.content = document.querySelector("#content");
        this.nav = document.querySelector("nav");
        this.nav.innerHTML = this.getNav();
        this.content.innerHTML = this.getContent();
        this.initialize();
    }

    initialize() {
        console.log(this.userObj);
        console.log(this.roomName);
        this.setupWebSocket(this.userObj);
        this.setupChatInput();
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

    setupWebSocket(user) {
        const chatSocket = new WebSocket(
            'wss://' + window.location.hostname + ':8000' + '/ws/chat/' + this.roomName + '/'
        );

        chatSocket.onmessage = function(e) {
            const data = JSON.parse(e.data);
            const message_element = document.createElement('div');
            const user_id = data['user'];
            const logged_user_id = user.username;
            message_element.innerText = data['message'];
            if (user_id === logged_user_id)
            {
                message_element.classList.add('message');
            }
            else
            {
                message_element.classList.add('message');
            }
            
            document.querySelector('#chat-log').appendChild(message_element);
        };

        chatSocket.onclose = function(e) {
            console.error('Chat socket closed unexpectedly');
        };

        this.chatSocket = chatSocket;
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

    getNav() {
        return `
            <a href="/local_game" data-translate="local" name="local" class="dashboard-nav" data-link>Local Game</a>
            <a href="/online" data-translate="online" name="online" class="dashboard-nav" data-link>Online Game</a>
            <a href="/ranking" data-translate="ranking" name="ranking" class="dashboard-nav" data-link>Ranking</a>
            <a href="/friends" data-translate="friends" name="friends" class="dashboard-nav" data-link>Friends</a>
            <a href="/chat" name="chat" class="dashboard-nav" data-link>Chat</a>
            <a href="/dashboard" name="dashboard" class="profile-pic dashboard-nav" data-link>
                <img alt="Profile picture" src="${this.userObj.getPic()}"/>
            </a>
        `;
    }
}
