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

    async initialize() {
        this.setupWebSocket();
        this.setupChatInput();
    }

    getContent() {
        return `
            <div class="chat-room">
                <h1>Chat Room: ${this.roomName} style="color:red;"</h1>
                <textarea id="chat-log" cols="100" rows="20" readonly></textarea><br>
                <input id="chat-message-input" type="text" size="100"><br>
                <input id="chat-message-submit" type="button" value="Send">
            </div>
        `;
    }

    setupWebSocket() {
        const chatSocket = new WebSocket(
            'ws://' + window.location.host + '/ws/chat/' + this.roomName + '/'
        );

        chatSocket.onmessage = function(e) {
            const data = JSON.parse(e.data);
            document.querySelector('#chat-log').value += (data.message + '\n');
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
