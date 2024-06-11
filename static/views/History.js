import AbstractView from "./AbstractView.js";
import { getCSRFToken } from "./Info.js";
import { createNotification } from "./Notifications.js";
import { navigateTo } from "../index.js";

export async function getHistoryList(user) {
	const response = await fetch('/accounts/match_history/?username=' + user)
	const data = await response.json();
	return data;
}

export default class History extends AbstractView {
	constructor(user, userObj) {
	    super();
		this.user = user;
		this.userObj = userObj;
		this.initialize();
	}

	async initialize() {
		let type = typeof this.user;
		if (type === "string")
			this.user = await this.getUserInfo(this.user);
		this.content = document.querySelector("#content");
		this.nav = document.querySelector("header");
		this.nav.innerHTML = this.getNav();
		this.content.innerHTML = this.getContent();
		const historyElement = document.querySelector('.history');
		const data = await getHistoryList(this.user.username);
		data[0].match_history.length === 0 ? this.noHistory(historyElement) : await this.historyList(data, historyElement);
	}

	noHistory (historyElement) {
		const noEntries = document.createElement("span");
		noEntries.className = "no-entries";
		noEntries.textContent = "No histor match found.";
		historyElement.appendChild(noEntries);
	}

	async historyList (data, historyElement) {
		const sort_data = data[0].match_history.sort((a, b) => new Date(b.date) - new Date(a.date));
		const matchListElement = document.createElement("div");
		matchListElement.className = "match-list";
		historyElement.appendChild(matchListElement);
		for (let i = 0; i < sort_data.length; i++) {
			const match = sort_data[i];
			if (match.user1__username === this.user.username) {
				var opponent = await this.getUserInfo(match.user2__username);
				var user1 = {
					username: this.user.username,
					pro_pic: this.user.pro_pic,
					score: match.score_user1
				};
				var user2 = {
					username: opponent.username,
					pro_pic: opponent.pro_pic,
					score: match.score_user2
				};
			} else {
				var opponent = await this.getUserInfo(match.user1__username);
				var user2 = {
					username: this.user.username,
					pro_pic: this.user.pro_pic,
					score: match.score_user2
				};
				var user1 = {
					username: opponent.username,
					pro_pic: opponent.pro_pic,
					score: match.score_user1
				};
			}
			const matchHTML = `
				<div class="match-line">
					<div class="user1">
						<div class="icon">
							${match.winner__username === user1.username ? '<ion-icon name="trophy-outline"></ion-icon>' : '<ion-icon name="thumbs-down-outline"></ion-icon>'}
						</div>
						<div class="user1-info">
							<img src="${user1.pro_pic}"/>
							<p>${user1.username}</p>
							<p>${user1.score}</p>
						</div>
					</div>
					<div class="vs-text"><span>VS</span></div>
					<div class="user2">
						<div class="icon">
							${match.winner__username === user2.username ? '<ion-icon name="trophy-outline"></ion-icon>' : '<ion-icon name="thumbs-down-outline"></ion-icon>'}
						</div>
						<div class="user2-info">
							<p>${user2.score}</p>
							<p>${user2.username}</p>
							<img src="${user2.pro_pic}"/>
						</div>
					</div>
				</div>
			`;
			matchListElement.innerHTML += matchHTML;
		};
	}

	async getUserInfo(username) {
		// var csrfToken = await getCSRFToken();
		try {
			const response = await fetch('/accounts/guser_info/?username=' + username);
			const data = await response.json();
			const user = {
				username: data.user.username,
				pro_pic: data.user.pro_pic
			};
			return user;
		} catch (error) {
			console.error('Error:', error);
		}
	}

	getNav() {
		const navHTML = `
			<nav class="navbar navbar-expand-lg bg-body-tertiary">
			  <div class="container-fluid">
				<a href="/dashboard" id="logo" class="nav-link" aria-current="page" data-link>The Match</a>
				<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
					<span class="navbar-toggler-icon"><ion-icon name="menu-outline" class="toggler-icon"></ion-icon></span>
				</button>
				<div class="collapse navbar-collapse" id="navbarNavDropdown">
				  <ul class="navbar-nav">
					<li class="nav-item">
					  <a class="nav-link" href="/local_game" data-link>Local Game</a>
					</li>
					<li class="nav-item">
					  <a class="nav-link" href="/online" data-link>Online Game</a>
					</li>
					<li class="nav-item">
					  <a class="nav-link" href="/ranking" data-link>Ranking</a>
					</li>
					<li class="nav-item">
					  <a class="nav-link" href="/friends" data-link>Friends</a>
					</li>
					<li class="nav-item">
					  <a class="nav-link" href="/chat" data-link>Chat</a>
					</li>
					<li class="nav-item dropdown">
					  <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
						Language
					  </a>
					  <ul class="dropdown-menu select-menu">
						<li class="dropdown-item lang-selector" value="en">English</li>
						<li class="dropdown-item lang-selector" value="fr">Français</li>
						<li class="dropdown-item lang-selector" value="it">Italiano</li>
					  </ul>
					</li>
				  </ul>
				</div>
			  </div>
			</nav>
		`;
		return navHTML;
	}

	getContent() {
		const historyHTML = `
			<div class="dashboard">
				<div class="history">
					<h2>Match History</h2>
				</div>
			</div>
		`;
		return historyHTML;
	}
}