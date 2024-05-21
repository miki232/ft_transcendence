import { createNotification } from "./Notifications.js";
import { navigateTo } from "../index.js";

export default class Pong {
    constructor(user){
        this.user = user;
        this.opponent = this.user.online_opponent;
        this.room_name = this.user.online_room;
        // this.game_ws = "null";
        this.score1;
        this.score2;
        this.ballX = 0;
        this.ballY = 0;
        this.paddle_width = 10;
        this.paddle_height = 100;
        this.ball_radius = 5;
        this.playerPaddleY = 400 / 2 - this.paddle_height / 2;
        this.opponentPaddleY = 400 / 2 - this.paddle_height / 2;
        this.arrowUpPressed = false;
        this.arrowDownPressed = false;
        this.users = "null";
        this.initialize();
    }

    initialize(){
        document.querySelector('header').style.display = 'none';
        document.querySelector('body').classList.add('game-bg');
        const content = document.getElementById('content');
        content.innerHTML = this.getContent();
        this.score1 = document.getElementById("score1");
        this.score2 = document.getElementById("score2");
    }


    async getCSRFToken() {
		let csrftoken = await fetch("csrf-token")
			.then(response => response.json())
			.then(data => data.csrfToken);
			console.log(csrftoken);
		return csrftoken;
	}

    async loadUserData() {
		var csrftoken = await this.getCSRFToken()
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
			})
			.catch((error) => {
				console.error('Error:', error);
			})
	}

	async setUser(data_user) {
		this.users = data_user;
	}


    async connect_game(){
        this.user.game_ws = new WebSocket(
            'wss://'
            + window.location.hostname
            + ':8000'
            + '/ws/pong/'
            + this.room_name
            + '/'
        );
        console.log("GAME_WS:", this.user.game_ws);
    }

    async closeWebSocket() {
        if (this.user.game_ws) {
            //FAcciamo che una volta assegnato l'utente sfidante e la room, c'è un conto alla rovescia, e finchè
            // non finisce, stiamo connessi alla socket e se uno dei 2 esce prima dello scadere del conto alla rovescia
            // chiude la connesione e maagari elimina la room o elimina il suo username dal campo della room 
            await this.user.game_ws.close();
            console.log("DISCONNECTED FROM WEBSOCKET PONG");
        }
    }

    winner_checker(data) {
        if (data.victory != "none") {
            this.user.getUser() === data.victory ? createNotification("YOU WIN!") : createNotification("YOU LOSE!");
            this.user.disconnected = false;
            navigateTo('/online');
        }   
    }

    update(canvas, context) {
        this.updatePaddlePosition();
        // Clear the previous frame
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Draw player paddle
        context.fillStyle = '#FFFFFF';
        context.fillRect(0,  this.playerPaddleY, this.paddle_width, this.paddle_height);

        // Draw opponent paddle
        context.fillRect(canvas.width - this.paddle_width, this.opponentPaddleY, this.paddle_width, this.paddle_height);

        context.beginPath();
        context.arc(this.ballX, this.ballY, 5, 0, Math.PI * 2);
        context.fillStyle = '#FFFFFF';
        context.fill();
        context.closePath();
    }

    updatePaddlePosition() {
        if (this.arrowUpPressed) {
            console.log('sending move_up');
            this.user.game_ws.send(JSON.stringify({'action': 'move_up', 'user': this.users}));
        }
        if (this.arrowDownPressed) {
            this.user.game_ws.send(JSON.stringify({'action': 'move_down', 'user': this.users}));
        }
    }

    async loop(){
        const canvas = document.getElementById('pongCanvas');
        const context = canvas.getContext('2d');
        document.addEventListener('keydown', (event) => {
            console.log('keydown', event.key);
            if (event.key === 'ArrowUp') {
                this.arrowUpPressed = true;
                console.log('sending move_up', this.arrowUpPressed);
            } else if (event.key === 'ArrowDown') {
                this.arrowDownPressed = true;
            }
            
        });
        document.addEventListener('keyup', (event) => {
            console.log('keyup', event.key);
            if (event.key === 'ArrowUp') {
                this.arrowUpPressed = false;
            } else if (event.key === 'ArrowDown') {
                this.arrowDownPressed = false;
            }
        });        
        this.update(canvas, context);
        this.user.game_ws.onmessage = event => {
            const data = JSON.parse(event.data);
            if (data.ball_x !== undefined) {
                this.ballX = data.ball_x;
            }
            if (data.ball_y !== undefined) {
                this.ballY = data.ball_y;
            }
            if (data.paddle1_y !== undefined) {
                this.playerPaddleY = data.paddle1_y;
                // console.log('playerPaddleY', playerPaddleY);
            }
            if (data.paddle2_y !== undefined) {
                this.opponentPaddleY = data.paddle2_y;
            }
            this.score1.innerHTML = data.score1;
            this.score2.innerHTML = data.score2;
            this.winner_checker(data);
            // if (data.score1 !== undefined) {
            //     if (data.player === users)
            //         document.getElementById("score1").innerHTML = "Your Score: " + data.score1;
            //     else
            //         document.getElementById("score1").innerHTML = "Not your Score: " + data.score1;
            // }
            // if (data.score2 !== undefined) {
            //     if (data.player !== users)
            //         document.getElementById("score2").innerHTML = "Your Score: " + data.score2;
            //     else
            //         document.getElementById("score2").innerHTML = "Not your Score: " + data.score2;
            // }
            // if (data.victory != "none"){
            //     console.log(data.victory);
            //     if (users === data.victory)
            //         alert("YOU WIN!" + users)
            //     else
            //         alert("AHAHAH hai PERSO")
            // }

            this.update(canvas, context);
        }
    }

    getContent() {
        // await this.loadUserData();
        // await this.connect_game();
        // this.ws.onmessage = function(event){
        //     const data = JSON.parse(event.data);
        //     console.log(data);
        // };
        const pongHTML =  `
            <div id="scores">
                <p>${this.user.getUser()}: <span id="score1"></span></p>
                <p>${this.opponent}: <span id="score2"></span></p>
            </div>
            <canvas id="pongCanvas" width="800" height="400"></canvas>
        `;
        return pongHTML;
    }
}