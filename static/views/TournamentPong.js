import AbstractView from "./AbstractView.js";
import { navigateTo } from "../index.js";
import Tournament from "./Tournament.js";
import { createNotification } from "./Notifications.js";

export default class Pong extends AbstractView{
    constructor(user, room_name){
        super();
        this.user =  user;
        this.user_paddle_color1;
        this.user_paddle_color2;
        this.pong_color = user.pong_color;
        this.tempcolor;
        this.room_name = room_name;
        this.opponent = this.user.tournament_opp.username;
        this.player1 = undefined;
        this.player2 = undefined;
        this.player1_pic = undefined;
        this.player2_pic = undefined;
        this.score1;
        this.score2;
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
        this.game_ws = "null";
        this.initialize();

    }

    async initialize() {
        
        document.querySelector('header').style.display = 'none';
        document.querySelector('body').classList.add('game-bg');

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
			.then(async data => {
				await this.setUser(data.username);
			})
			.catch((error) => {
				console.error('Error:', error);
			})
	}

	async setUser(data_user) {
		this.users = data_user;
	}


    async connect_game(){
        this.game_ws = new WebSocket(
            'wss://'
            + window.location.hostname
            + ':8000'
            + '/ws/tournament/'
            + this.room_name
            + '/'
        );
        this.user.ws_tournament = this.game_ws;
    }

    async closeWebSocket() {
        if (this.game_ws) {
            //FAcciamo che una volta assegnato l'utente sfidante e la room, c'è un conto alla rovescia, e finchè
            // non finisce, stiamo connessi alla socket e se uno dei 2 esce prima dello scadere del conto alla rovescia
            // chiude la connesione e maagari elimina la room o elimina il suo username dal campo della room 
            await this.game_ws.close();
            console.log("DISCONNECTED FROM WEBSOCKET PONG");
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
        // this.updatePaddlePosition();
        // // Clear the previous frame
        // context.clearRect(0, 0, canvas.width, canvas.height);

        // // Draw player paddle
        // context.fillStyle = '#FFFFFF';
        // context.fillRect(0,  this.playerPaddleY, this.paddle_width, this.paddle_height);

        // // Draw opponent paddle
        // context.fillRect(canvas.width - this.paddle_width, this.opponentPaddleY, this.paddle_width, this.paddle_height);

        // context.beginPath();
        // context.arc(this.ballX, this.ballY, 5, 0, Math.PI * 2);
        // context.fillStyle = '#FFFFFF';
        // context.fill();
        // context.closePath();
    }

    async scoreTabMaker(data) {
        console.log(data, this.user.username, this.user.tournament_opp.username);
        if (data.player === this.user.username) {
            if (this.user.alias !== "None"){
                this.player1 = this.user.alias;
            }
            else
                this.player1 = this.user.username;
            if (this.user.tournament_opp.alias !== null){
                this.player2 = this.user.tournament_opp.alias;
            }
            else
                this.player2 = this.user.tournament_opp.username;
            await this.loadOpponentPaddle(this.user.tournament_opp.username);
            console.log("this.tempcolor", this.tempcolor)
            this.user_paddle_color1 = this.user.paddle_color;
            this.user_paddle_color2 = this.tempcolor
            this.player1_pic = this.user.getPic();
            this.player2_pic = this.user.tournament_opp.pro_pic;
        } else {
            if (this.user.tournament_opp.alias !== null){
                this.player1 = this.user.tournament_opp.alias;
            }
            else
                this.player1 = this.user.tournament_opp.username;
            if (this.user.alias !== "None"){
                this.player2 = this.user.alias;
            }
            else
                this.player2 = this.user.username;
            await this.loadOpponentPaddle(this.user.tournament_opp.username);
            this.user_paddle_color1 = this.tempcolor
            this.user_paddle_color2 = this.user.paddle_color;
            this.player1_pic = this.user.tournament_opp.pro_pic;
            this.player2_pic = this.user.getPic();
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

    updatePaddlePosition() {
        if (this.arrowUpPressed) {
            // console.log('sending move_up');
            this.game_ws.send(JSON.stringify({'action': 'move_up', 'user': this.users}));
        }
        if (this.arrowDownPressed) {
            this.game_ws.send(JSON.stringify({'action': 'move_down', 'user': this.users}));
        }
    }

    async loop(){
        const canvas = document.getElementById('pongCanvas');
        const context = canvas.getContext('2d');
        document.addEventListener('keydown', (event) => {
            console.log('keydown', event.key);
            if (event.key === 'ArrowUp') {
                this.arrowUpPressed = true;
                // console.log('sending move_up', this.arrowUpPressed);
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
        this.game_ws.onmessage = async event => {
            const data = JSON.parse(event.data);
            if (data.player !== undefined && this.player1 === undefined) {
                this.scoreTabMaker(data);
            }
            // this.scoreTabMaker(data);
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
            if (data.victory != "none"){
                console.log(data.victory, this.user.username);
                if (this.user.username === data.victory){
                    console.log("HAI VINTO");
                    const content = document.querySelector("#content");
                    let win = await this.getround();
                    await this.closeWebSocket();
                    if (win){
                        this.user.round = [];
                        content.innerHTML = `<h1 style="color: gold;">YOU WON</h1>`;                        
                        setTimeout(() => {
                            this.user.disconnected = false;
                            document.querySelector("header").style.display = "block";
                            document.querySelector("body").classList.remove("game-bg");
                            navigateTo("/online");
                        }, 3000);
                        return;
                    }
                    this.user.matchmaking_ws = new WebSocket(
                        'wss://'
                        + window.location.hostname
                        + ':8000'
                        + '/ws/matchmaking/'
                        )
                    this.user.matchmaking_ws.onopen = async () => {
                        const view = new Tournament(this.user, this.user.matchmaking_ws);
                        // content.innerHTML =  view.getContent();
                        let newContent = view.getContent();
                        content.innerHTML = newContent;
                        await view.sendJoin(); 
                        view.displayTournamentChart();
                        let room = await view.getRoomcallbackmatch();
                        console.log("JOINING TOURNAMENT");
                        console.log("JOINING TOURNAMENT", room);
                        // this.room_name = room;
                        // content.innerHTML =  await this.getContent();
                        // let newCanvas = await this.getContent();
                        // let oldCanvas = document.getElementById('pongCanvas');
                        // oldCanvas.parentNode.replaceChild(newCanvas, oldCanvas);
                        // content.innerHTML =  await this.getContent();
                        // await this.loop();
                    };
                    // const view = new Tournament(this.users, ws);
                    // content.innerHTML =  view.getContent();
                    // await view.sendJoin(); 
                    // console.log("JOINING TOURNAMENT");
                    // room = await view.getRoom();
                    // console.log("JOINING TOURNAMENT", room);
                }
                else
                {
                    // alert("AHAHAH hai PERSO")
                    createNotification("YOU LOST!", "youlost");
                    this.user.round = [];
                    await this.closeWebSocket();
                    setTimeout(() => {
                        this.user.disconnected = false;
                        document.querySelector("header").style.display = "block";
                        document.querySelector("body").classList.remove("game-bg");
                        navigateTo("/online");
                    }, 3000);
                }
            }

            await this.update(canvas, context);
        }
    }

    async getround(){
		var csrftoken = await this.getCSRFToken()
        let win = false;
        await fetch('/round/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
				'X-CSRFToken': csrftoken
            },
        })
        .then(response => response.json())
        .then(data => {
            console.log("ROUND", data);
            if (data.round === 1){
                win = true;
            }
            else{
                win = false;
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });
        return win;
    }

    async getContent() {
        await this.loadUserData();
        await this.connect_game();
        console.log("Pong Color: ", this.pong_color);
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