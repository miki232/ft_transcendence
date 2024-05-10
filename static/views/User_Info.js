import { removeFriend } from "./Friends.js";
import { getCSRFToken } from "./Info.js";
import { sanitizeInput } from "../utilities.js";
import { createNotification } from "./Notifications.js";
import { getRequests, acceptFriendRequest, declineFriendRequest, sendFriendRequest, cancelRequest } from "./Requests.js";
import AbstractView from "./AbstractView.js";
import { navigateTo } from "../index.js";

// export async function getCSRFToken() {
// 	let csrftoken = await fetch("csrf-token")
// 		.then(response => response.json())
// 		.then(data => data.csrfToken);
// 		console.log(csrftoken);
// 	return csrftoken;
// }

export default class UserInfo extends AbstractView {
	constructor(userID, userObj) {
		super();
		this.userObj = userObj;
		this.content = document.querySelector("#content");
		this.nav = document.querySelector("nav");
		this.nav.innerHTML = this.getNav();
		this.content.innerHTML = this.getContent();
		this.initialize(userID);
		// this.Userto;
		// // this.user;
		// this.email;
		// this.pro_pic;
	}

	async initialize(userID) {
		await this.getUserInfo(userID);
	};

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
			const friendInfo = `
				<img src="${data.user.pro_pic}" alt="User pic">
				<h3>${data.user.username}</h3>
				<h4>${data.user.status_login}</h4>
				<button type="button" class="submit-btn dashboard-btn" id="chat"><ion-icon name="chatbubbles-outline"></ion-icon>Send Message</button>
				<button type="button" class="submit-btn	dashboard-btn"><ion-icon name="bar-chart-outline"></ion-icon>History</button>
				${is_friend ? `<button type="button" class="submit-btn dashboard-btn" id="game"><ion-icon name="game-controller-outline"></ion-icon>Play</button>` : 
					!pendingReq ? `<button type="button" class="submit-btn dashboard-btn" id="friend-request"><ion-icon name="person-add-outline"></ion-icon>Send Friend Request</button>` : 
					senderObj ? `<div class="info-request"><button type="button" class="submit-btn accept-request"><ion-icon name="checkmark-outline"></ion-icon>Accept</button><button type="button" class="submit-btn red-btn decline-request"><ion-icon name="close-outline"></ion-icon>Decline</button></div>` :
					receiverObj ? `<button type="button" class="submit-btn red-btn cancel-request"><ion-icon name="trash-outline"></ion-icon>Cancel</button>` : ''}
				${is_friend ? `<button type="button" class="submit-btn dashboard-btn red-btn" id="remove"><ion-icon name="trash-outline"></ion-icon>Remove</button>` : '' }
				<div class="hr" style="width: 75%; margin: 15px 0 20px 0;"></div>
				<button type="button" class="submit-btn dashboard-btn" id="back"><ion-icon name="chevron-back-outline"></ion-icon>Back</button>
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
					createNotification("Friend request sent!");
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
					createNotification("Friend request cancelled!");
					await this.getUserInfo(data.user.username);
				});
			}
		})
		.catch((error) => {
			createNotification("No user found!");
			console.error('Error:', error);
		});
	}

	getNav() {
		const navHTML = `
			<a href="/local_game" name="local" class="dashboard-nav" data-link>Local Game</a>
			<a href="/online" name="online" class="dashboard-nav" data-link>Online Game</a>
			<a href="/ranking" name="ranking" class="dashboard-nav" data-link>Ranking</a>
			<a href="/friends" name="friends" class="dashboard-nav" data-link>Friends</a>
			<a href="/chat" name="chat" class="dashboard-nav" data-link>Chat</a>
			<a href="/dashboard" name="dashboard" class="profile-pic dashboard-nav" data-link><img alt="Profile picture" src="${this.userObj.getPic()}"/></a>
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