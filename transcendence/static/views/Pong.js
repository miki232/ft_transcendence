import { createNotification } from "./Notifications.js";
import { navigateTo } from "../index.js";

export default class Pong {
    constructor(user){
        this.user = user;
        this.user_paddle_color1;
        this.user_paddle_color2;
        this.pong_color = user.pong_color;
        this.tempcolor;
        this.opponent = this.user.online_opponent;
        this.room_name = this.user.online_room;
        this.player1 = undefined;
        this.player2 = undefined;
        this.player1_pic = undefined;
        this.player2_pic = undefined;
        this.score1 = 0;
        this.score2 = 0;
        this.ball_size = 20;
        this.ballX = 800 / 2 - this.ball_size / 2;
        this.ballY = 600 / 2 - this.ball_size / 2;
        this.paddle_width = 20;
        this.paddle_height = 100;
        this.net_width = 4;
        this.net_height = 20;
        this.playerPaddleY = 600 / 2 - this.paddle_height / 2;
        this.opponentPaddleY = 600 / 2 - this.paddle_height / 2;
        this.arrowUpPressed = false;
        this.arrowDownPressed = false;
        this.users = "null";
        this.initialize();
    }

    async initialize() {
        document.querySelector('header').style.display = 'none';
        document.querySelector('body').classList.add('game-bg');
        const content = document.getElementById('content');
        content.innerHTML = this.getContent();
        await this.closeWebSocket(this.user.matchmaking_ws);
    }


    async getCSRFToken() {
		let csrftoken = await fetch("csrf-token")
			.then(response => response.json())
			.then(data => data.csrfToken);
			console.log(csrftoken);
		return csrftoken;
	}

    async loadOpponentPaddle(userID) {
		var csrftoken = await this.getCSRFToken()
		await fetch('/accounts/guser_info/?username=' + userID, {
			method: 'GET',
			headers: {
				'Content-Type' : 'application/json',
				'X-CSRFToken': csrftoken
			}
		})
			.then(response => response.json())
			.then(data => {
				console.log(data);
                console.log(data.user.paddle_color);
                this.tempcolor = data.user.paddle_color;
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
    }

    async closeWebSocket(ws) {
        if (ws) {
            //FAcciamo che una volta assegnato l'utente sfidante e la room, c'è un conto alla rovescia, e finchè
            // non finisce, stiamo connessi alla socket e se uno dei 2 esce prima dello scadere del conto alla rovescia
            // chiude la connesione e maagari elimina la room o elimina il suo username dal campo della room 
            await ws.close();
            console.log("DISCONNECTED FROM WEBSOCKET PONG");
        }
    }

    async scoreTabMaker(data) {
        console.log("data.player", data.player);
        if (data.player === this.user.username) {
            this.player1 = this.user.username;
            this.player2 = this.user.online_opponent.username;
            this.player1_pic = this.user.getPic();
            this.player2_pic = this.user.online_opponent.pro_pic;
            console.log("player1", this.player1, "player2", this.user.online_opponent.username);
            await this.loadOpponentPaddle(this.user.online_opponent.username);
            console.log("this.tempcolor", this.tempcolor)
            this.user_paddle_color1 = this.user.paddle_color;
            this.user_paddle_color2 = this.tempcolor
        } else {
            this.player1 = this.user.online_opponent.username;
            this.player2 = this.user.username;
            this.player1_pic = this.user.online_opponent.pro_pic;
            this.player2_pic = this.user.getPic();
            console.log("ON ELSE player1", this.player1, "player2", this.user.online_opponent.username);
            await this.loadOpponentPaddle(this.user.online_opponent.username);
            this.user_paddle_color1 = this.tempcolor
            this.user_paddle_color2 = this.user.paddle_color;
        }
        const playerOneTab = document.getElementById('player1-score');
        const playerTwoTab = document.getElementById('player2-score');
        const playerOneHTML = `
            <img src="${this.player1_pic}"/><p>${this.player1}</p><p id="score1"></p>
        `;
        const playerTwoHTML = `
            <p id="score2"></p><p>${this.player2}</p><img src="${this.player2_pic}"/>
        `;
        playerOneTab.innerHTML = playerOneHTML;
        playerTwoTab.innerHTML = playerTwoHTML;
        this.score1 = document.getElementById("score1");
        this.score2 = document.getElementById("score2");
    }

    winner_checker(data) {
        if (data.victory != "none" && data.victory != undefined) {
            const content = document.getElementById('content');
            const resultHTML = `
                <div class="result" style="display: flex; justify-content: center; width: 800px; height: 400px;">
                    <img ${data.victory === this.user.getUser() ? 'src="/static/img/win.jpg"' : 'src="/static/img/lose.jpg"'} alt="result" style="width: auto; border-radius: 0px">
                </div>
            `;
            content.innerHTML = resultHTML;
            setTimeout(() => {
                this.user.disconnected = false;
                content.innerHTML = '';
                navigateTo('/online');
            }, 3000);
        }   
    }

    drawPaddle(ctx, x, y, width, height, color) {
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

    drawNet(ctx, canvas) {
        for (let i = 0; i < canvas.height + this.net_height; i += this.net_height * 2) {
            this.drawPaddle(ctx, canvas.width / 2 - this.net_width / 2, i, this.net_width, this.net_height, '#e10088');
        }
    }

    update(canvas, context) {
        this.updatePaddlePosition();
        // Clear the previous frame
        context.clearRect(0, 0, canvas.width, canvas.height);

        this.drawNet(context, canvas);
        this.drawPaddle(context, 20, this.playerPaddleY, this.paddle_width, this.paddle_height, this.user_paddle_color1);
        this.drawPaddle(context, canvas.width - this.paddle_width -20, this.opponentPaddleY, this.paddle_width, this.paddle_height, this.user_paddle_color2);
        this.drawBall(context, this.ballX, this.ballY, this.ball_size / 2, '#FF0066');
        // Draw player paddle
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
        if (this.arrowUpPressed) {
            console.log('sending move_up');
            this.user.game_ws.send(JSON.stringify({'action': 'move_up', 'user': this.user.username}));
        }
        if (this.arrowDownPressed) {
            this.user.game_ws.send(JSON.stringify({'action': 'move_down', 'user': this.user.username}));
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
            if (this.player1 === undefined) {
                this.scoreTabMaker(data);
            }
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
            if (data.countdown !== undefined && data.countdown > 0) {
                createNotification(data.countdown);
            }
            if (data.status === 1 && data.Game !== 'none') {
                createNotification(data.Game);
            }
            this.score1.innerHTML = data.score1;
            this.score2.innerHTML = data.score2;
            this.winner_checker(data);
            this.update(canvas, context);
        }
    }

    getContent() {
        const pongHTML =  `
            <div id="scores">
                <div id="player1-score" class="score-info"></div>
                <div id="the-match"><h1>THE MATCH</h1></div>
                <div id="player2-score" class="score-info"></div>
            </div>
            <canvas id="pongCanvas" width="800" height="600" style="background-color: ${this.pong_color};"></canvas>
        `;
        return pongHTML;
    }
}