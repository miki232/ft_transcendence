import AbstractView from "./AbstractView.js";
import { navigateTo } from "../index.js";
import Room from "./Room.js";
import { createNotification } from "./Notifications.js";
import LocalPong from "./Localpong.js";
import PongCpu from "./PongCpu.js";

export default class Online extends AbstractView {
	constructor(user) {
		super();
		this.user = user;
        this.player = 0
		this.ws_local = null;
		this.opponent = null;
		this.room = null;
        this.tournament = null;
		this.initialize();
		// this.getRoom();
	}

	initialize() {
		this.content = document.querySelector("#content");
		this.nav = document.querySelector("header");
		this.nav.innerHTML = this.getNav();
		this.content.innerHTML = this.getContent();
		this.activeBtn();
		this.user.expProgress();
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


    async getTournament() {
        const response = await fetch('/tournament/');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        this.tournament = await response.json();
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

    async getPlayers() {
        return this.player;
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

	async activeBtn() {
        await this.getTournament();
		const matchmakingBtn = document.getElementById("o-match");
		const tournamentBtn = document.getElementById("o-tournament");
		const friendlyBtn = document.getElementById("f-match");
		friendlyBtn.addEventListener("click", e => {
			e.preventDefault();
			console.log("Friendly Match");
			navigateTo("/friendly_match");
		})
        matchmakingBtn.addEventListener("click", e => {
            e.preventDefault();
            console.log("1 vs 1");
            navigateTo("/online/matchmaking");
        })
        if (this.tournament.status == true) {
            this.user.matchmaking_ws = new WebSocket(
                'wss://'
                + window.location.hostname
                + ':8000'
                + '/ws/matchmaking/'
                );
			
            this.user.matchmaking_ws.onopen = () => {
                this.user.matchmaking_ws.send(JSON.stringify({
                    "action": "torunametInfo",
                    "username": this.user.getUser(),
                    "status": "not_ready",
                }));
            }            
            this.user.matchmaking_ws.onmessage = async (e) => {
                if (window.location.pathname === "/online"){
                    const data = JSON.parse(e.data);
                    console.log(data);
                    if (data["status"] === "Waiting for players") {
                        this.player = await data["numberofplayers_reached"];
                        console.log(this.player);
                        const tournamentCounter = document.getElementById("tournamentCounter");
                        tournamentCounter.textContent = `(${await this.getPlayers()}/${this.tournament.playerNumber})`;
                    }
                }
            }
        }
        else
            tournamentBtn.setAttribute("disabled", "true");
        tournamentBtn.addEventListener("click", e => {
            e.preventDefault();
            console.log("Tournament");
            if (this.tournament.status == true) {
                this.user.matchmaking_ws.send(JSON.stringify({
                    "action": "joinTournamentQueue",
                    "username": this.user.getUser(),
                    "status": "not_ready",
                }));
                navigateTo("/tournament");
            }
        })
		// two_playerBtn.addEventListener("click", e => {
		// 	this.ws_local = new WebSocket('wss://'
		// 	        + window.location.hostname
		// 	        + ':8000'
		// 	        + '/ws/local/'
		// 	        + this.room
		// 	        + '/');
		// 	e.preventDefault();
		// 	cpu_playerBtn.style.display = "none";
		// 	two_playerBtn.setAttribute("disabled", "true");
		// 	two_playerBtn.classList.remove("submit-btn");
		// 	two_playerBtn.classList.add("local-game-btn");
		// 	const two_playerHTML = `
		// 		<div class="input-box change">
		// 			<input type="text" placeholder="2P Username">
		// 			<ion-icon name="person-outline"></ion-icon>
		// 		</div>
		// 		<div class="change-btn change">
		// 		<button type="button" id="play-local" class="submit-btn confirm-btn"><ion-icon name="game-controller-outline"></ion-icon>Play</button>
		// 		<button type="button" class="submit-btn red-btn"><ion-icon name="close-outline"></ion-icon>Cancel</button>
		// 	</div>
		// 	`;
		// 	two_playerBtn.insertAdjacentHTML("afterend", two_playerHTML);
		// 	const cancelBtn = document.querySelector(".red-btn");
		// 	cancelBtn.addEventListener("click", e => {
		// 		e.preventDefault();
		// 		const change_all = document.querySelectorAll(".change");
		// 		change_all.forEach(e => {
		// 			e.remove();
		// 		});
		// 		two_playerBtn.classList.remove("local-game-btn");
		// 		two_playerBtn.classList.add("submit-btn");
		// 		cpu_playerBtn.style.display = "block";
		// 		two_playerBtn.removeAttribute("disabled");
		// 	})
		// 	const playBtn = document.querySelector(".confirm-btn");
		// 	playBtn.addEventListener("click", e => {
		// 		e.preventDefault();
		// 		const input = document.querySelector(".input-box input");
		// 		if (input.value === "") {
		// 			createNotification("Please enter a username", "error");
		// 			return;
		// 		}
		// 		this.opponent = input.value;
		// 		this.ws_local.send(JSON.stringify({
		// 			"Handling": "lobby",
		// 			"username": this.user.getUser(),
		// 			"opponent": this.opponent,
		// 			"status": "not_ready",
		// 		}));

		// 	})
		// 	this.ws_local.onmessage = async (e) => {
		// 		const data = JSON.parse(e.data);
		// 		console.log(data);
		// 		if (data["status"] === 0) {
		// 			history.replaceState(null, null, "/1P-vs-2P");
		// 			this.user.lastURL = "/1P-vs-2P";
		// 			const view = new LocalPong(this.user, data["opponent"], this.room, this.ws_local);
		// 			this.content.innerHTML = await view.getContent();
		// 			await view.loop();
		// 			// navigateTo("/game");
		// 		} 
		// 	}
		// })
		// cpu_playerBtn.addEventListener("click", e => {
		// 	e.preventDefault();
		// 	this.ws_local = new WebSocket('wss://'
		// 	        + window.location.hostname
		// 	        + ':8000'
		// 	        + '/ws/local/'
		// 	        + this.room
		// 	        + '/');
			
		// 	this.ws_local.onopen = () => {
		// 		this.ws_local.send(JSON.stringify({
		// 		"Handling": "lobby",
		// 		"username": this.user.getUser(),
		// 		"opponent": "AI",
		// 		"status": "not_ready",
		// 		}));	
		// 	}
		// 	this.ws_local.onmessage = async (e) => {
		// 		const data = JSON.parse(e.data);
		// 		console.log(data);
		// 		if (data["status"] === 0) {
		// 			const view = new PongCpu(this.user, "AI", this.room, this.ws_local);
		// 			this.content.innerHTML = await view.getContent();
		// 			await view.loop();
		// 		}
		// 	}
		// })
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
				<div class="online-game">
					<h1 data-translate="online">Online Game</h1>
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
						<button type="button" data-translate="matchmaking" class="submit-btn dashboard-btn" id="o-match"><ion-icon name="globe-outline"></ion-icon>Matchmaking</button>
						<button type="button" data-translate="tournament" class="submit-btn dashboard-btn" id="o-tournament"><ion-icon name="trophy-outline"></ion-icon>Tournament <span id="tournamentCounter"></span></button>
						<button type="button" data-translate="friendly" class="submit-btn dashboard-btn" id="f-match"><ion-icon name="people-outline"></ion-icon>Friendly Match</button>
						<button type="button" data-translate="friendlytournament" class="submit-btn dashboard-btn" id="f-tournament"><ion-icon name="trophy-outline"></ion-icon>Friendly Tournament</button>
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
