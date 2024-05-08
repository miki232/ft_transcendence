import AbstractView from "./AbstractView.js";
import { getCSRFToken } from "./Info.js";
import { sanitizeInput } from "../utilities.js";
import { createNotification } from "./Notifications.js";
import { navigateTo } from "../index.js";
import { getRequests, sendFriendRequest } from "./Requests.js";

// export async function getCSRFToken() {
// 	let csrftoken = await fetch("csrf-token")
// 		.then(response => response.json())
// 		.then(data => data.csrfToken);
// 		console.log(csrftoken);
// 	return csrftoken;
// }

export async function removeFriend(user){
	// Get the username from the list of friend

	var friendUsername = user;
	console.log(friendUsername);
	// Create a new XMLHttpRequest object
	var xhr = new XMLHttpRequest();

	// Set the request URL
	var url = "friend/remove/";

	// Set the request method to POST
	xhr.open("POST", url, true);

	// Set the request headers
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.setRequestHeader("X-CSRFToken", await getCSRFToken());

	// Set the request body
	var data = JSON.stringify({
		"receiver_user_id": friendUsername
	});

	// Send the request
	xhr.send(data);
}

export default class Friends extends AbstractView {
	constructor(userOBJ) {
		super();
		this.userObj = userOBJ;
		this.content = document.querySelector("#content");
		this.nav = document.querySelector("nav");
		// this.nav.innerHTML = this.getNav();
		this.content.innerHTML = this.getContent();
		this.initialize();
		this.CurrentUsername;
		// this.userObjto;
		// // this.userObj;
		// this.email;
		// this.pro_pic;
	}

	async initialize() {
		await this.getFriendList();
		await this.searchUser();
	}

	async loadData() {
		var csrftoken = await getCSRFToken()
		await fetch('/accounts/user_info/', {
			method: 'GET',
			headers: {
				'Content-Type' : 'application/json',
				'X-CSRFToken': csrftoken
			}
		})
			.then(response => response.json())
			.then(data => {
				console.log(data);
				this.CurrentUsername = data.username;
			})
			.catch((error) => {
				console.error('Error:', error);
			})
	}

/* 	sendFriendRequest() { // anche questa standalone possiamo anche levarla
		// Get the username from the input field
		var username = document.getElementById("username").value;

		// Create a new XMLHttpRequest object
		var xhr = new XMLHttpRequest();

		// Set the request URL
		var url = "/friend/request/send/";

		// Set the request method to POST
		xhr.open("POST", url, true);

		// Set the request headers
		xhr.setRequestHeader("Content-Type", "application/json");
		xhr.setRequestHeader("X-CSRFToken", this.getCSRFToken());

		// Set the request body
		var data = JSON.stringify({
			"receiver_user_id": username
		});

		// Send the request
		xhr.send(data);
	} */

	/* acceptFriendRequest(userId) {
		// Create a new XMLHttpRequest object
		var xhr = new XMLHttpRequest();
		console.log(userId);
		// Set the request URL
		var url = "accept/" + userId + "/";
		
		// Set the request method to GET
		xhr.open("GET", url, true);
		
		// Send the request
		xhr.send();
	} */

	// acceptFriendRequest(userId) {
    // 	// Create a new XMLHttpRequest object
    // 	var xhr = new XMLHttpRequest();
    
    // 	// Set the request URL
    // 	var url = "friend/accept/" + userId + "/";
    
    // 	// Set the request method to GET
    // 	xhr.open("GET", url, true);
    
    // 	// Send the request
    // 	xhr.send()
    // }

	// async getFriendInfo(user) {
	// 	var csrf = await getCSRFToken();
	// 	await fetch('/accounts/guser_info/?username=' + user, {
	// 		method: 'GET',
	// 		headers: {
	// 			'Content-Type' : 'application/json',
	// 			'X-CSRFToken': csrf
	// 		}
	// 	})
	// 	.then(response => response.json())
	// 	.then(async data => {
	// 		const requestList = await getRequests();
	// 		var friendInfoElement = document.querySelector(".friend-info");
	// 		var is_friend = data.is_mutual_friend;
	// 		var senderObj = requestList.find(req => req.sender.username == data.user.username);
	// 		var receiverObj = requestList.find(req => req.receiver.username == data.user.username);
	// 		var pendingReq = senderObj || receiverObj ? true : false;
	// 		var friendInfo = `
	// 			<img src="${data.user.pro_pic}" alt="User pic">
	// 			<h3 id="Username">${data.user.username}</h3>
	// 			<h4>${data.user.status_login}</h4>
	// 			<button type="button" class="submit-btn dashboard-btn" id="chat"><ion-icon name="chatbubbles-outline"></ion-icon>Send Message</button>
	// 			<button type="button" class="submit-btn	dashboard-btn"><ion-icon name="bar-chart-outline"></ion-icon>History</button>
	// 			${is_friend ? `<button type="button" class="submit-btn dashboard-btn" id="game"><ion-icon name="game-controller-outline"></ion-icon>Play</button>` : 
	// 				!pendingReq ? `<button type="button" class="submit-btn dashboard-btn" id="friend-request"><ion-icon name="person-add-outline"></ion-icon>Send Friend Request</button>` : 
	// 				senderObj ? `<div class="info-request"><button type="button" class="submit-btn accept-request"><ion-icon name="checkmark-outline"></ion-icon>Accept</button><button type="button" class="submit-btn red-btn decline-request"><ion-icon name="close-outline"></ion-icon>Decline</button></div>` :
	// 				receiverObj ? `<button type="button" class="submit-btn red-btn cancel-request"><ion-icon name="trash-outline"></ion-icon>Cancel</button>` : ''}
	// 			${is_friend ? `<button type="button" class="submit-btn dashboard-btn red-btn" id="remove"><ion-icon name="trash-outline"></ion-icon>Remove</button>` : '' }
	// 			<div class="hr" style="width: 75%; margin: 15px 0 20px 0;"></div>
	// 			<button type="button" class="submit-btn dashboard-btn" id="back"><ion-icon name="chevron-back-outline"></ion-icon>Back</button>
	// 		`;
	// 		friendInfoElement.innerHTML = friendInfo;
	// 		if (is_friend) {
	// 			const removeFriendBtn = document.getElementById("remove");
	// 			removeFriendBtn.addEventListener("click", async e => {
	// 				e.preventDefault();
	// 				await removeFriend(data.user.username);
	// 				const toRemove = document.querySelector("[data-username='" + data.user.username + "']");
	// 				toRemove.parentElement.remove();
	// 				if (document.querySelector(".friends-list").childElementCount == 0) {
	// 					var noEntries = document.createElement("span");
	// 					noEntries.textContent = "No friends";
	// 					document.querySelector(".friends-list").appendChild(noEntries);
	// 				}
	// 			});
	// 		} else if (!pendingReq){
	// 			const sendRequestBtn = document.getElementById("friend-request");
	// 			sendRequestBtn.addEventListener("click", async e => {
	// 				e.preventDefault();
	// 				await sendFriendRequest(data.user.username);
	// 				createNotification("Friend request sent!");
	// 				friendInfoElement.innerHTML = "";
	// 				await this.getFriendInfo(data.user.username);
	// 			});
	// 		}
	// 		if (senderObj) {
	// 			const acceptRequestBtn = document.querySelector(".accept-request");
	// 			const declineRequestBtn = document.querySelector(".decline-request");
	// 			acceptRequestBtn.addEventListener("click", async e => {
	// 				e.preventDefault();
	// 				acceptFriendRequest(data.user.username);
	// 				friendInfoElement.innerHTML = "";
	// 				await this.getFriendInfo(data.user.username);
	// 			});
	// 			declineRequestBtn.addEventListener("click", async e => {
	// 				e.preventDefault();
	// 				declineFriendRequest(data.user.username);
	// 				friendInfoElement.innerHTML = "";
	// 				await this.getFriendInfo(data.user.username);
	// 			});
	// 		} else if (receiverObj) {
	// 			const cancelRequestBtn = document.querySelector(".cancel-request");
	// 			cancelRequestBtn.addEventListener("click", async e => {
	// 				e.preventDefault();
	// 				cancelRequest(data.user.username);
	// 				friendInfoElement.innerHTML = "";
	// 				await this.getFriendInfo(data.user.username);
	// 			});
	// 		}
	// 	})
	// 	.catch((error) => {
	// 		alert("No user found!");
	// 		console.error('Error:', error);
	// 	})
	// }

	async getFriendList() {
		var response = await fetch("friend/list/");
		var data = await response.json();
		var friendListElement = document.querySelector(".friends-list");
		// friendListElement.innerHTML = "";
		// friendListElement.className = "content";
		var noEntries = document.createElement("span");
		noEntries.className = "no-entries";
		noEntries.textContent = "You don't have any friends yet.";
		friendListElement.appendChild(noEntries);
		for (var i = 0; i < data.length; i++) {
			var friendList = data[i];
			var userUsername = friendList.user.username;            
			for (let j = 0; j < friendList.friends.length; j++) {
				noEntries.remove();
				const friendUsername = friendList.friends[j].username;
				const friendStatus = friendList.friends[j].status_login;
				const friendPic = friendList.friends[j].pro_pic;
				const friendElement = `
					<div class="friend">
						<img src="${friendPic}" alt="User pic">
						<a href="/user_info_${friendUsername}" class="info" data-link">${friendUsername}</a>
						<ion-icon class="friend-icon" name="person-sharp"></ion-icon>
					</div>
				`;
				friendListElement.innerHTML += friendElement;
				var friendIcon = document.querySelectorAll(".friend-icon")[j];
				if (friendStatus == "online")
					friendIcon.classList.add("friend-online");
				else
					friendIcon.classList.add("friend-offline");
			}
		}
		var infoElements = document.querySelectorAll(".info");
		infoElements.forEach(element => {
			element.addEventListener("click", async e =>{
				e.preventDefault();
				navigateTo(e.target.href);
			});
		});
	}

	async searchUser() {
		const friendsSearch = document.querySelector(".friends-list");
		const friendInput = document.querySelector("#friendNameInput");
		const searchBtn = document.querySelector("#search-btn");
		const friendTitle = document.querySelector("#friend-title");
		friendInput.addEventListener("input", async e => {
			if (friendInput.value === "") {
				friendTitle.textContent = "Friends List";
				friendsSearch.innerHTML = "";
				await this.getFriendList();
			}
		});
		searchBtn.addEventListener("click", async e => {
			var inputText = sanitizeInput(friendInput.value);
			fetch(`/accounts/search/?q=${inputText}`)
    		    .then(response => response.json())
    		    .then(data => {
					console.log(data[0]);
					const notFound = "User not Found"
					if (data[0] != notFound && data.some(user => user.username != this.userObj.getUser())) {
						friendsSearch.innerHTML = "";
						var k = 0;
    		        	data.forEach(user => {
							var userElement = `
								<div class="user">
									<img src="${user.pro_pic}" alt="User pic">
									<a href="/user_info_${user.username}" class="info" data-link">${user.username}</a>
									<ion-icon class="friend-icon" name="person-sharp"></ion-icon>
								</div>
							`;
							if (user.username && user.username != this.userObj.getUser()) {
								friendTitle.textContent = "Search Results";
								friendsSearch.innerHTML += userElement;
								var friendIcon = document.querySelectorAll(".friend-icon")[k++];
								if (user.status_login == "online")
									friendIcon.classList.add("friend-online");
								else
									friendIcon.classList.add("friend-offline");
							}
    		        	});					
						friendInput.value = "";
						friendsSearch.innerHTML += `<span id="close-search"><ion-icon name="close-circle-outline"></ion-icon></span>`;
						const closeBtn = document.getElementById("close-search");
						closeBtn.addEventListener("click", async e => {
							e.preventDefault();
							friendTitle.textContent = "Friends List";
							friendsSearch.innerHTML = "";
							await this.getFriendList();
						});
						const infoElements = document.querySelectorAll(".info");
						infoElements.forEach(element => {
							element.addEventListener("click", async e =>{
								e.preventDefault();
								navigateTo(e.target.href);
							});
						});
						// var infoElements = document.querySelectorAll(".info");
						// const searchBox = document.querySelector(".dashboard");
						// infoElements.forEach(element => {
						// 	element.addEventListener("click", async e =>{
						// 		e.preventDefault();
						// 		var userInfo = e.target.getAttribute("data-username");
						// 		searchBox.classList.add("change-view");
						// 		await this.getFriendInfo(userInfo);
						// 	});
						// });
					} else {
						createNotification("User not found");
						friendInput.value = "";
					}
    		    })
    		    .catch(error => console.error('Error:', error));
		});
	}

	// async removeFriend(){
	// 	// Get the username from the list of friend
	// 	var friendElement = document.getElementById("friend-list").firstChild;
	// 	var text = friendElement.textContent;
	// 	var parts = text.split(", ");
	// 	var friendUsername = parts[1].split(": ")[1];
	// 	console.log(friendUsername);
	// 	// Create a new XMLHttpRequest object
	// 	var xhr = new XMLHttpRequest();

	// 	// Set the request URL
	// 	var url = "remove/";

	// 	// Set the request method to POST
	// 	xhr.open("POST", url, true);

	// 	// Set the request headers
	// 	xhr.setRequestHeader("Content-Type", "application/json");
	// 	xhr.setRequestHeader("X-CSRFToken", this.getCSRFToken());

	// 	// Set the request body
	// 	var data = JSON.stringify({
	// 		"receiver_user_id": friendUsername
	// 	});

	// 	// Send the request
	// 	xhr.send(data);
	// }

	// async getPendingRequests() {
	// 	var response = await fetch("friend/request/list/");
	// 	var data = await response.json();
	// 	var pendingRequestsElement = document.querySelector(".pending-requests");
	// 	// pendingRequestsElement.innerHTML = "";
		
	// 	for (var i = 0; i < data.length; i++) {
	// 		var request = data[i];
	// 		var senderUsername = request.sender.username;
	// 		var receiverUsername = request.receiver.username;
			
	// 		var requestElement = document.createElement("a");
	// 		requestElement.href = '/user_info';
	// 		if (receiverUsername == this.CurrentUsername){

	// 			requestElement.setAttribute('data-username', senderUsername);
	// 			requestElement.textContent = senderUsername;
	// 		}
	// 		else{
	// 			requestElement.setAttribute('data-username', receiverUsername);
	// 			requestElement.textContent = receiverUsername;
	// 		}
				
	// 		 // Create a button to accept the request
	// 		if (senderUsername !== this.CurrentUsername){
	// 			var acceptButton = document.createElement("button");
	// 			var declineButton = document.createElement("button");
	// 			declineButton.innerHTML = "Decline";
	// 			declineButton.id = "decline-request";
	// 			declineButton.onclick = (function(senderUsername) {
	// 				return function(){
	// 					declineFriendRequest(senderUsername);
	// 				};
	// 			})(senderUsername);
						
	// 			requestElement.appendChild(declineButton);
	// 			acceptButton.innerHTML = "Accept";
	// 			acceptButton.id = "Accept-request";
	// 			acceptButton.onclick = (function(senderUsername) {
	// 				return function(){
	// 					acceptFriendRequest(senderUsername);
	// 				};
	// 			})(senderUsername);
						
	// 			requestElement.appendChild(acceptButton);
	// 		}
	// 		else
	// 		{
	// 			var cancelButton = document.createElement("button");
	// 			cancelButton.innerHTML = "Cancel";
	// 			cancelButton.id = "cancel-request";
	// 			cancelButton.onclick = (function(receiverUsername) {
	// 				return function(){
	// 					cancelRequest(receiverUsername);
	// 				};
	// 			})(receiverUsername);
	// 			console.log(receiverUsername);
	// 			requestElement.appendChild(cancelButton);
				

	// 		}
	// 		pendingRequestsElement.appendChild(requestElement);
	// 	}
	// }

	getCookie(name) {
		let cookieValue = null;
		if (document.cookie && document.cookie !== '') {
			const cookies = document.cookie.split(';');
			for (let i = 0; i < cookies.length; i++) {
				const cookie = cookies[i].trim();
				if (cookie.substring(0, name.length + 1) === (name + '=')) {
					cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
					break;
				}
			}
		}
		return cookieValue;
	}

	// async loadUserData() {
	// 	var csrftoken = this.getCookie('csrftoken')
	// 	await fetch('/accounts/user_info/', {
	// 		method: 'GET',
	// 		headers: {
	// 			'Content-Type' : 'application/json',
	// 			'X-CSRFToken': csrftoken
	// 		}
	// 	})
	// 		.then(response => response.json())
	// 		.then(data => {
	// 			console.log(data);
	// 			this.setUser(data.username);
	// 			this.setEmail(data.email);
	// 			this.setPic(data.pro_pic); //new
	// 		})
	// 		.catch((error) => {
	// 			console.error('Error:', error);
	// 		})
	// }

	// async setPic(data_pic){ //new
	// 	this.pro_pic = data_pic;
	// }

	// async setUser(data_user) {
	// 	this.userObj = data_user;
	// }
	
	// async setEmail (data_email) {
	// 	this.email = data_email;
	// }

	// async getUser() {
	// 	return this.userObj;
	// }

	// async getEmail() {
	// 	return this.email;
	// }
	
	// async getPic(){ //new
	// 	return this.pro_pic;
	// }

	getNav() {
		const navHTML = `
			<a href="/local" name="local" class="dashboard-nav" data-link>Local Game</a>
			<a href="/online" name="online" class="dashboard-nav" data-link>Online Game</a>
			<a href="/ranking" name="ranking" class="dashboard-nav" data-link>Ranking</a>
			<a href="/friends" name="friends" class="dashboard-nav" data-link>Friends</a>
			<a href="/chat" name="chat" class="dashboard-nav" data-link>Chat</a>
			<a href="/dashboard" name="dashboard" class="profile-pic dashboard-nav" data-link><img alt="Profile picture" src="${this.userObj.getPic()}"/></a>
		`;
		return navHTML;
	}

	getContent() {
		const friendHTML = `
			<div class="dashboard">
				<div class="friends-card">
					<h1>Friends</h1>
					<h4>Search friends</h4>
					<div class="input-box add-friend">
						<input type="text" id="friendNameInput" required>
						<label>Find User</label>
						<ion-icon name="search-outline"></ion-icon>
					</div>
					<button type="submit" class="submit-btn dashboard-btn" id="search-btn"><ion-icon name="search-outline"></ion-icon>Search</button>
					<div class="hr" style="width: 75%; margin: 10px 0 10px 0;"></div>
					<h4 id="friend-title">Friends List</h4>
					<div class="friends-list"></div>
				</div>
			</div>
		`;
		return friendHTML;
	}
}

//OLD FRIEND CARD
/*
<div id="friends-card" class="cards">
	<h2>Friends</h2>
	<br>
	<h3>Send Friend Request</h3>
	<form>
		<input type="text" id="friendNameInput" placeholder="Enter friend's username">
		<button id="friendBtn">🔍</button>
	</form>
	<br>
	<h3>Pending Requests</h3>
	<div id="pending-requests"></div>
	<br>
	<h3>Friends List</h3>
	<div id="friends-list"></div>
</div>
*/