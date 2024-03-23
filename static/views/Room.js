import AbstractView from "./AbstractView.js";

const roomHtml = `
<div id="room-card" class="cards">
	<h2>Create or Join a Room</h2>
	<input type="text" id="roomNameInput" placeholder="Enter room name">
	<button id="createRoomBtn"">Create Room</button>
	<h3>Available Rooms</h3>
	<ul id="roomList"></ul>
</div>
`;

export default class Room extends AbstractView {
	constructor() {
		super();
		this.roomNameInput = document.getElementById("roomNameInput");
		this.createRoomBtn = document.getElementById("createRoomBtn");
		this.roomList = document.getElementById("roomList");
	}

	async btnCreateRoom() {
		const roomName = roomNameInput.value.trim();
		var csrftoken = this.getCookie('csrftoken');
		if (roomName === '') {
			alert('Please enter a room name');
			return;
		}

		// Send a POST request to create the room
		await fetch('http://127.0.0.1:8000/rooms/create/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': csrftoken
			},
			body: JSON.stringify({ name: roomName }),
		  })
		  .then(response => {
			if (!response.ok){
			  return response.json().then(error => {
				throw error;
			  });
			}
			this.updateRoomList();
			return response.json;
		  })
		  .then(data => {
			if (data.error) {
				alert(data.error);
			} else {
				// Clear input
				roomNameInput.value = '';
			}
		})
		.catch((error) => {
			alert(error.name[0]);
			console.log('Error:', error);
		});
	}

	async updateRoomList() {
		await fetch('http://127.0.0.1:8000/rooms_list/')
		.then(response => response.json())
		.then(data => {
			// Clear the current list
			roomList.innerHTML = '';
	
			// Append each room to the list
			data.forEach(room => {
				let roomItem = document.createElement('li');
				roomItem.classList.add('roomItem');
				let roomName = document.createElement('p');
				roomName.setAttribute('class', 'room-name');
				let deleteRoom = document.createElement('span');
				deleteRoom.setAttribute('class', 'delete-room');
				roomName.textContent = room.name;
				deleteRoom.textContent = '🗑';
				// roomItem.textContent = room.name;
				roomItem.appendChild(roomName);
				roomName.appendChild(deleteRoom);
	
				// Add click event to join the room
				roomItem.addEventListener('click', function() {
					window.location.href = '/pong/' + encodeURIComponent(room.name) + '/';
				});
	
				// Append room to the list
				roomList.appendChild(roomItem);
			});
		});
	}

	async getContent() {
		return roomHtml;
	}
}