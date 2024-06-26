import { navigateTo } from "../index.js";
import AbstractView from "./AbstractView.js";

export default class Chat extends AbstractView {
    constructor(userOBJ) {
        super();
        // this.setupChatRoomInput = this.setupChatRoomInput.bind(this);
        this.userObj = userOBJ;
        this.content = document.querySelector("#content");
        this.nav = document.querySelector("header");
		this.nav.innerHTML = this.getNav();
        this.content.innerHTML = this.getContent();
        this.initialize();
    }

    async initialize() {
		await this.fetchChatList(); // Fetch and display chat list
        // this.setupChatRoomInput();
    }

    async fetchChatList() {
		try {
			const response = await fetch('/chat_list/');
			const chatList = await response.json();
			console.log(chatList);
			const chatListContainer = document.querySelector('#chat-list');
			chatListContainer.innerHTML = chatList.map(chat => 
				`<li><button class="chatroom" room-name="${chat.name}">${chat.user1 === this.userObj.username ? chat.user2 : chat.user1}</button></li>`
			).join('');
	
			// Attach event listeners to all chatroom buttons
			document.querySelectorAll('.chatroom').forEach(btn => {
				btn.addEventListener('click', (e) => {
					const roomName = e.target.getAttribute('room-name');
					console.log("Entering chat room", roomName);
					navigateTo(`/chat/` + roomName);
				});
			});
		} catch (error) {
			console.error('Failed to fetch chat list:', error);
		}
	}

	getContent() {
		return `
			<div class="chat-room-form">
				<h1>Chat</h1>
				<ul id="chat-list"></ul> <!-- Placeholder for chat list -->
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

    // setupChatRoomInput() {
    //     // document.querySelector('#room-name-input').focus();
    //     const btn = document.getElementById('chatroom');
    //     btn.addEventListener('click', (e) => {
    //         e.preventDefault();
    //         const roomname = document.querySelector('#room-name').value;
    //         console.log("Entering chat room", roomname);
    //         this.userObj.room_chat = roomname;
    //         navigateTo(`/chat/` + roomname);
    //     });
        // document.querySelector('#room-name-submit').onclick = (e) => {
        //     e.preventDefault();
        //     console.log("Entering chat room", document.querySelector('#room-name-input').value);
        //     this.userOBJ.room_chat = document.querySelector('#room-name-input').value;
        //     navigateTo(`/chatroom/}`);
        // };
    // }

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