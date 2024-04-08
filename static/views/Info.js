import AbstractView from "./AbstractView.js";
import { sendFriendRequest } from "./Friends.js"

export async function getCSRFToken() {
	let csrftoken = await fetch("csrf-token")
		.then(response => response.json())
		.then(data => data.csrfToken);
		console.log(csrftoken);
	return csrftoken;
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
            return `<h1>Remove Friend</h1>`;
        else if (this.is_friend === false && this.username !== this.selfuser){

            var response = await fetch("friend/request/list/");
            var data = await response.json();
            console.log(data.length);
            for (var i = 0; i < data.length; i++) {
                var request = data[i];
                var senderUsername = request.sender.username;
                var receiverUsername = request.receiver.username;
                console.log(senderUsername, receiverUsername, this.username);
                if (receiverUsername === this.username)
                    return `<h1>Friend Request Pending</h1>`;
                else if (receiverUsername === this.selfuser)
                    return `<h1>Accept Friend Request</h1>`;
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

    async getContent() {
        await this.loadData();
        await this.getuserinfo();
        if (this.errro)
            throw ("No user Found!");
        else{
            let friendAction = await this.checkFriend();
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
            `;
        }
    }
}