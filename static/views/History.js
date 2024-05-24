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
		console.log(data[0].match_history[102]);
		data[0].match_history.length === 0 ? this.noHistory(historyElement) : await this.hisoryList(data, historyElement);
	}

	noHistory (historyElement) {
		const noEntries = document.createElement("span");
		noEntries.className = "no-entries";
		noEntries.textContent = "No histor match found.";
		historyElement.appendChild(noEntries);
	}

	async hisoryList (data, historyElement) {
		const sort_data = data[0].match_history.sort((a, b) => new Date(b.date) - new Date(a.date));
		console.log(sort_data);
		var opponent;
		const matchListElement = document.createElement("div");
		matchListElement.className = "match-list";
		historyElement.appendChild(matchListElement);
		for (let i = 0; i < sort_data.length; i++) {
			const match = sort_data[i];
			match.user1__username === this.user.getUser() ? opponent = await this.getUserInfo(match.user2__username) : opponent = await this.getUserInfo(match.user1__username);
			const matchHTML = `
				<div class="match-line">



			`;
		};
	}

	async getUserInfo(username) {
		const opponent = {
			username: "null",
			pro_pic: "null"
		};
		const response = await fetch('/accounts/user_info/?username=' + username);
		const data = await response.json();
		opponent.username = data.username;
		opponent.pro_pic = data.pro_pic;
		return opponent;
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
		const requestHTML = `
			<div class="dashboard">
				<div class="history">
					<h2>Match History</h2>
				</div>
			</div>
		`;
		return requestHTML;
	}
}