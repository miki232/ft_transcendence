import AbstractView from "./AbstractView.js";

export default class Chat extends AbstractView {
    constructor(userOBJ) {
        super();
        this.userObj = userOBJ;
        this.content = document.querySelector("#content");
        this.nav = document.querySelector("nav");
        this.nav.innerHTML = this.getNav();
        this.content.innerHTML = this.getContent();
        this.initialize();
    }

    async initialize() {
        this.setupChatRoomInput();
    }

	getContent() {
		return `
			<div class="chat-room-form">
				<h1>Chat</h1>
				<div style="flex: 1;"></div>
				<div style="display: flex; flex-direction: column; gap: 10px;">
					<label for="room-name-input">Which chat room would you like to enter?</label>
					<input id="room-name-input" type="text" placeholder="Enter room name">
					<input id="room-name-submit" type="button" value="Enter">
				</div>
				<div style="flex: 1;"></div>
			</div>
		`;
	}

    setupChatRoomInput() {
        document.querySelector('#room-name-input').focus();
        document.querySelector('#room-name-input').onkeyup = function(e) {
            if (e.key === 'Enter') {  // enter, return
                document.querySelector('#room-name-submit').click();
            }
        };

        document.querySelector('#room-name-submit').onclick = function(e) {
            var roomName = document.querySelector('#room-name-input').value;
            window.location.pathname = '/chat/' + roomName + '/';
        };
    }

    getNav() {
		const navHTML = `
			<a href="/local_game" data-translate="local" name="local" class="dashboard-nav" data-link>Local Game</a>
			<a href="/online" data-translate="online" name="online" class="dashboard-nav" data-link>Online Game</a>
			<a href="/ranking" data-translate="ranking" name="ranking" class="dashboard-nav" data-link>Ranking</a>
			<a href="/friends" data-translate="friends" name="friends" class="dashboard-nav" data-link>Friends</a>
			<a href="/chat" name="chat" class="dashboard-nav" data-link>Chat</a>
			<a href="/dashboard" name="dashboard" class="profile-pic dashboard-nav" data-link><img alt="Profile picture" src="${this.userObj.getPic()}"/></a>
		`;
		return navHTML;
	}
}