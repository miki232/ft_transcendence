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
		this.content = document.querySelector("#content");
		this.nav = document.querySelector("nav");
		this.nav.innerHTML = this.getNav();
		this.content.innerHTML = this.getContent();
		this.activeBtn();
		this.user.expProgress();
        this.player = 0
		this.ws_local = null;
		this.opponent = null;
		this.room = null;
        this.tournament = null;
		// this.getRoom();
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
        matchmakingBtn.addEventListener("click", e => {
            e.preventDefault();
            console.log("1 vs 1");
            navigateTo("/matchmaking");
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
			<a href="/local_game" data-translate="local" name="local" class="dashboard-nav" data-link>Local Game</a>
			<a href="/online" data-translate="online" name="online" class="dashboard-nav" data-link>Online Game</a>
			<a href="/ranking" data-translate="ranking" name="ranking" class="dashboard-nav" data-link>Ranking</a>
			<a href="/friends" data-translate="friends" name="friends" class="dashboard-nav" data-link>Friends</a>
			<a href="/chat" name="chat" class="dashboard-nav" data-link>Chat</a>
			<a href="/dashboard" name="dashboard" class="profile-pic dashboard-nav" data-link><img alt="Profile picture" src="${this.user.getPic()}"/></a>
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
					<button type="button" data-translate="matchmaking" class="submit-btn dashboard-btn" id="o-match"><ion-icon name="globe-outline"></ion-icon>Matchmaking</button>
					<button type="button" data-translate="tournament" class="submit-btn dashboard-btn" id="o-tournament"><ion-icon name="trophy-outline"></ion-icon>Tournament <span id="tournamentCounter">(0/8)</span></button>
					<button type="button" data-translate="friendly" class="submit-btn dashboard-btn" id="f-match"><ion-icon name="people-outline"></ion-icon>Friendly Match</button>
					<button type="button" data-translate="friendlytournament" class="submit-btn dashboard-btn" id="f-tournament"><ion-icon name="trophy-outline"></ion-icon>Friendly Tournament</button>
				</div>
			</div>
		`;
		return dashboardHTML;
	}
}
