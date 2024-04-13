import AbstractView from "./AbstractView.js";

// export async function getCSRFToken() {
// 	let csrftoken = await fetch("csrf-token")
// 		.then(response => response.json())
// 		.then(data => data.csrfToken);
// 		console.log(csrftoken);
// 	return csrftoken;
// }

export function acceptFriendRequest(userId) {
    // Create a new XMLHttpRequest object
    var xhr = new XMLHttpRequest();
    
    // Set the request URL
    var url = "friend/accept/" + userId + "/";
    
    // Set the request method to GET
    xhr.open("GET", url, true);
    
    // Send the request
    xhr.send()
}

export async function declineFriendRequest(userId) {
    // Create a new XMLHttpRequest object
    var xhr = new XMLHttpRequest();
    
    // Set the request URL
    var url = "friend/request/decline/";
    
    // Set the request method to POST
    xhr.open("POST", url, true);

    // Set the request headers
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("X-CSRFToken", await getCSRFToken());

    // Set the request body
    var data = JSON.stringify({
        "receiver_user_id": userId
    });

    // Send the request
    xhr.send(data);
}


export async function removeFriend(user){
    // Get the username from the list of friend

    var friendUsername = user;
    console.log(friendUsername);
    // Create a new XMLHttpRequest object
    var xhr = new XMLHttpRequest();

    // Set the request URL
    var url = "friend/remove/";

    // Set the request method to POST
    xhr.open("POST", url, true);

    // Set the request headers
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("X-CSRFToken", await getCSRFToken());

    // Set the request body
    var data = JSON.stringify({
        "receiver_user_id": friendUsername
    });

    // Send the request
    xhr.send(data);
}


export async function cancelRequest(user){
    // Get the username from the list of friend
    // Create a new XMLHttpRequest object
    var xhr = new XMLHttpRequest();

    // Set the request URL
    var url = "friend/request/cancel/";

    // Set the request method to POST
    xhr.open("POST", url, true);

    // Set the request headers
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("X-CSRFToken", await getCSRFToken());

    // Set the request body
    var data = JSON.stringify({
        "receiver_user_id": user
    });

    // Send the request
    xhr.send(data);
}

export async function sendFriendRequest(user) {

		// Get the username from the input field
		var csrf = await getCSRFToken();
		// var username = document.getElementById("friendNameInput").value;
		// Create a new XMLHttpRequest object
		var xhr = new XMLHttpRequest();
        console.log(user)
		// Set the request URL
		var url = "/friend/request/send/";

		// Set the request method to POST
		xhr.open("POST", url, true);

		// Set the request headers
		xhr.setRequestHeader("Content-Type", "application/json");
		xhr.setRequestHeader("X-CSRFToken", csrf);

		// Set the request body
		var data = JSON.stringify({
			"receiver_user_id": user
		});

		// Send the request
        // ws.send(JSON.stringify({'notifications to ': user}));
	
        xhr.send(data);
}

export default class Friends extends AbstractView {
	constructor() {
		super();
		this.CurrentUsername;
        this.Userto;
        this.user;
		this.email;
        this.pro_pic;
	}

	getCSRFToken() { //fatta standalone, in teoria possiamo levarla da qua
		const cookieValue = document.cookie
		.split('; ')
		.find(row => row.startsWith('csrftoken='))
		.split('=')[1];
		return cookieValue;
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
				this.CurrentUsername = data.username;
			})
			.catch((error) => {
				console.error('Error:', error);
			})
	}

	sendFriendRequest() { // anche questa standalone possiamo anche levarla
		// Get the username from the input field
		var username = document.getElementById("username").value;

		// Create a new XMLHttpRequest object
		var xhr = new XMLHttpRequest();

		// Set the request URL
		var url = "/friend/request/send/";

		// Set the request method to POST
		xhr.open("POST", url, true);

		// Set the request headers
		xhr.setRequestHeader("Content-Type", "application/json");
		xhr.setRequestHeader("X-CSRFToken", this.getCSRFToken());

		// Set the request body
		var data = JSON.stringify({
			"receiver_user_id": username
		});

		// Send the request
		xhr.send(data);
	}

	acceptFriendRequest(userId) {
		// Create a new XMLHttpRequest object
		var xhr = new XMLHttpRequest();
		
		// Set the request URL
		var url = "accept/" + userId + "/";
		
		// Set the request method to GET
		xhr.open("GET", url, true);
		
		// Send the request
		xhr.send();
	}

    async getFriendList() {
        var response = await fetch("friend/list/");
        var data = await response.json();
        var friendListElement = document.getElementById("friends-list");
        friendListElement.innerHTML = "";
        friendListElement.className = "content";
        for (var i = 0; i < data.length; i++) {
            var friendList = data[i];
            var userUsername = friendList.user.username;            
            for (var j = 0; j < friendList.friends.length; j++) {
                console.log(friendList.friends[j]);
                var friendUsername = friendList.friends[j].username;
                var friendStatus = friendList.friends[j].status_login;
                var friendPic = friendList.friends[j].pro_pic;        
                var friendElement = document.createElement("div");
                friendElement.className = "card";
                var remove = document.createElement("button");
				remove.id = "Remove-friend";
                remove.innerHTML = "remove";
                remove.onclick = function() {
                    removeFriend(friendUsername);
                        };
                        friendElement.appendChild(remove);

                friendElement.innerHTML = `
                        <img src="${friendPic}" alt="User pic">
                        <div class="friend-info">
                            <p>${friendStatus}</p>
                        </div>
                `;
				var usernameLink = document.createElement("a");
                usernameLink.href = '/user_info';
                usernameLink.setAttribute('data-username', friendUsername);
                usernameLink.textContent = friendUsername;
                friendElement.querySelector(".friend-info").prepend(usernameLink);
				friendListElement.appendChild(friendElement);
			}
		}
	}

    async removeFriend(){
        // Get the username from the list of friend
        var friendElement = document.getElementById("friend-list").firstChild;
        var text = friendElement.textContent;
        var parts = text.split(", ");
        var friendUsername = parts[1].split(": ")[1];
        console.log(friendUsername);
        // Create a new XMLHttpRequest object
        var xhr = new XMLHttpRequest();

        // Set the request URL
        var url = "remove/";

        // Set the request method to POST
        xhr.open("POST", url, true);

        // Set the request headers
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("X-CSRFToken", this.getCSRFToken());

        // Set the request body
        var data = JSON.stringify({
            "receiver_user_id": friendUsername
        });

        // Send the request
        xhr.send(data);
    }

    async getPendingRequests() {
        var response = await fetch("friend/request/list/");
        var data = await response.json();
        var pendingRequestsElement = document.getElementById("pending-requests");
        pendingRequestsElement.innerHTML = "";
        
        for (var i = 0; i < data.length; i++) {
            var request = data[i];
            var senderUsername = request.sender.username;
            var receiverUsername = request.receiver.username;
            
            var requestElement = document.createElement("a");
            requestElement.href = '/user_info';
            if (receiverUsername == this.CurrentUsername){

                requestElement.setAttribute('data-username', senderUsername);
                requestElement.textContent = senderUsername;
            }
            else{
                requestElement.setAttribute('data-username', receiverUsername);
                requestElement.textContent = receiverUsername;
            }
                
             // Create a button to accept the request
            if (senderUsername !== this.CurrentUsername){
                var acceptButton = document.createElement("button");
                var declineButton = document.createElement("button");
                declineButton.innerHTML = "Decline";
                declineButton.id = "decline-request";
                declineButton.onclick = (function(senderUsername) {
                    return function(){
                        declineFriendRequest(senderUsername);
                    };
                })(senderUsername);
                        
                requestElement.appendChild(declineButton);
                acceptButton.innerHTML = "Accept";
                acceptButton.id = "Accept-request";
                acceptButton.onclick = (function(senderUsername) {
                    return function(){
                        acceptFriendRequest(senderUsername);
                    };
                })(senderUsername);
                        
                requestElement.appendChild(acceptButton);
            }
            else
            {
                var cancelButton = document.createElement("button");
                cancelButton.innerHTML = "Cancel";
                cancelButton.id = "cancel-request";
                cancelButton.onclick = (function(receiverUsername) {
                    return function(){
                        cancelRequest(receiverUsername);
                    };
                })(receiverUsername);
                console.log(receiverUsername);
                requestElement.appendChild(cancelButton);
                

            }
            pendingRequestsElement.appendChild(requestElement);
        }
    }

    getCookie(name) {
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

    async loadUserData() {
		var csrftoken = this.getCookie('csrftoken')
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
				this.setUser(data.username);
				this.setEmail(data.email);
				this.setPic(data.pro_pic); //new
			})
			.catch((error) => {
				console.error('Error:', error);
			})
	}

    async setPic(data_pic){ //new
		this.pro_pic = data_pic;
	}

	async setUser(data_user) {
		this.user = data_user;
	}
	
	async setEmail (data_email) {
		this.email = data_email;
	}

	async getUser() {
		return this.user;
	}

	async getEmail() {
		return this.email;
	}
	
	async getPic(){ //new
		return this.pro_pic;
	}

    async getNav() {
		const navHTML = `
			<a href="/local" name="local" class="dashboard-nav" data-link>Local Game</a>
			<a href="/online" name="online" class="dashboard-nav" data-link>Online Game</a>
			<a href="/ranking" name="ranking" class="dashboard-nav" data-link>Ranking</a>
			<a href="/friends" name="friends" class="dashboard-nav" data-link>Friends</a>
			<a href="/chat" name="chat" class="dashboard-nav" data-link>Chat</a>
			<a href="/dashboard" name="dashboard" class="profile-pic dashboard-nav" data-link><img alt="Profile picture" src="${await this.getPic()}"/></a>
		`;
		return navHTML;
	}

	async getContent() {
		const friendHTML = `
            <div class="dashboard">
                <div class="friends-card">
                    <h1>Friends List</h1>
                    <div class="input-box add-friend">
                        <input type="text" id="friendNameInput" required>
                        <label>Find User</label>
                        <ion-icon name="person-add-outline"></ion-icon>
                    </div>
                    <button type="submit" class="submit-btn dashboard-btn" id="friendBtn"><ion-icon name="paper-plane-outline"></ion-icon>Send Request</button>
                </div>
            </div>
		`;
		return friendHTML;
	}
}

//OLD FRIEND CARD
/*
<div id="friends-card" class="cards">
	<h2>Friends</h2>
	<br>
	<h3>Send Friend Request</h3>
	<form>
		<input type="text" id="friendNameInput" placeholder="Enter friend's username">
		<button id="friendBtn">🔍</button>
	</form>
	<br>
	<h3>Pending Requests</h3>
	<div id="pending-requests"></div>
	<br>
	<h3>Friends List</h3>
	<div id="friends-list"></div>
</div>
*/