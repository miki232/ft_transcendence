import AbstractView from "./AbstractView.js";
import { getCSRFToken } from "./Info.js";
import { createNotification } from "./Notifications.js";
import { changeLanguage, navigateTo } from "../index.js";

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
		this.lang = localStorage.getItem('language');
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
		await this.createBarChart(this.user.username);
		console.log(chart)
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
		const noEntries = document.createElement("p");
		noEntries.className = "no-entries";
		noEntries.textContent = "No history found.";
		noEntries.setAttribute("data-translate", "noHistory");
		listElement.appendChild(noEntries);
		listElement.style.textAlign = "center";
		changeLanguage(this.lang);
	}

	matchListPadding (element) {
		if (element.scrollHeight > element.clientHeight) {
			element.style.paddingRight = "10px";
		} else {
			element.style.paddingRight = "0px";
		}
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
				const date = tournament.timestamp.split("T")[0].split("-").reverse().join("-");
				const time = tournament.timestamp.split("T")[1].split(".")[0];
				const tournamentHTML = `
					<div class="tournament-line dropdown">
						<div class="tournament-drop dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false"><ion-icon name="trophy-outline"></ion-icon><span>${tournament.name}</span><div class="date"><span>${date}</span><span>${time}</span></div><span>Winner: ${tournament.winner}</span></div>
						<div id="t-matches" class="num${i} tournament-matches dropdown-menu" style="position: relative; tranform: translate(0px, 0px);"></div>
					</div>
				`;
				matchListElement.innerHTML += tournamentHTML;
				for (let j = 0; j < tournament.matches.length; j++) {
					const tournamentMatchesEl = document.querySelector(".num" + i);
					const matchHTML = `
						<div class="match-line dropdown-item">
							<div class="user1">
								<div class="icon">
									${tournament.matches[j].winner === tournament.matches[j].user1 ? '<ion-icon name="trophy-outline"></ion-icon>' : '<ion-icon name="thumbs-down-outline"></ion-icon>'}
								</div>
								<div class="user1-info">
									<p>${tournament.matches[j].user1}</p>
									<p>${tournament.matches[j].score_user1}</p>
								</div>
							</div>
							<div class="vs-text"><span>VS</span></div>
							<div class="user2">
								<div class="icon">
									${tournament.matches[j].winner === tournament.matches[j].user2 ? '<ion-icon name="trophy-outline"></ion-icon>' : '<ion-icon name="thumbs-down-outline"></ion-icon>'}
								</div>
								<div class="user2-info">
									<p>${tournament.matches[j].score_user2}</p>
									<p>${tournament.matches[j].user2}</p>
								</div>
							</div>
						</div>
					`;
					tournamentMatchesEl.innerHTML += matchHTML;
				}
			};
		}
		this.matchListPadding(matchListElement);
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
				const date = match.date.split("T")[0].split("-").reverse().join("-");
				const time = match.date.split("T")[1].split(".")[0];
				console.log(match);
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
					<div class="date">${date} ${time}</div>
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
		this.matchListPadding(matchListElement);
	}

	async getUserInfo(username) {
		// var csrfToken = await getCSRFToken();
		try {
			const response = await fetch('/accounts/guser_info/?username=' + username);
			const data = await response.json();
			const user = {
				username: data.user.username,
				pro_pic: data.user.pro_pic,
			};
			return user;
		} catch (error) {
			console.error('Error:', error);
		}
	}

	async createBarChart(username) {
		// Calculate the total games played
		let wins, losses = null;
		try {
			const response = await fetch('/accounts/guser_info/?username=' + username);
			const data = await response.json();
			wins = data.user.wins;
			losses = data.user.losses;
		} catch (error) {
			console.error('Error:', error);
		}
		const total = wins + losses;
	
		// Calculate the percentage of wins and losses
		const winPercentage = (wins / total) * 100;
		const lossPercentage = (losses / total) * 100;
	
		// Create the bar chart
		const chartHTML = `
			<div class="chart">
				<div class="bar win">Wins: ${wins}</div>
				<div class="bar loss">Losses: ${losses}</div>
			</div>
		`;
	
		// Add the chart to the btn-container
		document.getElementById('chart').innerHTML = chartHTML;
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
		const historyHTML = `
			<div class="dashboard">
				<div class="history">
				<h2 data-translate="history">Match History</h2>
				<div id="chart"></div> <!-- Placeholder for the chart -->
					<div class="btns-container">
						<div class="hr" style="width: 80%; margin-bottom: 25px;"></div>
						<button type="button" class="submit-btn dashboard-btn" data-translate="tournaments" id="tournament-list"><ion-icon name="trophy-outline"></ion-icon>Tournaments</button>
						<button type="button" class="submit-btn dashboard-btn" data-translate="matches"id="match-list"><ion-icon name="globe-outline"></ion-icon>Matches</button>
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