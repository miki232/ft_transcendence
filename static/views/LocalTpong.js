import AbstractView from "./AbstractView.js";
import { navigateTo } from "../index.js";
import { changeLanguage } from "../index.js";
import Room from "./Room.js";
import { createNotification } from "./Notifications.js";


export default class LocalTpong extends AbstractView{
    constructor(user, user1, opponent, room_name, onLoopFinish){
        super();
        this.room_name = room_name;
		this.user1 = user1;
        this.game_ws = null;
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
        this.lang = localStorage.getItem('language') || 'en';
		this.onLoopFinish = onLoopFinish;
		this.traces = 0;
        this.initialize();
    }

    async initialize() {
		this.game_ws = new WebSocket(
			'wss://'
			+ window.location.hostname
			+ ':8000'
			+ '/ws/local/'
			+ this.room_name
			+ '/'
		);
		this.users.local_ws = this.game_ws;
        document.querySelector('header').style.display = 'none';
        document.querySelector('body').classList.add('game-bg');
        const content = document.getElementById('content');
        content.innerHTML = await this.getContent();
        console.log(this.opponent, this.game_ws, this.room_name);
        changeLanguage(this.lang);
        await this.loop();
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
            // console.log('sending move_up');
            this.game_ws.send(JSON.stringify({'Handling' : 'ingame', 'action': 'move_up', 'user': this.opponent}));
        }
        if (this.keysPressed['ArrowDown']) {
            this.game_ws.send(JSON.stringify({'Handling' : 'ingame', 'action': 'move_down', 'user': this.opponent}));
        }
        if (this.keysPressed['w']) {
            this.game_ws.send(JSON.stringify({'Handling' : 'ingame', 'action': 'move_up', 'user': this.user1}));
        }
        if (this.keysPressed['s']) {
            this.game_ws.send(JSON.stringify({'Handling' : 'ingame', 'action': 'move_down', 'user': this.user1}));
        }
    }

    winner_checker(data) {
        if (data.victory != "none" && data.victory != undefined) {
            const canvas = document.getElementById('pongCanvas');
            const context = canvas.getContext('2d');
            context.font = '48px serif';
            context.fillStyle = 'red';
            if (data.victory === this.user1) {
                console.log('You Win!');
                context.fillStyle = 'green';
                context.fillText('You Win!', canvas.width / 5, canvas.height / 2);
                context.fillStyle = 'red';
                context.fillText('You Lose!', (canvas.width / 5) * 3, canvas.height / 2);
            } else {
                console.log('You Lose!');
                context.fillStyle = 'red';
                context.fillText('You Lose!', canvas.width / 5, canvas.height / 2);
                context.fillStyle = 'green'; 
                context.fillText('You Win!', (canvas.width / 5) * 3, canvas.height / 2);
            }
            setTimeout(() => {
				this.users.disconnected = false;
				this.users.tournament_local_room.winner = data.victory;
                this.closeWebSocket();
				this.traces++;
				if (this.traces < 2) {
					this.onLoopFinish();
				}
			}, 3000);
        }   
    }
    

    async loop() {
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
                this.game_ws.send(JSON.stringify({'Handling' : 'lobby', 'status': 'ready', 'username': this.user1, 'opponent':  this.opponent}));
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
            if (data.score1 !==  this.user1) {
                document.getElementById("player1-score").innerHTML = this.user1 + ": " + data.score1;
            }
            if (data.score2 !==  this.opponent) {
                document.getElementById("player2-score").innerHTML = this.opponent + ": " + data.score2;
            }
            this.update(canvas, context);
            this.winner_checker(data);
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
            <div id="scores">
                    <div id="player1-score" class="score-info"></div>
                    <div id="the-match"><h1>THE MATCH</h1></div>
                    <div id="player2-score" class="score-info"></div>
            </div>
            <div id="countdown" data-translate="commands" class="countdown"> Command "W/S", ArrowUp and ArrowDown, Press Enter to Start the Game</div>
            <canvas id="pongCanvas" width="800" height="600"></canvas>
        `;
    }
}