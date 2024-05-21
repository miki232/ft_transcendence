import AbstractView from "./AbstractView.js";
import Pong from "./Pong.js";
import {navigateTo} from "../index.js";

export default class MatchMaking extends AbstractView {
    constructor(user) {
        super();
        this.user = user;
        this.selfuser = "undefined";
        this.errro = false;
        this.opponent = "undefined";
        this.opponent_name = "undefined";
        this.opponent_lvl = "undefined";
        this.opponent_pic = "undefined";
        // this.username = "undefined";
        // this.pro_pic = "undefined";
        this.roomName = "undefined";
        this.matchmaking_ws  = "none";
        this.game_ws = "none";
        this.initialize();
    }

    async initialize() {
        this.content = document.querySelector("#content");
		this.nav = document.querySelector("nav");
		this.nav.innerHTML = this.getNav();
		this.content.innerHTML = this.getContent();
        this.roomName = await this.getRoom_Match();
        if (this.roomName !== "undefined") {
            console.log("ROOM NAME", this.roomName);
            this.user.online_room = this.roomName;
            this.user.online_opponent = this.opponent;
            // navigateTo("/pong");
            await this.closeWebSocket();
            history.replaceState(null, null, "/pong");
            this.user.lastURL = "/pong";
            const view = new Pong(this.user);
            await view.connect_game();
            await view.loop();
        }
    }

    async loadUserData() {
		var csrftoken = await this.getCSRFToken('csrftoken')
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


    async connect(roomName){
        this.matchmaking_ws = new WebSocket(
            'wss://'
        + window.location.hostname
        + ':8000'
        + '/ws/matchmaking/'
        )
    }

    
    async closeWebSocket() {
        if (this.matchmaking_ws) {
            //FAcciamo che una volta assegnato l'utente sfidante e la room, c'è un conto alla rovescia, e finchè
            // non finisce, stiamo connessi alla socket e se uno dei 2 esce prima dello scadere del conto alla rovescia
            // chiude la connesione e maagari elimina la room o elimina il suo username dal campo della room 
            await this.matchmaking_ws.close();
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
            this.opponent_name = data.user.username;
            this.opponent_pic = data.user.pro_pic;
            this.opponent_lvl = data.user.level;
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
        this.matchmaking_ws.onopen = () => {
            console.log('WebSocket connection opened');
            console.log("CONNECTED");
            this.matchmaking_ws.send(JSON.stringify({'action': 'join_queue'}));
        };
        
        this.matchmaking_ws.onmessage = async event => {
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
    
        this.matchmaking_ws.onerror = error => {
            console.error('WebSocket error:', error);
        };
    }

    async getRoom_Match() {
        await this.connect();
        return new Promise((resolve, reject) => {
            this.matchmaking_ws.onopen = () => {
                console.log('WebSocket connection opened');
                console.log("CONNECTED");
                this.matchmaking_ws.send(JSON.stringify({'action': 'join_queue'}));
            };

            this.matchmaking_ws.onmessage = async event => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.User_self === this.user.getUser()){
                        console.log('WebSocket message received:', event.data);
                        console.log('Parsed data:', data);
                        this.setOpponent(data.opponent);
                        await this.getFriendInfo(this.opponent)
                        this.roomName = data.room_name;
                        // let conente_opponent = document.getElementById("opponent")
                        // let img_opponet = document.getElementById("opponent_img")
                        // img_opponet.src = this.opponent_pic;
                        // conente_opponent.innerHTML = this.opponent;
                        // await this.connect_game(this.roomName);
                        console.log("ROOM NAME", this.roomName);
                        const opponent = document.querySelector(".opponent");
                        opponent.innerHTML = `
                            <div class="user-dashboard">
                                <img alt="Profile picture" src="${this.opponent_pic}"/>
                                <div class="user-info">
                                    <h3>${this.opponent_name}</h3>
                                    <h5>Level ${this.opponent_lvl}</h5>
                                </div>
                            </div>
                        `;
                        // await new Promise(r => setTimeout(r, 3000));
                        await new Promise(r => setTimeout(r, 3000));
                        resolve(this.roomName);
                    }
                } catch (error) {
                    console.error('Error parsing message:', error);
                    reject(error);
                }
            };

            this.matchmaking_ws.onerror = error => {
                console.error('WebSocket error:', error);
                reject(error);
            };
        });
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
        // await this.loadUserData();
        // await this.matchmaking();
        // await this.connect(this.generateRoomName(10));
        // this.ws.onmessage = function(event){
        //     const data = JSON.parse(event.data);
        //     console.log(data);
        // };
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
                        <h4>Waiting for opponent... <ion-icon name="refresh-outline"></ion-icon></h3>
                    </div>
                </div>
            </div>
        `;
    
        return dashboardHTML;
    }
}