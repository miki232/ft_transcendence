import AbstractView from "./AbstractView.js";
import { getCSRFToken } from "./Info.js";
import { createNotification } from "./Notifications.js";
import { changeLanguage, navigateTo } from "../index.js";

export async function getRequests() {
	const response = await fetch("/friend/request/list/");
	const data = await response.json();
	return data;
}

export async function cancelRequest(user){
	// Get the username from the list of friend
	// Create a new XMLHttpRequest object
	var xhr = new XMLHttpRequest();

	// Set the request URL
	var url = "/friend/request/cancel/";

	// Set the request method to POST
	xhr.open("POST", url, true);

	// Set the request headers
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.setRequestHeader("X-CSRFToken", await getCSRFToken());

	// Set the request body
	var data = JSON.stringify({
		"receiver_user_id": user
	});

	// Send the request
	xhr.send(data);
}

export async function declineFriendRequest(userId) {
	// Create a new XMLHttpRequest object
	var xhr = new XMLHttpRequest();

	// Set the request URL
	var url = "/friend/request/decline/";

	// Set the request method to POST
	xhr.open("POST", url, true);

	// Set the request headers
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.setRequestHeader("X-CSRFToken", await getCSRFToken());

	// Set the request body
	var data = JSON.stringify({
		"sender_user_id": userId
	});

	// Send the request
	xhr.send(data);
}

export function acceptFriendRequest(userId) {
	// Create a new XMLHttpRequest object
	var xhr = new XMLHttpRequest();

	// Set the request URL
	var url = "/friend/accept/" + userId + "/";

	// Set the request method to GET
	xhr.open("GET", url, true);

	// Send the request
	xhr.send()
}

export async function sendFriendRequest(user) {

	// Get the username from the input field
	var csrf = await getCSRFToken();
	console.log(csrf)
	// var username = document.getElementById("friendNameInput").value;
	// Create a new XMLHttpRequest object
	var xhr = new XMLHttpRequest();
	console.log(user)
	// Set the request URL
	var url = "/friend/request/send/";

	// Set the request method to POST
	xhr.open("POST", url, true);

	// Set the request headers
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.setRequestHeader("X-CSRFToken", csrf);

	// Set the request body
	var data = JSON.stringify({
		"receiver_user_id": user
	});

	// Send the request
	// ws.send(JSON.stringify({'notifications to ': user}));

	xhr.send(data);
}

export default class extends AbstractView {
	constructor(user) {
	    super();
		this.user = user;
		this.content = document.querySelector("#content");
		this.nav = document.querySelector("nav");
		this.nav.innerHTML = this.getNav();
		this.content.innerHTML = this.getContent();
		this.requestsList();
	}

	async requestsList() {
		var data = await getRequests();
		const requestsElement = document.querySelector(".requests");
		const requestsHTML = `
			<h2 data-translate="requests">Requests</h2>
			<div class="requests-list"></div>
			<div class="hr" style="width: 75%; margin: 15px 0 20px 0;"></div>
			<button type="button" class="submit-btn dashboard-btn" data-translate="back" id="back"><ion-icon name="chevron-back-outline"></ion-icon>Back</button>
		`;
		requestsElement.innerHTML = requestsHTML;
		const backBtn = document.getElementById("back");
			backBtn.addEventListener("click", e => {
				e.preventDefault();
				navigateTo("/dashboard");
			});
		const requestsListElement = document.querySelector(".requests-list");
		const noEntries = document.createElement("span");
		noEntries.className = "no-entries";
		noEntries.textContent = "No requests";
		requestsListElement.appendChild(noEntries);
		for (let i = 0; i < data.length; i++) {
			const request = data[i];
			const senderUsername = request.sender.username;
			const receiverUsername = request.receiver.username;
			const requestType = receiverUsername === this.user.getUser();
			console.log(requestType);
			noEntries.remove();
			const requestView = `
				<div class="request-line">
					<img src="${requestType ? request.sender.pro_pic : request.receiver.pro_pic}"/>
					<span class="info" data-username="${requestType ? senderUsername : receiverUsername}">${requestType ? senderUsername : receiverUsername}</span>
					${requestType ? `<button type="button" class="submit-btn accept-request"><ion-icon name="checkmark-outline"></ion-icon>Accept</button>
					<button type="button" class="submit-btn red-btn decline-request"><ion-icon name="close-outline"></ion-icon>Decline</button>` :
					`<button type="button" class="submit-btn red-btn cancel-request"><ion-icon name="trash-outline"></ion-icon>Cancel</button>`}
				</div>
			`;
			requestsListElement.innerHTML += requestView;
			const acceptRequestBtn = document.querySelectorAll(".accept-request");
			const declineRequestBtn = document.querySelectorAll(".decline-request");
			const cancelRequestBtn = document.querySelectorAll(".cancel-request");
			acceptRequestBtn.forEach(element => {
				element.addEventListener("click", async e => {
					e.preventDefault();
					acceptFriendRequest(senderUsername);
					createNotification("Friend request accepted!");
					element.parentElement.remove();
					if (requestsListElement.childElementCount === 0) requestsListElement.appendChild(noEntries);
				});
			});
			declineRequestBtn.forEach(element => {
				element.addEventListener("click", async e => {
					e.preventDefault();
					await declineFriendRequest(senderUsername);
					element.parentElement.remove();
					if (requestsListElement.childElementCount === 0) requestsListElement.appendChild(noEntries);
				});
			});
			cancelRequestBtn.forEach(element => {
				element.addEventListener("click", async e => {
					e.preventDefault();
					await cancelRequest(receiverUsername);
					element.parentElement.remove();
					if (requestsListElement.childElementCount === 0) requestsListElement.appendChild(noEntries);
				});
			});
		}
		const lang = localStorage.getItem('language') || 'en';
		changeLanguage(lang);
	}

	getNav() {
		const navHTML = `
			<a href="/local_game" data-translate="local" name="local" class="dashboard-nav" data-link>Local Game</a>
			<a href="/online" data-translate="online" name="online" class="dashboard-nav" data-link>Online Game</a>
			<a href="/ranking" data-translate="ranking" name="ranking" class="dashboard-nav" data-link>Ranking</a>
			<a href="/friends" data-translate="friends" name="friends" class="dashboard-nav" data-link>Friends</a>
			<a href="/chat" name="chat" class="dashboard-nav" data-link>Chat</a>
			<a href="/dashboard" name="dashboard" class="profile-pic dashboard-nav" data-link><img alt="Profile picture" src="${this.user.pro_pic}"/></a>
		`;
		return navHTML;
	}

	getContent() {
		const requestHTML = `
			<div class="dashboard">
				<div class="requests">
				</div>
			</div>
		`;
		return requestHTML;
	}
}