import AbstractView from "./AbstractView.js";

export async function getCSRFToken() {
	let csrftoken = await fetch("/csrf-token")
		.then(response => response.json())
		.then(data => data.csrfToken);
		// console.log(csrftoken);
	return csrftoken;
}


export async function getusename() {
    var csrftoken = await getCSRFToken()
    let username;
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
            username = data.username;
        })
        .catch((error) => {
            console.error('Error:', error);
        })
        return username;
}

export default class Info extends AbstractView {
    constructor(friend_name) {
        super();
        this.selfuser = "undefined";
        this.errro = false;
        this.friend_name = friend_name;
        this.username = "undefined";
        this.email = "undefined";
        this.pro_pic = "undefined";
        this.status = "undefined";
        this.is_friend = "none";
    }

    async loadData() {
		var csrftoken = await getCSRFToken()
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
				this.selfuser = data.username;
			})
			.catch((error) => {
				console.error('Error:', error);
			})
	}

    async getuserinfo(){
        var csrf = await getCSRFToken();
        return fetch('/accounts/guser_info/?username=' + this.friend_name, {
            method: 'GET',
            headers: {
                'Content-Type' : 'application/json',
                'X-CSRFToken': csrf
            }
    }).then(response => response.json())
    .then(data => {
        // console.log(data);
        this.username = data.user.username;
        this.email = data.user.email;
        this.pro_pic = data.user.pro_pic;
        this.status = data.user.status_login;
        this.is_friend = data.is_mutual_friend;
    })
    .catch((error) => {
        alert("No user found!");
        this.errro = true;
        console.error('Error:', error);
    })
    }

    async checkFriend(){
        /*** Devo aggiungere che se si visita il proprio utente allora da una somma totale
         * di richieste, magari anche la possibilità di cambiare i propri dati
         */
        console.log(this.selfuser);
        if (this.is_friend && this.username !== this.selfuser)
            return `<button id="RemoveFriend">Remove</button>`;
        else if (this.is_friend === false && this.username !== this.selfuser){

            var response = await fetch("friend/request/list/");
            var data = await response.json();
            console.log(data.length);
            for (var i = 0; i < data.length; i++) {
                var request = data[i];
                var senderUsername = request.sender.username;
                var receiverUsername = request.receiver.username;
                console.log(senderUsername, receiverUsername, this.username, this.selfuser);
                if (receiverUsername === this.username)
                    return `<h1>Friend Request Pending</h1>
                            <button id="Cancelrequest">Cancel</button>`;
                else if (senderUsername === this.username)
                {
                    return `<button id="Acceptrequest">Accept</button>
                            <button id="Declinerequest">Decline</button>`;
                }
            }
        }
        else if (this.username === this.selfuser){
            var response = await fetch("friend/request/list/");
            var data = await response.json();
            var pending = data.length;
            return `<h1>List of pending request or change info ${pending}</h1>`;
        }
        return `<button id="sendFriendRequestButton">Send Friend Request</button>`;
    }

    async updateRoomList(challenger, user) {
        let response = await fetch('/rooms_list/');
        let data = await response.json();
    
        let roomListHTML = '';
        console.log(this.selfuser, this.username, this.friend_name, "chllenge: ", challenger, "users :", user);
        // Iterate over the rooms
        for (let room of data) {
            // Check if the room name contains "<challenger> vs <user>"
            if (room.name.includes(`${challenger} vs ${user}`)) {
                // Add the room to the HTML string
               
                roomListHTML += `
                    <li class="roomItem">
                        <p class="room-name">
                            <a href="/pong/${room.name}">${"You have been challenged by " + challenger}</a>
                            <span class="delete-room">🗑</span>
                        </p>
                    </li>
                `;
            }
            else if (room.name.includes(`${user} vs ${challenger}`)){
                if (user === this.selfuser){
                    roomListHTML += `
                        <li class="roomItem">
                            <p class="room-name">
                                <a href="/pong/${room.name}">${"You challenged " + challenger}</a>
                                <span class="delete-room">🗑</span>
                            </p>
                        </li>
                    `;
                }
            }
        }
        return roomListHTML;
    }

    async game_Action() {
        let content = '';
        if (this.is_friend){

            content = await this.updateRoomList(this.username, this.selfuser);
            if (content.length > 2)
                return content;
            return '<button id="Play">invite to play</button>';
        }
        return content;
    }

    async getContent() {
        await this.loadData();
        await this.getuserinfo();
        if (this.errro)
            throw ("No user Found!");
        else{
            let friendAction = await this.checkFriend();
            let gameAction = await this.game_Action();
            return `
            <div class="single-card">
                <img src="${this.pro_pic}" alt="User pic">
                <h1>${this.username}</h1>
                <div class="friend-info">
                    <p>${this.status}</p>
                </div>
            </div>
            <div class="friendRequest">
                ${friendAction}
            </div>
            <div class="gameRequest">
                ${gameAction}
            </div>
            `;
        }
    }
}