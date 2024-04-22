import AbstractView from "./AbstractView.js";
import Room from "./Room.js";
import { getRequests, acceptFriendRequest, declineFriendRequest, cancelRequest } from "./Requests.js";

export default class extends AbstractView {
	constructor() {
		super();
		this.isValid = false;
		this.user;
		this.email;
		this.room = new Room();
		this.pro_pic;
		// this.validateLogin();
		// this.setTitle("Dashboard");
	}

	async loadUserData() {
		var csrftoken = this.getCookie('csrftoken')
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
				this.setUser(data.username);
				this.setEmail(data.email);
				this.setPic(data.pro_pic); //new
			})
			.catch((error) => {
				console.error('Error:', error);
			})
	}

	async validateLogin() {
		try{
			var username = this.sanitizeInput(document.getElementById('login-user').value);
			var password = this.sanitizeInput(document.getElementById('login-pass').value);
		} catch (error){
			console.error(error);
			return;
		}
		var csrftoken = this.getCookie('csrftoken');

		await fetch('accounts/login/', {
			method: 'POST',
			headers: {
				'Content-Type' : 'application/json',
				'X-CSRFToken': csrftoken
			},
			body: JSON.stringify({
				username: username,
				password: password,
			}),
		}).then(response => {
			response.json();
			console.log(response);
			if (response.status === 200) {
				this.isValid = true;
			} else {
				alert('Wrong username or password');
			}
			})
			.then(data => console.log(data))
			.catch((error) => {
				console.error('Error: ', error);
		})
	}

	async requestsList() {
		var data = await getRequests();
		const requestsElement = document.querySelector(".requests");
		const requestsHTML = `
			<h2>Requests</h2>
			<div class="requests-list"></div>
			<div class="hr" style="width: 75%; margin: 15px 0 20px 0;"></div>
			<button type="button" class="submit-btn dashboard-btn" id="back"><ion-icon name="chevron-back-outline"></ion-icon>Back</button>
		`;
		requestsElement.innerHTML = requestsHTML;
		const requestsListElement = document.querySelector(".requests-list");
		var noEntries = document.createElement("span");
		noEntries.className = "no-entries";
		noEntries.textContent = "No requests found.";
		requestsListElement.appendChild(noEntries);
		for (var i = 0; i < data.length; i++) {
			var request = data[i];
			var senderUsername = request.sender.username;
			var receiverUsername = request.receiver.username;
			var requestType = receiverUsername === this.user;
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
	}

	async setPic(data_pic){ //new
		this.pro_pic = data_pic;
	}

	async setUser(data_user) {
		this.user = data_user;
	}
	
	async setEmail (data_email) {
		this.email = data_email;
	}

	async getUser() {
		return this.user;
	}

	async getEmail() {
		return this.email;
	}
	
	async getPic(){ //new
		return this.pro_pic;
	}

	async getNav() {
		const navHTML = `
			<a href="/local" name="local" class="dashboard-nav" data-link>Local Game</a>
			<a href="/online" name="online" class="dashboard-nav" data-link>Online Game</a>
			<a href="/ranking" name="ranking" class="dashboard-nav" data-link>Ranking</a>
			<a href="/friends" name="friends" class="dashboard-nav" data-link>Friends</a>
			<a href="/chat" name="chat" class="dashboard-nav" data-link>Chat</a>
			<a href="/dashboard" name="dashboard" class="profile-pic dashboard-nav" data-link><img alt="Profile picture" src="${await this.getPic()}"/></a>
		`;
		return navHTML;
	}

	userSettings() {
		const dashboardElement = document.querySelector(".dashboard");
		const settingsElement = document.createElement("div");
		settingsElement.className = "settings";
		dashboardElement.appendChild(settingsElement);
		const settingsHTML = `
				<h1>Settings</h1>
		`;
		settingsElement.innerHTML = settingsHTML;
	}

	async getContent() {
		let dashboardHTML = `
			<div class="dashboard">
				<div class="profile-card">
					<img alt="Profile picture" src="${await this.getPic()}"/>
					<h3>${await this.getUser()}</h3>
					<button type="button" class="submit-btn	dashboard-btn"><ion-icon name="bar-chart-outline"></ion-icon>History</button>
					<button type="button" id="requests-btn" class="submit-btn dashboard-btn"><ion-icon name="notifications-outline"></ion-icon>Requests</button>
					<button type="button" id="settings-btn" class="submit-btn dashboard-btn"><ion-icon name="settings-outline"></ion-icon>Settings</button>
					<div class="hr" style="width: 75%; margin: 15px 0 20px 0;"></div>
					<button type="button" id="logout-btn" class="submit-btn red-btn"><ion-icon name="exit-outline"></ion-icon>Logout</button>
				</div>
				<div class="requests"></div>
			</div>
		`;
		// dashboardHTML += await this.room.getContent();
		return dashboardHTML;
	}
}

//OLD NAV
/* <ul>
	<li id="user">
	<img src="${await this.getPic()}"></img>
	${await this.getUser()}</li>
	<li><a id="logout">Logout</a></li>
</ul> */

//OLD SECOND NAV
/*
<div id="nav-bar">
	<input id="nav-toggle" type="checkbox"/>
	<div id="nav-header"><p id="nav-title">LOGO</p>
	  <label for="nav-toggle"><span id="nav-toggle-burger"></span></label>
	  <hr/>
	</div>
	<div id="nav-content">
	  <div class="nav-button" id="rooms"><i class="icon">&#128187;</i><span>Rooms</span></div>
	  <div class="nav-button" id="friends"><i class="icon">&#128378;</i><span>Friends</span></div>
	  <div id="nav-content-highlight"></div>
	</div>
	<input id="nav-footer-toggle" type="checkbox"/>
	<div id="nav-footer">
	  <div id="nav-footer-heading">
		<div id="nav-footer-avatar"><img alt="Profile picture" src="${await this.getPic()}"/></div>
		<div id="nav-footer-titlebox"><p id="nav-footer-title">${await this.getUser()}</p><span id="nav-footer-subtitle">Noob</span></div>
		<label for="nav-footer-toggle"><span class="icon">^</span></label>
	  </div>
	  <div id="nav-footer-content">
	  	<a id="logout">Logout</a>
	  </div>
	</div>
</div>
*/