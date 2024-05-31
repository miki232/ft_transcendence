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
	constructor(user) {
	    super();
		this.user = user;
		this.initialize();
	}

	async initialize() {
		this.content = document.querySelector("#content");
		this.nav = document.querySelector("nav");
		this.nav.innerHTML = this.getNav();
		this.content.innerHTML = this.getContent();
		const historyElement = document.querySelector('.history');
		const data = await getHistoryList(this.user.getUser());
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
			if (match.user1__username === this.user.getUser()) {
				var opponent = await this.getUserInfo(match.user2__username);
				var user1 = {
					username: this.user.getUser(),
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
					username: this.user.getUser(),
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
			const opponent = {
				username: data.user.username,
				pro_pic: data.user.pro_pic
			};
			return opponent;
		} catch (error) {
			console.error('Error:', error);
		}
	}

	getNav() {
		const navHTML = `
			<a href="/local_game" name="local" class="dashboard-nav" data-link>Local Game</a>
			<a href="/online" name="online" class="dashboard-nav" data-link>Online Game</a>
			<a href="/ranking" name="ranking" class="dashboard-nav" data-link>Ranking</a>
			<a href="/friends" name="friends" class="dashboard-nav" data-link>Friends</a>
			<a href="/chat" name="chat" class="dashboard-nav" data-link>Chat</a>
			<a href="/dashboard" name="dashboard" class="profile-pic dashboard-nav" data-link><img alt="Profile picture" src="${this.user.pro_pic}"/></a>
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