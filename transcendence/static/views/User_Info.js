import { removeFriend } from "./Friends.js";
import { getCSRFToken } from "./Info.js";
import { sanitizeInput } from "../utilities.js";
import { createNotification } from "./Notifications.js";
import { getRequests, acceptFriendRequest, declineFriendRequest, sendFriendRequest, cancelRequest } from "./Requests.js";
import AbstractView from "./AbstractView.js";
import { navigateTo, changeLanguage } from "../index.js";

// export async function getCSRFToken() {
// 	let csrftoken = await fetch("csrf-token")
// 		.then(response => response.json())
// 		.then(data => data.csrfToken);
// 		console.log(csrftoken);
// 	return csrftoken;
// }

export default class UserInfo extends AbstractView {
	constructor(userID, user) {
		super();
		this.user = user;
		this.content = document.querySelector("#content");
		this.nav = document.querySelector("header");
		this.nav.innerHTML = this.getNav();
		this.content.innerHTML = this.getContent();
		this.initialize(userID);
		this.friendUsername = null;
		// this.Userto;
		// // this.user;
		// this.email;
		// this.pro_pic;
	}

	async initialize(userID) {
		await this.getUserInfo(userID);
		const lang = localStorage.getItem('language');
		this.activateButtons();
		await changeLanguage(lang);

	};

	async activateButtons() {
		const chatBtn = document.getElementById("chat");
		const csr = await getCSRFToken();
		chatBtn.addEventListener("click", async e => {
			e.preventDefault();
			const payload = {
				user1: this.user.username,
				user2: this.friendUsername
			};
		
			await fetch('/chat_create/', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRFToken': csr
				},
				body: JSON.stringify(payload)
			})
			.then(response => response.json())
			.then(data => {
				console.log('Success:', data);
				navigateTo("/chat/" + data.name);
				// Handle success response
			})
			.catch((error) => {
				console.error('Error:', error);
				// Handle errors here
			});
		});
	}

	async getUserInfo(userID) {
		var csrf = await getCSRFToken();
		await fetch('/accounts/guser_info/?username=' + userID, {
			method: 'GET',
			headers: {
				'Content-Type' : 'application/json',
				'X-CSRFToken': csrf
			}
		})
		.then(response => response.json())
		.then(async data => {
			const requestList = await getRequests();
			const friendInfoElement = document.querySelector(".friend-info");
			const is_friend = data.is_mutual_friend;
			const senderObj = requestList.find(req => req.sender.username == data.user.username);
			const receiverObj = requestList.find(req => req.receiver.username == data.user.username);
			const pendingReq = senderObj || receiverObj ? true : false;
			this.friendUsername = data.user.username;
			const friendInfo = `
				<div class="user-dashboard">
					<img src="${data.user.pro_pic}" alt="User pic">
					<div class="user-info">
						<h3>${data.user.username}</h3>
						${is_friend ? data.user.status_login ? "<h4>Online</h4>" : "<h4>Offline</h4>" : ""}
						${is_friend ? "<h5> <span data-translate=\"level2\" Level></span>" + data.user.level + "</h5>" : ""}
					</div>
				</div>
				<div class="btns-container">
				<button class="submit-btn dashboard-btn" id="chat" ><ion-icon name="chatbubbles-outline"></ion-icon> Send Message </button>
					<a href="/friends/user_info_${userID}/history" data-translate="history" class="submit-btn dashboard-btn" data-link><ion-icon name="bar-chart-outline"></ion-icon>History</a>
					${is_friend ? `<button type="button" data-translate="invitePlay" class="submit-btn dashboard-btn" id="game"><ion-icon name="game-controller-outline"></ion-icon>Play</button>` : 
						!pendingReq ? `<button type="button" data-translate="sendreq" class="submit-btn dashboard-btn" id="friend-request"><ion-icon name="person-add-outline"></ion-icon>Send Friend Request</button>` : 
						senderObj ? `<div class="info-request"><button type="button" class="submit-btn accept-request"><ion-icon name="checkmark-outline"></ion-icon>Accept</button><button type="button" class="submit-btn red-btn decline-request"><ion-icon name="close-outline"></ion-icon>Decline</button></div>` :
						receiverObj ? `<button type="button" data-translate="cancel" class="submit-btn red-btn cancel-request"><ion-icon name="trash-outline"></ion-icon>Cancel</button>` : ''}
					${is_friend ? `<button type="button" data-translate="remove" class="submit-btn dashboard-btn red-btn" id="remove"><ion-icon name="trash-outline"></ion-icon>Remove</button>` : '' }
				</div>
				<div class="hr" style="width: 75%; margin: 15px 0 20px 0;"></div>
				<button type="button" data-translate="back" class="submit-btn dashboard-btn" id="back"><ion-icon name="chevron-back-outline"></ion-icon>Back</button>
			`;
			friendInfoElement.innerHTML = friendInfo;
			const backBtn = document.getElementById("back");
			backBtn.addEventListener("click", e => {
				e.preventDefault();
				navigateTo("/friends");
			});
			if (is_friend) {
				const removeFriendBtn = document.getElementById("remove");
				removeFriendBtn.addEventListener("click", async e => {
					e.preventDefault();
					await removeFriend(data.user.username);
					navigateTo("/friends");
				});
			} else if (!pendingReq){
				const sendRequestBtn = document.getElementById("friend-request");
				sendRequestBtn.addEventListener("click", async e => {
					e.preventDefault();
					await sendFriendRequest(data.user.username);
					createNotification("Friend request sent!", "friendReqSent");
					friendInfoElement.innerHTML = "";
					await this.getUserInfo(data.user.username);
				});
			}
			if (senderObj) {
				const acceptRequestBtn = document.querySelector(".accept-request");
				const declineRequestBtn = document.querySelector(".decline-request");
				acceptRequestBtn.addEventListener("click", async e => {
					e.preventDefault();
					acceptFriendRequest(data.user.username);
					friendInfoElement.innerHTML = "";
					await this.getUserInfo(data.user.username);
				});
				declineRequestBtn.addEventListener("click", async e => {
					e.preventDefault();
					declineFriendRequest(data.user.username);
					friendInfoElement.innerHTML = "";
					await this.getUserInfo(data.user.username);
				});
			} else if (receiverObj) {
				const cancelRequestBtn = document.querySelector(".cancel-request");
				cancelRequestBtn.addEventListener("click", async e => {
					e.preventDefault();
					cancelRequest(data.user.username);
					friendInfoElement.innerHTML = "";
					createNotification("Friend request cancelled!", "friendReqCancelled");
					await this.getUserInfo(data.user.username);
				});
			}
		})
		.catch((error) => {
			createNotification("No user found", "noUserFound");
			console.error('Error:', error);
		});
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
					  <a class="nav-link" href="/online" data-link>Online Game</a>
					</li>
					<li class="nav-item">
					  <a class="nav-link" href="/static/cli/cli.zip">CLI</a>
					</li>
					<li class="nav-item">
					  <a class="nav-link" href="/friends" data-link>Friends</a>
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

	getContent() {
		const user_infoHTML = `
			<div class="dashboard">
				<div class="friend-info"></div>
			</div>
		`;
		return user_infoHTML;
	}
}