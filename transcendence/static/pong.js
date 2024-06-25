const canvas = document.getElementById('pongCanvas');
const context = canvas.getContext('2d');

let users;
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}


let csrftoken = getCookie('csrftoken')
fetch('/accounts/user_info/', {
	method: 'GET',
	headers: {
		'Content-Type' : 'application/json',
		'X-CSRFToken': csrftoken
	}
})
	.then(response => response.json())
	.then(data => {
        users = data.username;
		console.log(users);
	})
	.catch((error) => {
		console.error('Error:', error);
	});

    // Get the current URL path
let path = window.location.pathname;

// Split the path into segments
let segments = path.split('/');

// Get the room name from the path
// Assuming the room name is the second last segment in the path
let roomName = segments[segments.length - 2];
// const roomName = JSON.parse(document.getElementById('room-name').textContent);
console.log("user", users, "room name ", roomName);
let ws = new WebSocket(
    'wss://'
    + window.location.hostname
    + ':8000'
    + '/ws/pong/'
    + roomName
    + '/'
);

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

canvas.addEventListener('touchstart', handleTouchStart, false);
canvas.addEventListener('touchend', handleTouchEnd, false); 

function handleTouchStart(event) {
    event.preventDefault();
        var touchY = event.touches[0].clientY;
        var canvasOffsetTop = canvas.getBoundingClientRect().top;
    
    // Subtract the offset to get the relative touchY position
        touchY -= canvasOffsetTop;
        console.log(touchY)
    // Determine if the touch event is above or below the paddle
        if (touchY < playerPaddleY + PADDLE_HEIGHT / 2) {
            // Move the paddle up
            arrowUpPressed = true;
        } else {
            // Move the paddle down
            arrowDownPressed = true;
        }
    }

        // Function to handle touch end event
function handleTouchEnd(event) {
    event.preventDefault();
    // Reset arrow key states
    arrowUpPressed = false;
    arrowDownPressed = false;
}
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
    if (arrowUpPressed) {
        // console.log('sending move_up');
        ws.send(JSON.stringify({'action': 'move_up', 'user': users}));
    }
    if (arrowDownPressed) {
        ws.send(JSON.stringify({'action': 'move_down', 'user': users}));
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
    console.log(data.ball_speed_x)
    // Update the opponent's paddle position based on data received from the server
    if (data.paddle2_y !== undefined) {
        opponentPaddleY = data.paddle2_y;
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
        if (data.player === users)
            document.getElementById("score1").innerHTML = "Your Score: " + data.score1;
        else
            document.getElementById("score1").innerHTML = "Not your Score: " + data.score1;
    }
    if (data.score2 !== undefined) {
        if (data.player !== users)
            document.getElementById("score2").innerHTML = "Your Score: " + data.score2;
        else
            document.getElementById("score2").innerHTML = "Not your Score: " + data.score2;
    }
    if (data.victory != "none"){
        console.log(data.victory);
        if (users === data.victory)
            alert("YOU WIN!" + users)
        else
            alert("AHAHAH hai PERSO")
    }
    // Redraw the paddles and ball
    drawPaddles();
    updatePaddlePosition();
};

// Initial drawing of the paddles and ball
drawPaddles();