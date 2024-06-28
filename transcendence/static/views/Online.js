import AbstractView from "./AbstractView.js";
import { navigateTo } from "../index.js";
import Info, { getCSRFToken, getusename } from "./Info.js";
import Room from "./Room.js";
import { createNotification } from "./Notifications.js";
import LocalPong from "./Localpong.js";
import PongCpu from "./PongCpu.js";

export default class Online extends AbstractView {
	constructor(user, ws_notifications) {
		super();
		this.user = user;
        this.player = 0
		this.ws_local = null;
		this.opponent = null;
		this.room = null;
        this.tournament = null;
		this.ws_notifications = ws_notifications;
		this.initialize();
		// this.getRoom();
	}

	initialize() {
		if (this.ws_notifications == null) {
			this.ws_notifications = new WebSocket('wss://'
			+ window.location.hostname
			+ ':8000'
			+ '/ws/notifications'
			+ '/');
		}
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

	generateRoomName(length) {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
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

	async tournamentInfo() {
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
	}

	async activeBtn() {
        await this.getTournament();
		const backBtn = document.getElementById("back");
		backBtn.addEventListener("click", e => {
			e.preventDefault();
				navigateTo("/dashboard");
		});
		const propose4TournamentBtn = document.getElementById("p-tournament-4");
		const propose8TournamentBtn = document.getElementById("p-tournament-8");
		const tournamentBtn = document.getElementById("o-tournament");
		const matchmakingBtn = document.getElementById("o-match");
		const friendlyBtn = document.getElementById("f-match");
		this.ws_notifications.onmessage = async (e) => {
			await this.getTournament();
			await this.tournamentInfo();
			this.ws_notifications.send(JSON.stringify({'action': "read"}));
			tournamentBtn.removeAttribute("disabled");
		}
		friendlyBtn.addEventListener("click", e => {
			e.preventDefault();
			console.log("Friendly Match");
			navigateTo("/online/friendly_match");
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
        } else
            tournamentBtn.setAttribute("disabled", "true");
        tournamentBtn.addEventListener("click", e => {
			console.log("Tournament is not active");
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
        });
		propose4TournamentBtn.addEventListener("click", async e => {
			e.preventDefault();
			let name = this.generateRoomName(8);
			const data = {
				name: name, // Replace with actual value
				playerNumber: 4, // Replace with actual value
				status: true // Replace with actual value
			};

			const response = await fetch("tournament_create/", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-CSRFToken": await getCSRFToken()
				},
				body: JSON.stringify(data)
			});

			if (response.ok) {
				console.log("Tournament proposed successfully");
				await this.getTournament();
				tournamentBtn.removeAttribute("disabled");
				await this.tournamentInfo();
				createNotification("Tournament room created!", "successTournament");
				
			} else {
				createNotification("There can be only one Tournament ", "failedTournament");
				console.log("Failed to propose tournament");
			}
		});
		propose8TournamentBtn.addEventListener("click", async e => {
			e.preventDefault();
			let name = this.generateRoomName(8);

			const data = {
				name: name, // Replace with actual value
				playerNumber: 8, // Replace with actual value
				status: true // Replace with actual value
			};

			const response = await fetch("tournament_create/", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-CSRFToken": await getCSRFToken()
				},
				body: JSON.stringify(data)
			});

			if (response.ok) {
				console.log("Tournament proposed successfully");
				await this.getTournament();
				tournamentBtn.removeAttribute("disabled");
				await this.tournamentInfo();
				createNotification("Tournament room created", "successTournament");
				
			} else {
				createNotification("There can be only one Tournament ", "failedTournament");
				console.log("Failed to propose tournament");
			}
		});
	}
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

	getNav () {
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
						</div>
					<div class="tb">
						<div class="tournament-buttons">
						<button type="button" data-translate="tournament4p" class="submit-btn dashboard-btn" id="p-tournament-4"><ion-icon name="send-outline"></ion-icon>Tournament 4 </span></button>
						<button type="button" data-translate="tournament8p" class="submit-btn dashboard-btn" id="p-tournament-8"><ion-icon name="send-outline"></ion-icon>Tournament 8 </span></button>
						</div>
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
