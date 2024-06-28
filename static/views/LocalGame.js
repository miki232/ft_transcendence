import AbstractView from "./AbstractView.js";
import { changeLanguage, navigateTo } from "../index.js";
import Room from "./Room.js";
import { createNotification } from "./Notifications.js";
import LocalPong from "./Localpong.js";
import PongCpu from "./PongCpu.js";

export default class LocalGame extends AbstractView {
	constructor(user) {
		super();
		this.lang;
		this.user = user;
		this.content = document.querySelector("#content");
		this.nav = document.querySelector("header");
		this.nav.innerHTML = this.getNav();
		this.content.innerHTML = this.getContent();
		this.lang = localStorage.getItem('language') || 'en';
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
		this.lang = localStorage.getItem('language') || 'en';
		const tournamentBtn = document.getElementById("l-tournament");
		const two_playerBtn = document.getElementById("vs-player");
		const cpu_playerBtn = document.getElementById("vs-cpu");
		const localtournament = document.getElementById("l-tournament");
		tournamentBtn.addEventListener("click", e => {
				e.preventDefault();
				this.isStartLocal = false;
				cpu_playerBtn.style.display = "none";
				two_playerBtn.style.display = "none";
				tournamentBtn.setAttribute("disabled", "true");
				tournamentBtn.classList.remove("submit-btn");
				tournamentBtn.classList.add("local-game-btn");
				const tournamentHTML = `
					<div class="input-box change" style="margin: 10px 0px;">
						<input type="text" data-translate="first" placeholder="1P Username">
						<ion-icon name="person-outline"></ion-icon>
					</div>
					<div class="input-box change" style="margin: 10px 0px";>
						<input type="text" data-translate="second" placeholder="2P Username">
						<ion-icon name="person-outline"></ion-icon>
					</div>
					<div class="input-box change" style="margin: 10px 0px;">
						<input type="text" data-translate="third" placeholder="3P Username">
						<ion-icon name="person-outline"></ion-icon>
					</div>
					<div class="input-box change" style="margin: 10px 0px;">
						<input type="text" data-translate="fourth" placeholder="4P Username">
						<ion-icon name="person-outline"></ion-icon>
					</div>
					<div class="change-btn change">
						<button type="button" id="play-local" data-translate="play" class="submit-btn confirm-btn" style="width: 100%;"><ion-icon name="game-controller-outline"></ion-icon>Create Tournament</button>
					</div>
				`;
				tournamentBtn.insertAdjacentHTML("afterend", tournamentHTML);
				const playbtn = document.querySelector(".confirm-btn");
				playbtn.addEventListener("click", async e => {
					e.preventDefault();
					const input1 = document.querySelectorAll(".input-box input")[0].value;
					const input2 = document.querySelectorAll(".input-box input")[1].value;
					const input3 = document.querySelectorAll(".input-box input")[2].value;
					const input4 = document.querySelectorAll(".input-box input")[3].value;
					let data = {
						"user1" : input1,
						"user2" : input2,
						"user3" : input3,
						"user4" : input4
					};
					const response = await fetch('/createlocal_tournament/', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'X-CSRFToken': await this.getCSRFToken(),
						},
						body: JSON.stringify(data),
					});
				
					if (response.ok) {
						const data = await response.json();
						console.log(data);
						this.user.tournament_local_room.pk_tournament = data.pk;
						console.log(this.user.tournament_local_room.pk_tournament);
						navigateTo("/local_game/tournament");
					} else {
						console.error('Error:', response.statusText);
					}
					
				});
				changeLanguage(this.lang);
				
			});
		two_playerBtn.addEventListener("click", e => {
			this.isStartLocal = false;
			try {
				this.ws_local.close();
			} catch (error) {
			}
			this.ws_local = new WebSocket('wss://'
			        + window.location.hostname
			        + ':8000'
			        + '/ws/local/'
			        + this.room
			        + '/');
			e.preventDefault();
			cpu_playerBtn.style.display = "none";
			tournamentBtn.style.display = "none";
			two_playerBtn.setAttribute("disabled", "true");
			two_playerBtn.classList.remove("submit-btn");
			two_playerBtn.classList.add("local-game-btn");
			const two_playerHTML = `
				<div class="input-box change">
					<input type="text" data-translate="secondpusername" placeholder="2P Username">
					<ion-icon name="person-outline"></ion-icon>
				</div>
				<div class="change-btn change">
				<button type="button" id="play-local" data-translate="play" class="submit-btn confirm-btn"><ion-icon name="game-controller-outline"></ion-icon>Play</button>
				<button type="button" class="submit-btn red-btn"><ion-icon name="close-outline"></ion-icon>Cancel</button>
			</div>
			`;
			two_playerBtn.insertAdjacentHTML("afterend", two_playerHTML);
			changeLanguage(this.lang);
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
				tournamentBtn.style.display = "block";
				two_playerBtn.removeAttribute("disabled");
			})
			const playBtn = document.querySelector(".confirm-btn");
			playBtn.addEventListener("click", async e => {
				e.preventDefault();
				const input = await this.sanitizeInput(document.querySelector(".input-box input").value); // Create a function to sanitize input BACKEND	
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
					this.user.setLocalGame(data["opponent"], this.room, this.ws_local);
					await navigateTo("/local_game/1P-vs-2P/" + this.room);
					// history.replaceState(null, null, "/local_game");
					// this.user.lastURL = "/1P-vs-2P";
					// const view = new LocalPong(this.user, data["opponent"], this.room, this.ws_local);
					// this.content.innerHTML = await view.getContent();
					// changeLanguage(this.lang);
					// await view.loop();
					// navigateTo("/game");
				} 
			}
		})
		cpu_playerBtn.addEventListener("click", e => {
			e.preventDefault();
			try {
				this.ws_local.close();
			} catch (error) {
			}
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
					this.user.setLocalGame("AI", this.room, this.ws_local);
					await navigateTo("/local_game/1P-vs-CPU/" + this.room);
					// history.replaceState(null, null, "/local_game");
					// this.user.lastURL = "/1P-vs-CPU";
					// const view = new PongCpu(this.user, "AI", this.room, this.ws_local);
					// this.content.innerHTML = await view.getContent();
					// changeLanguage(this.lang);
					// await view.loop();
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
						<button type="button" class="submit-btn dashboard-btn" data-translate="localtournament" id="l-tournament"><ion-icon name="trophy-outline"></ion-icon>Local Tournament</button>
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
