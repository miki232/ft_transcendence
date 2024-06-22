import AbstractView from "./AbstractView.js";
import { navigateTo } from "../index.js";
import Room from "./Room.js";
import { createNotification } from "./Notifications.js";

export default class PongCpu extends AbstractView {
    constructor(user, opponent, room_name, ws) {
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
        this.users = user;
        this.user_paddle_color = user.paddle_color;
        this.pong_color = user.pong_color;
        this.arrowDownPressed = false;
        this.keysPressed = {};
        this.opponent = opponent;
        this.gamestarted = false;
        this.initialize();
    }

    async initialize() {
        console.log("Pong Color: ", this.pong_color);
        document.querySelector('header').style.display = 'none';
        document.querySelector('body').classList.add('game-bg');
        const content = document.getElementById('content');
        content.innerHTML = this.getContent();
        console.log(this.opponent, this.game_ws, this.room_name);
        // changeLanguage(this.lang);
        await this.loop();
    }

    async getCSRFToken() {
        let csrftoken = await fetch("/csrf-token")
            .then(response => response.json())
            .then(data => data.csrfToken);
        console.log(csrftoken);
        return csrftoken;
    }

    async loadUserData() {
        var csrftoken = await this.getCSRFToken();
        await fetch('/accounts/user_info/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
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
            });
    }

    async setUser(data_user) {
        this.users = data_user;
    }

    async closeWebSocket() {
        if (this.game_ws) {
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
        context.fillStyle = '#e10088';

        context.clearRect(0, 0, canvas.width, canvas.height);
        this.drawNet(context, canvas, "#FFFFFF");
        this.drawRect(context, 20, this.playerPaddleY, this.paddle_width, this.paddle_height, this.user_paddle_color);
        this.drawRect(context, canvas.width - this.paddle_width - 20, this.opponentPaddleY, this.paddle_width, this.paddle_height, '#00CCFF');
        this.drawBall(context, this.ballX, this.ballY, this.ball_size / 2, '#FFDE59');
    }

    updatePaddlePosition() {
        if (this.keysPressed['ArrowUp']){
            this.game_ws.send(JSON.stringify({'Handling': 'ingame', 'action': 'move_up', 'user': this.users.username}));
        }
        if (this.keysPressed['ArrowDown']){
            this.game_ws.send(JSON.stringify({'Handling': 'ingame', 'action': 'move_down', 'user': this.users.username}));
        }
    }

    winner_checker(data) {
        if (data.victory != "none" && data.victory != undefined) {
            const content = document.getElementById('content');
            const resultHTML = `
                <div class="result" style="display: flex; justify-content: center; width: 800px; height: 400px;">
                    <img ${data.victory === this.users.getUser() ? 'src="/static/img/win.jpg"' : 'src="/static/img/lose.jpg"'} alt="result" style="width: auto; border-radius: 0px">
                </div>
            `;
            content.innerHTML = resultHTML;
            setTimeout(() => {
                this.users.disconnected = false;
                content.innerHTML = '';
                navigateTo('/local_game');
            }, 3000);
        }
    }

    handleTouchStart(event, canvas) {
        this.game_ws.send(JSON.stringify({'Handling': 'lobby', 'status': 'ready', 'username': this.users.username, 'opponent': this.opponent}));

    }

    handleTouchMove(event, canvas) {
        event.preventDefault();
        let touch = event.touches[0];
        let touchY = touch.clientY - canvas.getBoundingClientRect().top;
        
        if (touch.clientX < canvas.width / 2) {
            this.playerPaddleY = touchY - this.paddle_height / 2;
            this.sendPaddlePosition(canvas);
        }
    }

    sendPaddlePosition(canvas) {
        if (this.playerPaddleY < canvas.height / 2) {
            this.game_ws.send(JSON.stringify({'Handling': 'ingame', 'action': 'move_up', 'user': this.users.username}));
        } else {
            this.game_ws.send(JSON.stringify({'Handling': 'ingame', 'action': 'move_down', 'user': this.users.username}));
        }
    }

    async loop() {
        console.log('loop', this.game_ws);
        const canvas = document.getElementById('pongCanvas');
        const context = canvas.getContext('2d');
        const countdownDiv = document.getElementById('countdown');
    
        countdownDiv.addEventListener('touchstart', (event) => this.handleTouchStart(event, canvas));
        
        // canvas.addEventListener('touchstart', (event) => this.handleTouchStart(event, canvas));
        // canvas.addEventListener('touchstart', this.handleTouchStart.bind(this, canvas));
        canvas.addEventListener('touchmove', (event) => this.handleTouchMove(event, canvas));
        // canvas.addEventListener('touchmove', this.handleTouchMove.bind(this, canvas));
        
        // canvas.addEventListener('mousemove', (event) => {
        //     const rect = canvas.getBoundingClientRect();
        //     const x = event.clientX - rect.left;
        //     const y = event.clientY - rect.top;
        //     this.game_ws.send(JSON.stringify({'Handling': 'ingame', 'action': 'mouse_move', 'x': x, 'y': y, 'user': this.users.username}));
        // });

        document.addEventListener('keydown', (event) => {
            this.keysPressed[event.key] = true;
            if (event.key === 'Enter' && !this.gamestarted) {
                this.gamestarted = true;
                console.log('sending ready', this.users.username, this.opponent);
                this.game_ws.send(JSON.stringify({'Handling': 'lobby', 'status': 'ready', 'username': this.users.username, 'opponent': this.opponent}));
            }
        });

        document.addEventListener('keyup', (event) => {
            this.keysPressed[event.key] = false;
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
            }
            if (data.paddle2_y !== undefined) {
                this.opponentPaddleY = data.paddle2_y;
            }
            if (data.score1 !== this.users.username) {
                document.getElementById("player1-score").innerHTML = this.users.username + ": " + data.score1;            }
            if (data.score2 !== this.opponent) {
                document.getElementById("player2-score").innerHTML = "AI: " + data.score2;            }
            if (data.hit !== undefined) {
                document.getElementById("hit").innerText = data.hit + data.angle;
            }
            this.winner_checker(data);
            this.update(canvas, context);
        };
    }

    getContent() {
        const cpuHTML = `
            <div id="scores">
                <div id="player1-score" class="score-info"></div>
                <div id="the-match"><h1>THE MATCH</h1></div>
                <div id="player2-score" class="score-info"></div>
            </div>
            <div id="countdown" data-translate="commands" class="countdown"> Command "W/S", ArrowUp and ArrowDown, Press Enter to Start the Game</div>
            <canvas id="pongCanvas" width="800" height="600" style="background-color: ${this.pong_color};"></canvas>
        `;
        return cpuHTML;
    }
}
