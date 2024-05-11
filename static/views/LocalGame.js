import AbstractView from "./AbstractView.js";
import { navigateTo } from "../index.js";
import Room from "./Room.js";
import { createNotification } from "./Notifications.js";

export default class LocalGame extends AbstractView {
	constructor(user) {
		super();
		this.user = user;
		this.content = document.querySelector("#content");
		this.nav = document.querySelector("nav");
		this.nav.innerHTML = this.getNav();
		this.content.innerHTML = this.getContent();
		this.activeBtn();
		this.user.expProgress();
	}

	activeBtn() {
		const two_playerBtn = document.getElementById("vs-player");
		const cpu_playerBtn = document.getElementById("vs-cpu");
		two_playerBtn.addEventListener("click", e => {
			e.preventDefault();
			cpu_playerBtn.style.display = "none";
			two_playerBtn.setAttribute("disabled", "true");
			two_playerBtn.classList.remove("submit-btn");
			two_playerBtn.classList.add("local-game-btn");
			const two_playerHTML = `
				<div class="input-box change">
					<input type="text" placeholder="2P Username">
					<ion-icon name="person-outline"></ion-icon>
				</div>
				<div class="change-btn change">
				<button type="button" class="submit-btn confirm-btn"><ion-icon name="game-controller-outline"></ion-icon>Play</button>
				<button type="button" class="submit-btn red-btn"><ion-icon name="close-outline"></ion-icon>Cancel</button>
			</div>
			`;
			two_playerBtn.insertAdjacentHTML("afterend", two_playerHTML);
			const cancelBtn = document.querySelector(".red-btn");
			cancelBtn.addEventListener("click", e => {
				e.preventDefault();
				const change_all = document.querySelectorAll(".change");
				change_all.forEach(e => {
					e.remove();
				});
				two_playerBtn.classList.remove("local-game-btn");
				two_playerBtn.classList.add("submit-btn");
				cpu_playerBtn.style.display = "block";
				two_playerBtn.removeAttribute("disabled");
			})
		})
	}

	getNav() {
		const navHTML = `
			<a href="/local_game" name="local" class="dashboard-nav" data-link>Local Game</a>
			<a href="/online" name="online" class="dashboard-nav" data-link>Online Game</a>
			<a href="/ranking" name="ranking" class="dashboard-nav" data-link>Ranking</a>
			<a href="/friends" name="friends" class="dashboard-nav" data-link>Friends</a>
			<a href="/chat" name="chat" class="dashboard-nav" data-link>Chat</a>
			<a href="/dashboard" name="dashboard" class="profile-pic dashboard-nav" data-link><img alt="Profile picture" src="${this.user.getPic()}"/></a>
		`;
		return navHTML;
	}

	getContent() {
		let dashboardHTML = `
			<div class="dashboard">
				<div class="local-game">
					<h1>Local Game</h1>
					<div class="user-dashboard">
						<img alt="Profile picture" src="${this.user.getPic()}"/>
						<div class="user-info">
							<h3>${this.user.getUser()}</h3>
							<h5>Level ${this.user.getLevel()}</h5>
							<div class="exp-bar"><div class="progress-bar"></div></div>
						</div>
					</div>
					<button type="button" class="submit-btn dashboard-btn" id="vs-cpu"><ion-icon name="desktop-outline"></ion-icon>1P vs CPU</button>
					<button type="button" class="submit-btn dashboard-btn" id="vs-player"><ion-icon name="people-outline"></ion-icon>1P vs 2P</button>
				</div>
			</div>
		`;
		return dashboardHTML;
	}
}
