import AbstractView from "./AbstractView.js";
import { getCSRFToken } from "./Info.js";
import { createNotification } from "./Notifications.js";
import { navigateTo } from "../index.js";

export async function getHistoryList(user) {
	const response = await fetch('/accounts/match_history/?username=' + user)
	const data = await response.json();
	return data;
}

export async function getTournamentHistory(user) {
	const response = await fetch('/user_tournament/?username=' + user)
	const data = await response.json();
	return data;
}

export default class History extends AbstractView {
	constructor(user, userObj) {
	    super();
		this.user = user;
		this.userObj = userObj;
		this.isStartHistory = true;
		this.isFriend = false;
		this.initialize();
	}

	async initialize() {
		let type = typeof this.user;
		if (type === "string") {
			this.user = await this.getUserInfo(this.user);
			this.isFriend = true;
		}
		const content = document.querySelector("#content");
		const nav = document.querySelector("header");
		nav.innerHTML = this.getNav();
		content.innerHTML = this.getContent();
		const data = await getHistoryList(this.user.username);
		const dataTournament = await getTournamentHistory(this.user.username);
		console.log(dataTournament);
		this.activeBtns(data, dataTournament);
	}

	activeBtns (data, dataTournament) {
		const tournamentListBtn = document.getElementById("tournament-list");
		tournamentListBtn.addEventListener("click", e => {
			e.preventDefault();
			this.isStartHistory = false;
			this.tournamentList(dataTournament);
		});
		const matchListBtn = document.getElementById("match-list");
		matchListBtn.addEventListener("click", e => {
			e.preventDefault();
			this.isStartHistory = false;
			this.historyList(data);
		});
		const backBtn = document.getElementById("back");
		backBtn.addEventListener("click", e => {
			e.preventDefault();
			if (this.isStartHistory) {
				if (this.isFriend === false)
					navigateTo("/dashboard");
				else
					navigateTo("/friends/user_info_" + this.user.username)
			} else {
				if (this.isFriend === false)
					navigateTo("/dashboard/history");
				else
					navigateTo("/friends/user_info_" + this.user.username + "/history")
					this.isStartHistory = true;
			}
		});
	}

	noHistory (listElement) {
		const noEntries = document.createElement("span");
		noEntries.className = "no-entries";
		noEntries.textContent = "No history found.";
		listElement.appendChild(noEntries);
	}

	async tournamentList (data) {
		const matchBtn = document.getElementById("match-list");
		matchBtn.style.display = "none";
		const tournamentBtn = document.getElementById("tournament-list");
		tournamentBtn.setAttribute("disabled", "true");
		const matchListElement = document.createElement("div");
		matchListElement.className = "match-list";
		const btnsContainer = document.querySelector(".btns-container");
		btnsContainer.appendChild(matchListElement);
		if (data.length === 0) {
			this.noHistory(matchListElement);
		} else {
			for (let i = 0; i < data.length; i++) {
				const tournament = data[i];
				const tournamentHTML = `
					<div class="tournament-line">
						<p>${tournament.name}</p>
					</div>
				`;
				matchListElement.innerHTML += tournamentHTML;
			};
		}
	}

	async historyList (data) {
		const tournamentBtn = document.getElementById("tournament-list");
		tournamentBtn.style.display = "none";
		const matchBtn = document.getElementById("match-list");
		matchBtn.setAttribute("disabled", "true");
		const matchListElement = document.createElement("div");
		matchListElement.className = "match-list";
		const btnsContainer = document.querySelector(".btns-container");
		btnsContainer.appendChild(matchListElement);
		if (data[0].match_history.length === 0) {
			this.noHistory(matchListElement);
		} else {
			const sort_data = data[0].match_history.sort((a, b) => new Date(b.date) - new Date(a.date));
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

	getContent() {
		const historyHTML = `
			<div class="dashboard">
				<div class="history">
					<h2>Match History</h2>
					<div class="btns-container">
						<div class="hr" style="width: 80%; margin-bottom: 25px;"></div>
						<button type="button" class="submit-btn dashboard-btn" id="tournament-list"><ion-icon name="trophy-outline"></ion-icon>Tournament List</button>
						<button type="button" class="submit-btn dashboard-btn" id="match-list"><ion-icon name="globe-outline"></ion-icon>Match List</button>
					</div>
					<div class="back-btn-container">
						<div class="hr" style="width: 80%; margin-bottom: 15px;"></div>
						<button type="button" data-translate="back" class="submit-btn dashboard-btn" id="back"><ion-icon name="chevron-back-outline"></ion-icon>Back</button>
					</div>
				</div>
			</div>
		`;
		return historyHTML;
	}
}