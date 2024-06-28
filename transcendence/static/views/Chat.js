import { navigateTo } from "../index.js";
import { changeLanguage } from "../index.js";
import AbstractView from "./AbstractView.js";
import { createNotification } from "./Notifications.js";

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
		// this.activebutton();
        // this.setupChatRoomInput();
    }

	// async activebutton() {
	// 	const blockUserBtns = document.querySelectorAll('.block-user-btn');
	// 	console.log(blockUserBtns);
	// 	blockUserBtns.forEach(btn => {
	// 		console.log(btn.getAttribute('id'));
	// 		const isBlocked = btn.getAttribute('id') === 'unblockuser';
	// 		if (isBlocked) {
	// 			btn.addEventListener('click', async (e) => {
	// 				const usertounlock = e.target.getAttribute('data-user');
	// 				console.log("Blocking user", usertounlock);
	// 				const csrftoken = await this.getCSRFToken();
	// 				await fetch('/unblock_user/', {
	// 					method: 'POST',
	// 					headers: {
	// 						'Content-Type': 'application/json',
	// 						'X-CSRFToken': csrftoken,
	// 					},
	// 					body: JSON.stringify({
	// 						'username': usertounlock,
	// 					}),
	// 				})
	// 				.then((response) => response.json())
	// 				.then((data) => {
	// 					console.log(data);
	// 					btn.innerHTML = 'Block User';
	// 					btn.setAttribute('id', 'blockuser');
	// 					createNotification(data.message);
	// 				})
	// 				.catch((error) => {
	// 					console.error('Error:', error);
	// 				});
	// 			});
	// 		}
	// 		else {
	// 			btn.addEventListener('click', async (e) => {
	// 				const userToBlock = e.target.getAttribute('data-user');
	// 				console.log("Blocking user", userToBlock);
	// 				const csrftoken = await this.getCSRFToken();
	// 				await fetch('/block_user/', {
	// 					method: 'POST',
	// 					headers: {
	// 						'Content-Type': 'application/json',
	// 						'X-CSRFToken': csrftoken,
	// 					},
	// 					body: JSON.stringify({
	// 						'username': userToBlock,
	// 					}),
	// 				})
	// 				.then((response) => response.json())
	// 				.then((data) => {
	// 					console.log(data);
	// 					createNotification(data.message);
	// 					btn.innerHTML = 'Unblock User';
	// 					btn.setAttribute('id', 'unblockuser');
	// 				})
	// 				.catch((error) => {
	// 					console.error('Error:', error);
	// 				});
	// 			});
	// 		}
	// 	});
	// } 

	noChats (element) {
		const noEntries = document.createElement("p");
		noEntries.style.borderTop = "1px solid white";
		noEntries.style.paddingTop = "10%";
		noEntries.className = "no-entries";
		noEntries.textContent = "You don't have any chats yet.";
		noEntries.setAttribute("data-translate", "noChats");
		element.appendChild(noEntries);
		element.style.textAlign = "center";
		changeLanguage(this.userObj.language);
	}


    async fetchChatList() {
		try {
			const response = await fetch('/chat_list/');
			const chatList = await response.json();
			console.log(chatList);
			// Fetch the blocked users list
			const blockResponse = await fetch('/user_block_list/');
			const { blocked_users } = await blockResponse.json();
	
			const chatListContainer = document.querySelector('#chat-list');
			if (chatList.length === 0) {
				this.noChats(chatListContainer);
				return;
			}
			chatListContainer.innerHTML = chatList.map(chat => {
				const otherUser = chat.user1 === this.userObj.username ? chat.user2 : chat.user1;
				const isBlocked = blocked_users.includes(otherUser);
				return `<li>
							<button class="chatroom" room-name="${chat.name}">${otherUser}</button> 
							<button class="block-user-btn" data-translate="${isBlocked ? 'UnblockUser' : 'BlockUser'}" data-user="${otherUser}" id="${isBlocked ? 'unblockuser' : 'blockuser'}">${isBlocked ? 'Unblock User' : 'Block User'}</button>
						</li>`;
			}).join('');
			changeLanguage(this.userObj.language);
			// Attach event listeners to all chatroom buttons
			document.querySelectorAll('.chatroom').forEach(btn => {
				btn.addEventListener('click', (e) => {
					const roomName = e.target.getAttribute('room-name');
					console.log("Entering chat room", roomName);
					navigateTo(`/chat/` + roomName);
				});
			});
	
			// Event delegation for block/unblock user buttons
			chatListContainer.addEventListener('click', async (e) => {
				if (e.target.classList.contains('block-user-btn')) {
					const userToToggle = e.target.getAttribute('data-user');
					const action = e.target.getAttribute('id') === 'blockuser' ? 'block_user' : 'unblock_user';
					console.log(`${action === 'block_user' ? 'Blocking' : 'Unblocking'} user`, userToToggle);
					const csrftoken = await this.getCSRFToken();
					await fetch(`/${action}/`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'X-CSRFToken': csrftoken,
						},
						body: JSON.stringify({
							'username': userToToggle,
						}),
					})
					.then((response) => response.json())
					.then((data) => {
						console.log(data);
						createNotification(data.message);
						e.target.innerHTML = action === 'block_user' ? 'Unblock User' : 'Block User';
						e.target.setAttribute('id', action === 'block_user' ? 'unblockuser' : 'blockuser');
						e.target.setAttribute('data-translate', action === 'block_user' ? 'UnblockUser' : 'BlockUser');
					})
					.catch((error) => {
						console.error('Error:', error);
					});
				}
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
					  <a class="nav-link" href="/static/cli/cli.zip">CLI</a>
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