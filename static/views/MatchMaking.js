import AbstractView from "./AbstractView.js";
import Pong from "./Pong.js";
import {navigateTo, changeLanguage} from "../index.js";
import { createNotification } from "./Notifications.js";

export default class MatchMaking extends AbstractView {
    constructor(user) {
        super();
        this.user = user;
        this.lang = localStorage.getItem('language') || 'en';
        this.selfuser = "undefined";
        this.errro = false;
        this.opponent = "undefined";
        this.user.online_opponent.username = "undefined";
        this.user.online_opponent.pro_pic = "undefined";
        this.user.online_opponent.level = "undefined";
        // this.username = "undefined";
        // this.pro_pic = "undefined";
        this.roomName = "undefined";
        this.matchmaking_ws  = "none";
        this.game_ws = "none";
        this.initialize();
    }

    async initialize() {
        this.content = document.querySelector("#content");
		this.nav = document.querySelector("header");
		this.nav.innerHTML = this.getNav();
		this.content.innerHTML = this.getContent();
        const backBtn = document.getElementById("back");
		backBtn.addEventListener("click", e => {
			e.preventDefault();
			navigateTo("/online");
		});
        this.roomName = await this.getRoom_Match();
        if (this.roomName !== "undefined") {
            console.log("ROOM NAME", this.roomName);
            this.user.online_room = this.roomName;
            history.replaceState(null, null, "/pong");
            this.user.lastURL = "/pong";
            const view = new Pong(this.user);
            await view.connect_game();
            await view.loop();
        }
    }

    async loadUserData() {
		var csrftoken = await this.getCSRFToken();
		await fetch('/accounts/user_info/', {
			method: 'GET',
			headers: {
				'Content-Type' : 'application/json',
				'X-CSRFToken': csrftoken
			}
		})
			.then(response => response.json())
			.then(data => {
				console.log(data);
				this.setUser(data.username);
				this.setPic(data.pro_pic); //new
			})
			.catch((error) => {
				console.error('Error:', error);
			})
	}

    async setPic(data_pic){ //new
		this.pro_pic = data_pic;
	}

	async setUser(data_user) {
		this.username = data_user;
	}
	
	async setOpponent_pic (data) {
		this.opponent_pic = data;
	}
    
    async setOpponent(opponent)
    {
        this.opponent = opponent;
    }

    async getUser() {
		return this.user;
	}

	async getEmail() {
		return this.email;
	}
	
	async getPic(){ //new
		return this.pro_pic;
	}

    async getroomname(){
        return this.roomName;
    }

    async connect(roomName){
        this.user.matchmaking_ws = new WebSocket(
            'wss://'
        + window.location.hostname
        + ':8000'
        + '/ws/matchmaking/'
        )
    }

    
    async closeWebSocket() {
        if (this.user.matchmaking_ws) {
            //FAcciamo che una volta assegnato l'utente sfidante e la room, c'è un conto alla rovescia, e finchè
            // non finisce, stiamo connessi alla socket e se uno dei 2 esce prima dello scadere del conto alla rovescia
            // chiude la connesione e maagari elimina la room o elimina il suo username dal campo della room 
            await this.user.matchmaking_ws.close();
            console.log("DENTRO");
        }
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
    // Facciamo un api che crea una room appena cliccato su online-game, quindi poi chiede una lista di room disponibili (devo aggiungere
    // nella lista se la room è incompleta o no '1/2'), se non è completa allora ritorna il nome della room e la passa a this.connect(roomname).
    // poi magari si aggiunge anche un certo peso alla room, rispetto all'utente presente, se l'utente presente ha vinto 5 match e l'utente che
    // cerca una room, è più scarso, allora da meno importanza a quella room e ne cerca una con un user al suo livello.
    
    async getFriendInfo(user) {
        var csrftoken = this.getCSRFToken();
		await fetch('/accounts/guser_info/?username=' + user, {
            method: 'GET',
			headers: {
                'Content-Type' : 'application/json',
				'X-CSRFToken': csrftoken
			}
		}).then(response => response.json())
        .then(data => {
            console.log(data.user);
            this.user.online_opponent.username = data.user.username;
            this.user.online_opponent.pro_pic = data.user.pro_pic;
            this.user.online_opponent.level = data.user.level;
            // this.setOpponent_pic(data.pro_pic)
        })
        .catch((error) => {
            console.error('Error:', error);
        })
    }
    
    async connect_game(room_name){
        this.game_ws = new WebSocket(
            'wss://'
            + window.location.hostname
            + ':8000'
            + '/ws/pong/'
            + room_name
            + '/'
        );
    }

    async get_queue_resolve()
    {
        this.user.matchmaking_ws.onopen = () => {
            console.log('WebSocket connection opened');
            console.log("CONNECTED");
            this.user.matchmaking_ws.send(JSON.stringify({'action': 'join_queue'}));
        };
        
        this.user.matchmaking_ws.onmessage = async event => {
            try {
                const data = JSON.parse(event.data);
                if (data.User_self === this.username){
                    console.log('WebSocket message received:', event.data);
                    console.log('Parsed data:', data);
                    this.setOpponent(data.opponent);
                    await this.getFriendInfo(this.opponent)
                    this.roomName = data.room_name;
                    let conente_opponent = document.getElementById("opponent")
                    let img_opponet = document.getElementById("opponent_img")
                    img_opponet.src = this.opponent_pic;
                    conente_opponent.innerHTML = this.opponent;
                    await this.connect_game(this.roomName);
                    await new Promise(r => setTimeout(r, 2000));
                }
            } catch (error) {
                console.error('Error parsing message:', error);
            }
        };
    
        this.user.matchmaking_ws.onerror = error => {
            console.error('WebSocket error:', error);
        };
    }

    async getRoom_Match() {
        await this.connect();
        return new Promise((resolve, reject) => {
            this.user.matchmaking_ws.onopen = () => {
                console.log('WebSocket connection opened');
                console.log("CONNECTED");
                this.user.matchmaking_ws.send(JSON.stringify({'action': 'join_queue'}));
            };

            this.user.matchmaking_ws.onmessage = async event => {
                try {
                    const data = JSON.parse(event.data);
                    //  Quando riceve status 6 vuol dire che l'opponete si è disconnesso
                    if (data.status === 6){
                        createNotification("Your opponent has disconnected!", "opponentdisconnect");
                        const reset = document.querySelectorAll(".user-dashboard");
                        reset[1].innerHTML = `<h4 data-translate="waitingOpponent">Waiting for opponent...</h3>
                        <div class="lds-spinner"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>
                        `;
                        reset[1].classList.remove('user-dashboard');
                        reset[1].classList.add('opponent');
                        // Da resettare la pagina in modo da rendere di nuovo "Waiting for opponent..."
                        // con la rotellina che gira
                    }
                    if (data.status === 5){ /// Quando riceve status 5 vuol dire che è stato trovato un match, Setto l'opponent e la room
                        console.log("ADV") /// Ma prima di fare il resolve, dobbiamo fare un controllo per vedere se l'utente è ancora online
                        this.setOpponent(data.opponent);
                        console.log("OPPONENT", this.opponent, data.User_self !== this.user.getUser());
                        if (data.User_self === this.user.getUser()){
                            await this.getFriendInfo(this.opponent)
                            this.roomName = data.room_name;
                            const opponent = document.querySelector(".opponent");
                            if (opponent !== null){
                                opponent.innerHTML = `
                                    <img alt="Profile picture" src="${this.user.online_opponent.pro_pic}"/>
                                    <div class="user-info">
                                        <h3>${this.user.online_opponent.username}</h3>
                                        <h5>Level ${this.user.online_opponent.level}</h5>
                                    </div>
                                `;
                                opponent.classList.add('user-dashboard');
                                opponent.classList.remove('opponent');
                                opponent.style.marginTop = '45px';
                                opponent.style.marginBottom = '0px';
                            }
                        }
                    }
                    else if (data.User_self === this.user.getUser() && data.status === 2){
                        await this.user.matchmaking_ws.send(JSON.stringify({'action': 'to-pong'}));
                        console.log('WebSocket message received:', event.data);
                        console.log('Parsed data:', data);
                        if (data.status === 4)
                            console.log("Room Of a Friend");
                        if (data.status === 3)
                            console.log("AI Opponent");
                        if (data.status === 2)
                            console.log("Normal Opponent");
                        // this.setOpponent(data.opponent);
                        // console.log("OPPONENT", this.opponent);
                        // await this.getFriendInfo(this.opponent)
                        // this.roomName = data.room_name;
                        // // let conente_opponent = document.getElementById("opponent")
                        // // let img_opponet = document.getElementById("opponent_img")
                        // // img_opponet.src = this.opponent_pic;
                        // // conente_opponent.innerHTML = this.opponent;
                        // // await this.connect_game(this.roomName);
                        // console.log("ROOM NAME", this.roomName);
                        // const opponent = document.querySelector(".opponent");
                        // opponent.innerHTML = `
                        //     <img alt="Profile picture" src="${this.user.online_opponent.pro_pic}"/>
                        //     <div class="user-info">
                        //         <h3>${this.user.online_opponent.username}</h3>
                        //         <h5>Level ${this.user.online_opponent.level}</h5>
                        //     </div>
                        // `;
                        // opponent.classList.add('user-dashboard');
                        // opponent.classList.remove('opponent');
                        // opponent.style.marginTop = '45px';
                        // opponent.style.marginBottom = '0px';
                        await new Promise(r => setTimeout(r, 0));
                        resolve(this.roomName);
                    }
                } catch (error) {
                    console.error('Error parsing message:', error);
                    reject(error);
                }
            };

            this.user.matchmaking_ws.onerror = error => {
                console.error('WebSocket error:', error);
                reject(error);
            };
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
        const dashboardHTML = `
            <div class="dashboard">
                <div class="matchmaking">
                    <h1>Matchmaking</h1>
                    <div class="user-dashboard">
                        <img alt="Profile picture" src="${this.user.getPic()}"/>
                        <div class="user-info">
                            <h3>${this.user.getUser()}</h3>
                            <h5>Level ${this.user.getLevel()}</h5>
                        </div>
                    </div>
                    <span id="vs">VS</span>
                    <div class="opponent">
                        <h4 data-translate="waitingOpponent">Waiting for opponent...</h3>
                        <div class="spinner-border text-light" style="width: 3rem; height: 3rem;" role="status">
                            <span class="visually-hidden">Loading...</span>
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