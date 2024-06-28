import AbstractView from "./AbstractView.js";
import { getCSRFToken } from "./Info.js";
import { sanitizeInput } from "../utilities.js";
import { createNotification } from "./Notifications.js";
import { changeLanguage, navigateTo } from "../index.js";
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
	var url = "/friend/remove/";

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
		this.nav = document.querySelector("header");
		this.nav.innerHTML = this.getNav();
		this.content.innerHTML = this.getContent();
		this.activeBtns();
		this.CurrentUsername;
		this.isStartFriends = true;
		this.lang = localStorage.getItem('language') || 'en';
	}

	activeBtns () {
		const backBtn = document.getElementById("back");
		backBtn.addEventListener("click", e => {
			e.preventDefault();
			if (this.isStartFriends) {
				navigateTo("/dashboard");
			} else {
				this.isStartFriends = true;
				navigateTo("/friends");
			}
		});
		const friendsListBtn = document.getElementById("friends-list");
		friendsListBtn.addEventListener("click", async e => {
			await this.getFriendList();
		});
		const searchUserBtn = document.getElementById("search-user");
		searchUserBtn.addEventListener("click", async e => {
			this.searchUser();
		});
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

	noFriends (element) {
		var noEntries = document.createElement("p");
		noEntries.className = "no-entries";
		noEntries.textContent = "You don't have any friends yet.";
		noEntries.setAttribute("data-translate", "noFriends");
		element.appendChild(noEntries);
		element.style.textAlign = "center";
		changeLanguage(this.lang);

	}

	async getFriendList() {
		this.isStartFriends = false;
		const searchUserBtn = document.getElementById("search-user");
		searchUserBtn.style.display = "none"; // Hide the search-user button
		const friendsListBtn = document.getElementById("friends-list");
		friendsListBtn.style.display = "none"; // Hide the friends-list button
	
		const friendsListHTML = '<h4 data-translate="friendlist" >Friends List</h4><div class="friends-list"></div>';
		friendsListBtn.insertAdjacentHTML("afterend", friendsListHTML);
	
		var response = await fetch("friend/list/");
		var data = await response.json();
		var friendListElement = document.querySelector(".friends-list");
	
		if (data.length === 0) {
			this.noFriends(friendListElement);
			return;
		}
	
		for (var i = 0; i < data.length; i++) {
			var friendList = data[i];
			var userUsername = friendList.user.username;
			for (let j = 0; j < friendList.friends.length; j++) {
				const friendUsername = friendList.friends[j].username;
				const friendStatus = friendList.friends[j].status_login;
				const friendPic = friendList.friends[j].pro_pic;
				const friendElement = `
					<div class="friend">
						<img src="${friendPic}" alt="User pic">
						<a href="/friends/user_info_${friendUsername}" class="info" data-link">${friendUsername}</a>
						<ion-icon class="friend-icon" name="person-sharp"></ion-icon>
					</div>
				`;
				friendListElement.innerHTML += friendElement;
				var friendIcon = document.querySelectorAll(".friend-icon")[j];
				if (friendStatus)
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
	
		changeLanguage(this.lang);
	}
	

	// async getFriendList() {
	// 	this.isStartFriends = false;
	// 	const searchUserBtn = document.getElementById("search-user");
	// 	searchUserBtn.style.display = "none";
	// 	const friendsListBtn = document.getElementById("friends-list");
	// 	friendsListBtn.setAttribute("disabled", "true");
	// 	const friendsListHTML = '<div class="friends-list"></div>';
	// 	friendsListBtn.insertAdjacentHTML("afterend", friendsListHTML);
	// 	var response = await fetch("friend/list/");
	// 	var data = await response.json();
	// 	var friendListElement = document.querySelector(".friends-list");
	// 	// friendListElement.innerHTML = "";
	// 	// friendListElement.className = "content";
	// 	if (data.length === 0) {
	// 		this.noFriends(friendListElement);
	// 		return;
	// 	}
	// 	for (var i = 0; i < data.length; i++) {
	// 		var friendList = data[i];
	// 		var userUsername = friendList.user.username;         
	// 		for (let j = 0; j < friendList.friends.length; j++) {
	// 			const friendUsername = friendList.friends[j].username;
	// 			const friendStatus = friendList.friends[j].status_login;
	// 			const friendPic = friendList.friends[j].pro_pic;
	// 			const friendElement = `
	// 				<div class="friend">
	// 					<img src="${friendPic}" alt="User pic">
	// 					<a href="/friends/user_info_${friendUsername}" class="info" data-link">${friendUsername}</a>
	// 					<ion-icon class="friend-icon" name="person-sharp"></ion-icon>
	// 				</div>
	// 			`;
	// 			friendListElement.innerHTML += friendElement;
	// 			var friendIcon = document.querySelectorAll(".friend-icon")[j];
	// 			if (friendStatus)
	// 				friendIcon.classList.add("friend-online");
	// 			else
	// 				friendIcon.classList.add("friend-offline");
	// 		}
	// 	}
	// 	var infoElements = document.querySelectorAll(".info");
	// 	infoElements.forEach(element => {
	// 		element.addEventListener("click", async e =>{
	// 			e.preventDefault();
	// 			navigateTo(e.target.href);
	// 		});
	// 	});
	// 	changeLanguage(this.lang);
	// }

	// async searchUser() {
	// 	this.isStartFriends = false;
	// 	const friendsListBtn = document.getElementById("friends-list");
	// 	friendsListBtn.style.display = "none";
	// 	const searchUserBtn = document.getElementById("search-user");
	// 	searchUserBtn.setAttribute("disabled", "true");
	// 	const friendsListHTML = `
	// 		<div class="input-box add-friend">
	// 			<input type="text" id="friendNameInput" required>
	// 			<label data-translate="finduser">Find User</label>
	// 			<ion-icon name="search-outline"></ion-icon>
	// 		</div>
	// 		<button type="submit" data-translate="search" class="submit-btn" id="search-btn"><ion-icon name="search-outline"></ion-icon>Search</button>
	// 		<div class="friends-list"></div>
	// 	`;
	// 	searchUserBtn.insertAdjacentHTML("afterend", friendsListHTML);
	// 	changeLanguage(this.lang);
	// 	const friendsSearch = document.querySelector(".friends-list");
	// 	const friendInput = document.querySelector("#friendNameInput");
	// 	const searchBtn = document.querySelector("#search-btn");
	// 	friendInput.addEventListener("input", async e => {
	// 		if (friendInput.value === "") {
	// 			await this.getFriendList();
	// 		}
	// 	});
	// 	searchBtn.addEventListener("click", async e => {
	// 		var inputText = sanitizeInput(friendInput.value);
	// 		fetch(`/accounts/search/?q=${inputText}`)
    // 		    .then(response => response.json())
    // 		    .then(data => {
	// 				console.log(data[0]);
	// 				const notFound = "User not Found"
	// 				if (data[0] != notFound && data.some(user => user.username != this.userObj.getUser())) {
	// 					friendsSearch.innerHTML = "";
	// 					var k = 0;
    // 		        	data.forEach(user => {
	// 						var userElement = `
	// 							<div class="user">
	// 								<img src="${user.pro_pic}" alt="User pic">
	// 								<a href="/friends/user_info_${user.username}" class="info" data-link">${user.username}</a>
	// 								<ion-icon class="friend-icon" name="person-sharp"></ion-icon>
	// 							</div>
	// 						`;
	// 						if (user.username && user.username != this.userObj.getUser()) {
	// 							friendsSearch.innerHTML += userElement;
	// 							var friendIcon = document.querySelectorAll(".friend-icon")[k++];
	// 							if (user.status_login !== undefined) {
	// 								if (user.status_login) {
	// 									friendIcon.classList.add("friend-online");
	// 								} else {
	// 									friendIcon.classList.add("friend-offline");
	// 								}
	// 							}
	// 						}
    // 		        	});					
	// 					friendInput.value = "";
	// 					const infoElements = document.querySelectorAll(".info");
	// 					infoElements.forEach(element => {
	// 						element.addEventListener("click", async e =>{
	// 							e.preventDefault();
	// 							navigateTo(e.target.href);
	// 						});
	// 					});
	// 				} else {
	// 					createNotification("User not found", "usernotfound");
	// 					friendInput.value = "";
	// 				}
    // 		    })
    // 		    .catch(error => console.error('Error:', error));
	// 	});
	// }
	async searchUser() {
		this.isStartFriends = false;
		const friendsListBtn = document.getElementById("friends-list");
		friendsListBtn.style.display = "none"; // Hide the friends-list button
		const searchUserBtn = document.getElementById("search-user");
		searchUserBtn.style.display = "none"; // Hide the search-user button
	
		const friendsListHTML = `
			<h4 data-translate="searchfriends">Search friends</h4>
			<div class="input-box add-friend">
				<input type="text" id="friendNameInput" required>
				<label data-translate="finduser">Find User</label>
				<ion-icon name="search-outline"></ion-icon>
			</div>
			<button type="submit" data-translate="search" class="submit-btn" id="search-btn"><ion-icon name="search-outline"></ion-icon>Search</button>
			<div class="friends-list"></div>
		`;
		searchUserBtn.insertAdjacentHTML("afterend", friendsListHTML);
		changeLanguage(this.lang);
		const friendsSearch = document.querySelector(".friends-list");
		const friendInput = document.querySelector("#friendNameInput");
		const searchBtn = document.querySelector("#search-btn");
		// friendInput.addEventListener("input", async e => {
		// 	if (friendInput.value === "") {
		// 		await this.getFriendList();
		// 	}
		// });
		searchBtn.addEventListener("click", async e => {
			var inputText = friendInput.value; // Create a function to sanitize input BACKEND
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
									<a href="/friends/user_info_${user.username}" class="info" data-link">${user.username}</a>
									<ion-icon class="friend-icon" name="person-sharp"></ion-icon>
								</div>
							`;
							if (user.username && user.username != this.userObj.getUser()) {
								friendsSearch.innerHTML += userElement;
								var friendIcon = document.querySelectorAll(".friend-icon")[k++];
								if (user.status_login !== undefined) {
									if (user.status_login) {
										friendIcon.classList.add("friend-online");
									} else {
										friendIcon.classList.add("friend-offline");
									}
								}
							}
						});                    
						friendInput.value = "";
						const infoElements = document.querySelectorAll(".info");
						infoElements.forEach(element => {
							element.addEventListener("click", async e =>{
								e.preventDefault();
								navigateTo(e.target.href);
							});
						});
					} else {
						createNotification("User not found", "usernotfound");
						friendInput.value = "";
						friendsSearch.innerHTML = "";
					}
				})
				.catch(error => console.error('Error:', error));
		});
	}
	

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

	getContent() {
		const friendHTML = `
			<div class="dashboard">
				<div class="friends-card">
					<h1 data-translate="friends">Friends</h1>
					<div class="btns-container">
						<div class="hr" style="width: 80%; margin-bottom: 25px;"></div>
						<button type="button" class="submit-btn" data-translate="friendlist" id="friends-list"><ion-icon name="people-outline"></ion-icon>Friends List</button>
						<button type="button" class="submit-btn" data-translate="finduser" id="search-user"><ion-icon name="search-outline"></ion-icon>Search User</button>
					</div>
					<div class="back-btn-container">
						<div class="hr" style="width: 80%; margin-bottom: 15px;"></div>
						<button type="button" data-translate="back" class="submit-btn dashboard-btn" id="back"><ion-icon name="chevron-back-outline"></ion-icon>Back</button>
					</div>
				</div>
			</div>
		`;
		return friendHTML;
	}
}

/*
<h4 data-translate="searchfriends">Search friends</h4>
<div class="input-box add-friend">
	<input type="text" id="friendNameInput" required>
	<label data-translate="finduser">Find User</label>
	<ion-icon name="search-outline"></ion-icon>
</div>
<button type="submit" data-translate="search" class="submit-btn dashboard-btn" id="search-btn"><ion-icon name="search-outline"></ion-icon>Search</button>
<div class="hr" style="width: 75%; margin: 10px 0 10px 0;"></div>
<h4 id="friend-title" data-translate="friendlist">Friends List</h4>
<div class="friends-list"></div>
*/

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