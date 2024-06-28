import AbstractView from "./AbstractView.js";
import { navigateTo } from "../index.js";
import Room from "./Room.js";
import { createNotification } from "./Notifications.js";

export default class extends AbstractView {
	constructor(user) {
		super();
		this.user = user;
		this.initialize();
		// this.isValid = false;
		// this.user;
		// this.email;
		// this.room = new Room();
		// this.pro_pic;
		// this.validateLogin();
		// this.setTitle("Dashboard");
	}

	initialize() {
		this.content = document.querySelector("#content");
		this.nav = document.querySelector("header");
		this.nav.innerHTML = this.getNav();
		this.content.innerHTML = this.getContent();
		this.user.expProgress();
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

	// async validateLogin() {
	// 	try{
	// 		var username = this.sanitizeInput(document.getElementById('login-user').value);
	// 		var password = this.sanitizeInput(document.getElementById('login-pass').value);
	// 	} catch (error){
	// 		console.error(error);
	// 		return;
	// 	}
	// 	var csrftoken = this.getCookie('csrftoken');

	// 	await fetch('accounts/login/', {
	// 		method: 'POST',
	// 		headers: {
	// 			'Content-Type' : 'application/json',
	// 			'X-CSRFToken': csrftoken
	// 		},
	// 		body: JSON.stringify({
	// 			username: username,
	// 			password: password,
	// 		}),
	// 	}).then(response => {
	// 		response.json();
	// 		console.log(response);
	// 		response.status === 200 ? this.user.isLogged() : createNotification("Wrong username or password");
	// 		// if (response.status === 200) {
	// 		// 	this.isValid = true;
	// 		// } else {
	// 		// 	alert('Wrong username or password');
	// 		// }
	// 		})
	// 		.then(data => console.log(data))
	// 		.catch((error) => {
	// 			console.error('Error: ', error);
	// 	})
	// }

	// async setPic(data_pic){ //new
	// 	this.pro_pic = data_pic;
	// }

	// async setUser(data_user) {
	// 	this.user = data_user;
	// }
	
	// async setEmail (data_email) {
	// 	this.email = data_email;
	// }

	// async getUser() {
	// 	return this.user;
	// }

	// async getEmail() {
	// 	return this.email;
	// }
	
	// async getPic(){ //new
	// 	return this.pro_pic;
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

	getContent() {
		const dashboardHTML = `
		<div class="dashboard">
			<div class="profile-card">
				<h1>Dashboard</h1>
				<div class="user-dashboard">
					<img alt="Profile picture" src="${this.user.getPic()}"/>
					<div class="user-info">
						<h3>${this.user.getUser()}</h3>
						<h5 data-translate="level">Level${this.user.getLevel()}</h5>
						<div class="exp-bar"><div class="progress-bar"></div></div>
					</div>
				</div>
				<div class="btns-container">
					<div class="hr" style="width: 80%; margin-bottom: 25px;"></div>
						<a href="/dashboard/history" data-translate="history" id="history-btn" class="submit-btn dashboard-btn" data-link><ion-icon name="bar-chart-outline" ></ion-icon>History</a>
						<a href="/dashboard/requests" data-translate="requests" id="requests-btn" class="submit-btn dashboard-btn" data-link><ion-icon name="notifications-outline"></ion-icon>Requests</a>
						<a href="/dashboard/settings" data-translate="settings" id="settings-btn" class="submit-btn" data-link><ion-icon name="settings-outline"></ion-icon>Settings</a>
					</div>
					<div class="back-btn-container">
						<div class="hr" style="width: 80%; margin-bottom: 20px;"></div>
						<button type="button" data-translate="logout" id="logout-btn" class="submit-btn red-btn"><ion-icon name="exit-outline"></ion-icon>Logout</button>
					</div>
				</div>
			</div>
		</div>
		`;
		// dashboardHTML += await this.room.getContent();
		return dashboardHTML;
	}
}

//<button type="button" id="requests-btn" class="submit-btn dashboard-btn"><ion-icon name="notifications-outline"></ion-icon>Requests</button>

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