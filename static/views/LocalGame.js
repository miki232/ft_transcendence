import AbstractView from "./AbstractView.js";
import { navigateTo } from "../index.js";
import Room from "./Room.js";
import { createNotification } from "./Notifications.js";
import LocalPong from "./Localpong.js";
import PongCpu from "./PongCpu.js";

export default class LocalGame extends AbstractView {
	constructor(user) {
		super();
		this.user = user;
		this.content = document.querySelector("#content");
		this.nav = document.querySelector("header");
		this.nav.innerHTML = this.getNav();
		this.content.innerHTML = this.getContent();
		this.activeBtn();
		this.user.expProgress();
		this.ws_local = null;
		this.opponent = null;
		this.room = null;
		this.isStartLocal = true;
		this.getRoom();
	}
	
	async getWebSocket() {
		return this.ws_local;
	}

	getUser() {
		return this.user;
	}

	getOpponent() {
		return this.opponent;
	}

	async closeWebSocket() {
        if (this.ws_local) {
            //FAcciamo che una volta assegnato l'utente sfidante e la room, c'è un conto alla rovescia, e finchè
            // non finisce, stiamo connessi alla socket e se uno dei 2 esce prima dello scadere del conto alla rovescia
            // chiude la connesione e maagari elimina la room o elimina il suo username dal campo della room 
            this.ws_local.close();
            console.log("DISCONNECTED FROM WEBSOCKET PONG");
        }
    }

	async getRoom() {
		if (this.room == null){

			await fetch('/room_namelocal/', {
				method: 'GET'
			})
				.then(response => response.json())
				.then(data => {
					console.log(data);
					this.room = (data.roomname);
				})
				.catch((error) => {
					console.error('Error:', error);
				})
				return this.room;
			}
		return this.room
	}

	activeBtn() {
		const two_playerBtn = document.getElementById("vs-player");
		const cpu_playerBtn = document.getElementById("vs-cpu");
		two_playerBtn.addEventListener("click", e => {
			this.isStartLocal = false;
			this.ws_local = new WebSocket('wss://'
			        + window.location.hostname
			        + ':8000'
			        + '/ws/local/'
			        + this.room
			        + '/');
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
				<button type="button" id="play-local" class="submit-btn confirm-btn"><ion-icon name="game-controller-outline"></ion-icon>Play</button>
				<button type="button" class="submit-btn red-btn"><ion-icon name="close-outline"></ion-icon>Cancel</button>
			</div>
			`;
			two_playerBtn.insertAdjacentHTML("afterend", two_playerHTML);
			const cancelBtn = document.querySelector(".red-btn");
			cancelBtn.addEventListener("click", e => {
				e.preventDefault();
				this.isStartLocal = true;
				const change_all = document.querySelectorAll(".change");
				change_all.forEach(e => {
					e.remove();
				});
				two_playerBtn.classList.remove("local-game-btn");
				two_playerBtn.classList.add("submit-btn");
				cpu_playerBtn.style.display = "block";
				two_playerBtn.removeAttribute("disabled");
			})
			const playBtn = document.querySelector(".confirm-btn");
			playBtn.addEventListener("click", e => {
				e.preventDefault();
				const input = this.sanitizeInput(document.querySelector(".input-box input").value);
				if (input === "") {
					createNotification("Please enter a username", "error");
					return;
				}
				this.opponent = input;
				this.ws_local.send(JSON.stringify({
					"Handling": "lobby",
					"username": this.user.getUser(),
					"opponent": this.opponent,
					"status": "not_ready",
				}));

			})
			this.ws_local.onmessage = async (e) => {
				const data = JSON.parse(e.data);
				console.log(data);
				if (data["status"] === 0) {
					history.replaceState(null, null, "/1P-vs-2P");
					this.user.lastURL = "/1P-vs-2P";
					const view = new LocalPong(this.user, data["opponent"], this.room, this.ws_local);
					this.content.innerHTML = await view.getContent();
					await view.loop();
					// navigateTo("/game");
				} 
			}
		})
		cpu_playerBtn.addEventListener("click", e => {
			e.preventDefault();
			this.ws_local = new WebSocket('wss://'
			        + window.location.hostname
			        + ':8000'
			        + '/ws/local/'
			        + this.room
			        + '/');
			
			this.ws_local.onopen = () => {
				this.ws_local.send(JSON.stringify({
				"Handling": "lobby",
				"username": this.user.getUser(),
				"opponent": "AI",
				"status": "not_ready",
				}));	
			}
			this.ws_local.onmessage = async (e) => {
				const data = JSON.parse(e.data);
				console.log(data);
				if (data["status"] === 0) {
					const view = new PongCpu(this.user, "AI", this.room, this.ws_local);
					this.content.innerHTML = await view.getContent();
					await view.loop();
				}
			}
		})
		const backBtn = document.getElementById("back");
		backBtn.addEventListener("click", e => {
			e.preventDefault();
			if (this.isStartLocal) {
				navigateTo("/dashboard");
			} else {
				this.isStartLocal = true;
				navigateTo("/local_game");
			}
		});
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
		let dashboardHTML = `
			<div class="dashboard">
				<div class="local-game">
					<h1 data-translate="local">Local Game</h1>
					<div class="user-dashboard">
						<img alt="Profile picture" src="${this.user.getPic()}"/>
						<div class="user-info">
							<h3>${this.user.getUser()}</h3>
							<h5 data-translate="level">Level ${this.user.getLevel()}</h5>
							<div class="exp-bar"><div class="progress-bar"></div></div>
						</div>
					</div>
					<div class="btns-container">
						<div class="hr" style="width: 80%; margin-bottom: 25px;"></div>
						<button type="button" class="submit-btn dashboard-btn" id="vs-cpu"><ion-icon name="desktop-outline"></ion-icon>1P vs CPU</button>
						<button type="button" class="submit-btn dashboard-btn" id="vs-player"><ion-icon name="people-outline"></ion-icon>1P vs 2P</button>
					</div>
					<div class="back-btn-container">
						<div class="hr" style="width: 80%; margin-bottom: 15px;"></div>
						<button type="button" data-translate="back" class="submit-btn dashboard-btn" id="back"><ion-icon name="chevron-back-outline"></ion-icon>Back</button>
					</div>
				</div>
			</div>
		`;
		return dashboardHTML;
	}
}
