import AbstractView from "./AbstractView.js";
import { navigateTo } from "../index.js";
import Room from "./Room.js";
import { createNotification } from "./Notifications.js";


export default class LocalPong extends AbstractView{
    constructor(user, opponent, room_name, ws){
        super();
        this.room_name = room_name;
        this.game_ws = ws;
        this.ball_size = 20;
        this.ballX = 800 / 2;
        this.ballY = 600 / 2 - this.ball_size / 2;
        this.paddle_width = 20;
        this.paddle_height = 100;
        this.net_width = 4;
        this.net_height = 20;
        this.playerPaddleY = 600 / 2 - this.paddle_height / 2;
        this.opponentPaddleY = 600 / 2 - this.paddle_height / 2;
        this.arrowUpPressed = false;
        this.arrowDownPressed = false;
        this.users = user;
        this.user_paddle_color = user.paddle_color;
        this.keysPressed = {};
        this.opponent = opponent;
        this.gamestarted = false;
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


    // async connect_game(){
    //     this.game_ws = new WebSocket(
    //         'wss://'
    //         + window.location.hostname
    //         + ':8000'
    //         + '/ws/pong/'
    //         + this.room_name
    //         + '/'
    //     );
    // }

    async closeWebSocket() {
        if (this.game_ws) {
            //FAcciamo che una volta assegnato l'utente sfidante e la room, c'è un conto alla rovescia, e finchè
            // non finisce, stiamo connessi alla socket e se uno dei 2 esce prima dello scadere del conto alla rovescia
            // chiude la connesione e maagari elimina la room o elimina il suo username dal campo della room 
            await this.game_ws.close();
            console.log("DISCONNECTED FROM WEBSOCKET PONG");
        }
    }

    drawRect(ctx, x, y, width, height, color) {
        console.log("COLOR", color);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
        ctx.fillRect(x, y, width, height);
    }

    drawBall(ctx, x, y, size, color) {
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();
    }

    drawNet(ctx, canvas, color) {
        for (let i = 0; i <= canvas.height; i += this.net_height * 1.5) {
            this.drawRect(ctx, canvas.width / 2 - this.net_width / 2, i, this.net_width, this.net_height, color);
        }
    }

    update(canvas, context) {
        this.updatePaddlePosition();
        // Clear the previous frame
        context.clearRect(0, 0, canvas.width, canvas.height);

        this.drawNet(context, canvas, "#FFFFFF");
        this.drawRect(context, 10, this.playerPaddleY, this.paddle_width, this.paddle_height, this.user_paddle_color);
        this.drawRect(context, canvas.width - this.paddle_width -10, this.opponentPaddleY, this.paddle_width, this.paddle_height, '#00CCFF');
        this.drawBall(context, this.ballX, this.ballY, this.ball_size / 2, '#FFDE59');
        // Draw player paddle
        // context.fillStyle = '#FFFFFF';
        // context.fillRect(0,  this.playerPaddleY, this.paddle_width, this.paddle_height);

        // Draw opponent paddle
        // context.fillRect(canvas.width - this.paddle_width, this.opponentPaddleY, this.paddle_width, this.paddle_height);

        // context.beginPath();
        // context.arc(this.ballX, this.ballY, 5, 0, Math.PI * 2);
        // context.fillStyle = '#FFFFFF';
        // context.fill();
        // context.closePath();
    }

    updatePaddlePosition() {
        if (this.keysPressed['ArrowUp']) {
            console.log('sending move_up');
            this.game_ws.send(JSON.stringify({'Handling' : 'ingame', 'action': 'move_up', 'user': this.opponent}));
        }
        if (this.keysPressed['ArrowDown']) {
            this.game_ws.send(JSON.stringify({'Handling' : 'ingame', 'action': 'move_down', 'user': this.opponent}));
        }
        if (this.keysPressed['w']) {
            this.game_ws.send(JSON.stringify({'Handling' : 'ingame', 'action': 'move_up', 'user': this.users.username}));
        }
        if (this.keysPressed['s']) {
            this.game_ws.send(JSON.stringify({'Handling' : 'ingame', 'action': 'move_down', 'user': this.users.username}));
        }
    }

    async loop(){
        console.log('loop', this.game_ws);
        const canvas = document.getElementById('pongCanvas');
        const context = canvas.getContext('2d');
        
        document.addEventListener('keydown', (event) => {
            // console.log('keydown', event.key);
            this.keysPressed[event.key] = true;
            // if (this.keysPressed['ArrowUp']) {
            //     this.arrowUpPressed = true;
            //     console.log('sending move_up', this.arrowUpPressed);
            // }
            // if (this.keysPressed['ArrowDown']) {
            //     console.log('sending down', this.arrowUpPressed);
            //     this.arrowDownPressed = true;
            // }
            // if (this.keysPressed['W']) {
            //     console.log('sending W', this.arrowUpPressed);
            //     this.arrowDownPressed = true;
            // }
            if (event.key === 'Enter' && !this.gamestarted) {
                this.gamestarted = true;
                this.game_ws.send(JSON.stringify({'Handling' : 'lobby', 'status': 'ready', 'username': this.users.username, 'opponent':  this.opponent}));
            }
            
        });
        document.addEventListener('keyup', (event) => {
            this.keysPressed[event.key] = false;
            // console.log('keyup', event.key);
            // if (event.key === 'ArrowUp') {
            //     this.arrowUpPressed = false;
            // }
            // if (event.key === 'ArrowDown') {
            //     this.arrowDownPressed = false;
            // }
        });        
        this.update(canvas, context);
        this.game_ws.onmessage = event => {
            const data = JSON.parse(event.data);
            if (data.countdown !== undefined) {
                document.getElementById('countdown').style.display = 'block';
                document.getElementById('countdown').innerText = data.countdown;
            }
            if (data["status"] === 1) {
                document.getElementById('countdown').innerText = data.Game;
                // ...
            }
            if (data.ball_x !== undefined) {
                document.getElementById('countdown').style.display = 'none';
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
            if (data.score1 !==  this.users.username) {
                document.getElementById("score1").innerHTML = this.users.username + " Score: " + data.score1;

            }
            if (data.score2 !==  this.opponent) {
                document.getElementById("score2").innerHTML = this.opponent + " Score: " + data.score2;
            }
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

    async getContent() {
        // await this.loadUserData();
        // await this.connect_game();
        // this.ws.onmessage = function(event){
        //     const data = JSON.parse(event.data);
        //     console.log(data);
        // };
        return  `
            <h1 id="score1">Score: 0</h1>
            <h1 id="score2">Score: 0</h1>
            <div id="countdown" class="countdown"> Command "W/S", ArrowUp and ArrowDown, Press Enter to Start the Game</div>
            <canvas id="pongCanvas" width="800" height="600"></canvas>
        `;
    }
}