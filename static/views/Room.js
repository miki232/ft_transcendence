import AbstractView from "./AbstractView.js";
export async function user_name(){
	
	let users;
	let csrftoken = await fetch("csrf-token")
		.then(response => response.json())
		.then(data => data.csrfToken);
	return fetch('/accounts/user_info/', {
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
		return users;
	})
	.catch((error) => {
		console.error('Error:', error);
	});
}

export function getCookie(name) {
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

/**Genera una room con nome del player e dello sfidante */
export async function invite_to_play(user, challenger) {
	console.log("Create room button clicked");
	const roomName = user + ' vs ' + challenger;
	///Csrf_token
	let csrftoken = await fetch("csrf-token")
	.then(response => response.json())
	.then(data => data.csrfToken);
	console.log(csrftoken);
	///
	//user_name 
	// let users =  await user_name();
	// console.log(users);
	// var csrftoken = getCookie('csrftoken');
	if (roomName === '') {
		alert('Please enter a room name');
		return;
	}
	// Send a POST request to create the room
	await fetch('/rooms/create/', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-CSRFToken': csrftoken
		},
		body: JSON.stringify({ name: roomName, created_by: user }),
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

export default class Room extends AbstractView {
	constructor() {
		super();
		this.roomNameInput = document.getElementById("roomNameInput");
		this.createRoomBtn = document.getElementById("createRoomBtn");
		this.roomList = document.getElementById("roomList");
	}
	// Ora le room per essere create hanno bisogno per forza di Room_name, user_name(di chi la sta creando)
	/// opzionale se è pubblica o privata. Per ora ho aggiunto una funzione per prendere l'username di chi è loggato.
	// ma magari si può fare meglio, Da sistemare anche il csrf-token
	async btnCreateRoom() {
		console.log("Create room button clicked");
		const roomName = roomNameInput.value.trim();
		///Csrf_token
		let csrftoken = await fetch("csrf-token")
		.then(response => response.json())
		.then(data => data.csrfToken);
		console.log(csrftoken);
		///
		//user_name 
		let users =  await user_name();
		console.log(users);
		// var csrftoken = getCookie('csrftoken');
		if (roomName === '') {
			alert('Please enter a room name');
			return;
		}
		// Send a POST request to create the room
		await fetch('/rooms/create/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CSRFToken': csrftoken
			},
			body: JSON.stringify({ name: roomName, created_by: users }),
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
		await fetch('/rooms_list/')
		.then(response => response.json())
		.then(data => {
			// Clear the current list
			let publicroom = document.getElementById("publicroomList");
			roomList.innerHTML = '';	
			publicroom.innerHTML = '';
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
				if (room.public)
					publicroom.appendChild(roomItem);
				else
					roomList.appendChild(roomItem);
			});
		});
	}

	async getContent() {
		const roomHtml = `
			<div id="room-card" class="cards">
				<h2>Create or Join a Room</h2>
				<input type="text" id="roomNameInput" placeholder="Enter room name">
				<button id="createRoomBtn"">Create Room</button>
				<h3>Available Rooms</h3>
				<ul id="roomList"></ul>
				<h3>Available Public Rooms</h3>
				<ul id="publicroomList"></ul>
			</div>
		`;
		
		return roomHtml;
	}
}