import AbstractView from "./AbstractView.js";
import {navigateTo} from "../index.js";

export default class MatchMaking extends AbstractView {
    constructor() {
        super();
        this.selfuser = "undefined";
        this.errro = false;
        this.opponent = "undefined";
        this.opponent_pic = "undefined";
        this.username = "undefined";
        this.pro_pic = "undefined";
        this.roomName = "undefined";
        this.matchmaking_ws  = "none";
        this.game_ws = "none";
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
            this.opponent_pic = data.user.pro_pic;
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
                        // await this.connect_game(this.roomName);
                        await new Promise(r => setTimeout(r, 2000));
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
    async getContent() {
        await this.loadUserData();
        // await this.matchmaking();
        // await this.connect(this.generateRoomName(10));
        // this.ws.onmessage = function(event){
        //     const data = JSON.parse(event.data);
        //     console.log(data);
        // };
        return  `
            <div class="container">
                <div class="half">
                    <img src="${this.pro_pic}" alt="User Image" class="user-image">
                    <p class="search-text">${this.username}</p>
                </div>
                <div class="half">
                    <img src="${this.opponent_pic}" id="opponent_img" alt="User Image" class="user-image">
                    <p id="opponent" class="search-text">Search for opponent...</p>
                </div>
            </div>
        `;
    }
}