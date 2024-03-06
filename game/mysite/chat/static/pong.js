const canvas = document.getElementById('pongCanvas');
const context = canvas.getContext('2d');

const WS_ENDPOINT = 'ws://127.0.0.1:8080/ws/game/';
let ws = new WebSocket(WS_ENDPOINT);

// Define constants for the game
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
const BALL_RADIUS = 5;

// Initialize paddle positions
let playerPaddleY = canvas.height / 2 - PADDLE_HEIGHT / 2;
let opponentPaddleY = canvas.height / 2 - PADDLE_HEIGHT / 2;
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;

// Track whether arrow keys are currently pressed
let arrowUpPressed = false;
let arrowDownPressed = false;

// Event listener for keydown events
document.addEventListener('keydown', function(event) {
    console.log('keydown', event.key);
    if (event.key === 'ArrowUp') {
        arrowUpPressed = true;
    } else if (event.key === 'ArrowDown') {
        arrowDownPressed = true;
    }
});

// Event listener for keyup events
document.addEventListener('keyup', function(event) {
    console.log('keyup', event.key);
    if (event.key === 'ArrowUp') {
        arrowUpPressed = false;
    } else if (event.key === 'ArrowDown') {
        arrowDownPressed = false;
    }
});

// Event listener for keydown events
// document.addEventListener('keydown', function(event) {
//     if (event.key === 'ArrowUp') {
//         // Send a message to the server indicating the user wants to move the paddle up
//         console.log('sending move_up');
//         ws.send(JSON.stringify({'action': 'move_up'}));
//     } else if (event.key === 'ArrowDown') {
//         // Send a message to the server indicating the user wants to move the paddle down
//         ws.send(JSON.stringify({'action': 'move_down'}));
//     }
//     else if (event.key === 'Enter') {
//         console.log('sending start_game');
//         // Send a message to the server indicating the user wants to start the game
//         ws.send(JSON.stringify({'action': 'start_game'}));
//     }
// });


// Function to update paddle position
function updatePaddlePosition() {
    console.log('updatePaddlePosition');
    if (arrowUpPressed) {
        console.log('sending move_up');
        ws.send(JSON.stringify({'action': 'move_up'}));
    }
    if (arrowDownPressed) {
        ws.send(JSON.stringify({'action': 'move_down'}));
    }
}

// Function to draw the paddles
function drawPaddles() {
    // Clear the previous frame
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw player paddle
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, playerPaddleY, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Draw opponent paddle
    context.fillRect(canvas.width - PADDLE_WIDTH, opponentPaddleY, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Draw the ball
    context.beginPath();
    context.arc(ballX, ballY, BALL_RADIUS, 0, Math.PI * 2);
    context.fillStyle = '#FFFFFF';
    context.fill();
    context.closePath();
}

// Event listener for incoming messages from the server
ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log(data);
    // console.log('received message');
    // Update the opponent's paddle position based on data received from the server
    if (data.opponent_paddle_y !== undefined) {
        opponentPaddleY = data.opponent_paddle_y;
    }
    if (data.ball_x !== undefined) {
        ballX = data.ball_x;
    }
    if (data.ball_y !== undefined) {
        ballY = data.ball_y;
    }
    if (data.paddle1_y !== undefined) {
        playerPaddleY = data.paddle1_y;
        // console.log('playerPaddleY', playerPaddleY);
    }
    if (data.score1 !== undefined) {
        document.getElementById("score1").innerHTML = "Score: " + data.score1;
    }
    if (data.score2 !== undefined) {
        document.getElementById("score2").innerHTML = "Score: " + data.score2;
    }
    // Redraw the paddles and ball
    drawPaddles();
    updatePaddlePosition();
};

// Initial drawing of the paddles and ball
drawPaddles();
