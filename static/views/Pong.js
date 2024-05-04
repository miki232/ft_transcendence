export default class Pong{
    constructor(room_name){
        this.room_name = room_name;
        this.game_ws = "null";
        this.ballX = 0;
        this.ballY = 0;
    }

    async connect_game(){
        this.game_ws = new WebSocket(
            'wss://'
            + window.location.hostname
            + ':8000'
            + '/ws/pong/'
            + this.room_name
            + '/'
        );
    }

    update(canvas, context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        context.beginPath();
        context.arc(this.ballX, this.ballY, 5, 0, Math.PI * 2);
        context.fillStyle = '#FFFFFF';
        context.fill();
        context.closePath();
    }

    async loop(){
        const canvas = document.getElementById('pongCanvas');
        const context = canvas.getContext('2d');
        this.update(canvas, context);
        this.game_ws.onmessage = async event => {
            const data = JSON.parse(event.data);
            if (data.ball_x !== undefined) {
                this.ballX = data.ball_x;
            }
            if (data.ball_y !== undefined) {
                this.ballY = data.ball_y;
            }
            this.update(canvas, context);
        }
    }

    async getContent() {
        await this.connect_game();
        // this.ws.onmessage = function(event){
        //     const data = JSON.parse(event.data);
        //     console.log(data);
        // };
        return  `
            <div class="container">
            <div class="game-area">
                <canvas id="pongCanvas" width="800" height="600"></canvas>
            </div>
        </div>
        `;
    }
}