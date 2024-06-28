import AbstractView from "./AbstractView.js";
import { getCSRFToken } from "./Info.js";
import { createNotification } from "./Notifications.js";
import { changeLanguage, navigateTo } from "../index.js";
import Pong from "./Pong.js";

export default class FriendlyMatch extends AbstractView {
    constructor(user) {
        super();
        this.user = user;
        this.content = document.querySelector("#content");
		this.nav = document.querySelector("header");
		this.nav.innerHTML = this.getNav();
		this.content.innerHTML = this.getContent();
        this.roomName = "undefined";
        this.opponent = "undefined";
        this.initialize();
    }

    async initialize() {
        await this.getFriendlyMatchList();
    }

    async setOpponent(opponent)
    {
        this.opponent = opponent;
    }

    async getFriendInfo(user) {
        var csrftoken = this.getCSRFToken();
		await fetch('/accounts/guser_info/?username=' + user, {
            method: 'GET',
			headers: {
                'Content-Type' : 'application/json',
				'X-CSRFToken': csrftoken
			}
		}).then(response => response.json())
        .then(data => {
            console.log(data.user);
            this.user.online_opponent.username = data.user.username;
            this.user.online_opponent.pro_pic = data.user.pro_pic;
            this.user.online_opponent.level = data.user.level;
            // this.setOpponent_pic(data.pro_pic)
        })
        .catch((error) => {
            console.error('Error:', error);
        })
    }

    async cancelroom(name) {
        var csrftoken = await getCSRFToken();
        await fetch('/delete_room/', {
            method: 'POST',
            headers: {
                'Content-Type' : 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({name: name})
        }).then(response => response.json())
        .then(data => {
            console.log(data);
        })
        .catch((error) => {
            console.error('Error:', error);
        })
    }

    async getFriendlyMatchList() {
        try {
            const response = await fetch('/rooms_list/');
            const rooms = await response.json();
    
            const roomsElement = document.querySelector(".friendlymatch");
            const rommsHTML = `
                <h2 data-translate="friendly">Friendly Match</h2>
                <div class="rooms-list"></div>
                <div class="hr" style="width: 75%; margin: 15px 0 20px 0;"></div>
			    <button type="button" class="submit-btn dashboard-btn" data-translate="back" id="back"><ion-icon name="chevron-back-outline"></ion-icon>Back</button>
            `;
            roomsElement.innerHTML = rommsHTML;
            const backBtn = document.getElementById("back");
			backBtn.addEventListener("click", e => {
				e.preventDefault();
				navigateTo("/online");
			});
            const roomsList = document.querySelector(".rooms-list");
            const noEntries = document.createElement("span");
		    noEntries.className = "no-entries";
		    noEntries.textContent = "No invites";
            noEntries.setAttribute("data-translate", "noInvites");
            roomsList.appendChild(noEntries);
            rooms.forEach(room => {
                console.log(room);
                noEntries.remove();
                const roomView = `
                    <div class="match-line">
                        <div class="room-info">
                            <img src="${room.pro_pic_created_by}"/>
                            <p class="info" data-username="${room.created_by}">${room.created_by}</p>
					    </div>
                        <div class="vs-text"><span>VS</span></div>
                        <div class="room-info">
                            <img src="${room.pro_pic_opponent}"/>
                            <p class="info" data-username2="${room.opponent}">${room.opponent}</p>
                        </div>
                        <div class="room-btns">
                            <button type="button" class="submit-btn accept-request" data-translate="play" data-room-name="${room.name}" data-username="${room.created_by}" data-username2="${room.opponent}"><ion-icon name="checkmark-outline"></ion-icon>Join</button>
                            <button type="button" class="submit-btn red-btn cancel-request" data-translate="decline" data-room-name="${room.name}"><ion-icon name="close-outline"></ion-icon>${room.created_by === this.user.username ? "Cancel" : "Decline"}</button>
                        </div>
                    </div>
                `;
                roomsList.innerHTML += roomView;
                // Add event listeners to your buttons here
            });
            const joinButtons = document.querySelectorAll(".accept-request");
            joinButtons.forEach(button => {
                button.addEventListener("click", async (event) => {
                    const roomName = event.target.getAttribute('data-room-name');
                    const createby = event.target.getAttribute('data-username');
                    const opponent = event.target.getAttribute('data-username2');
                    console.log('Joining room:', roomName, createby, opponent);
                    if (this.user.username === createby) {
                        this.setOpponent(opponent);
                    }
                    else {
                        this.setOpponent(createby);
                    }
                    await this.getFriendInfo(this.opponent)
                    this.roomName = roomName;
                    console.log("ROOM NAME", this.roomName);
                    this.user.online_room = this.roomName;
                    console.log("USER ROOM", this.user.online_room);
                    history.replaceState(null, null, "/pong");
                    this.user.lastURL = "/pong";
                    const view = new Pong(this.user);
                    await view.connect_game();
                    await view.loop();
                });
            });
            const cancelButtons = document.querySelectorAll(".cancel-request");
            cancelButtons.forEach(button => {
                button.addEventListener("click", async (event) => {
                    const roomName = event.target.getAttribute('data-room-name');
                    console.log('Cancelling room:', roomName);
                    await this.cancelroom(roomName);
                    navigateTo("/friendly_match");
                });
            });
            changeLanguage(this.user.language);
        } catch (error) {
            console.error('Failed to fetch rooms list:', error);
        }
    }

    getNav() {
        const navHTML = `
			<nav class="navbar navbar-expand-lg bg-body-tertiary">
			  <div class="container-fluid">
				<a href="/dashboard" id="logo" class="nav-brand" aria-current="page" data-link>
					<img src="/static/img/Logo.png" alt="Logo" class="logo"/>
				</a>
				<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
					<span class="navbar-toggler-icon"><ion-icon name="menu-outline" class="toggler-icon"></ion-icon></span>
				</button>
				<div class="collapse navbar-collapse" id="navbarNavDropdown">
				  <ul class="navbar-nav">
					<li class="nav-item">
					  <a class="nav-link" href="/local_game" data-translate="local" data-link>Local Game</a>
					</li>
					<li class="nav-item">
					  <a class="nav-link" href="/online" data-translate="online" data-link>Online Game</a>
					</li>
					<li class="nav-item">
					  <a class="nav-link" href="/static/cli/cli.zip">CLI</a>
					</li>
					<li class="nav-item">
					  <a class="nav-link" href="/friends" data-translate="friends" data-link>Friends</a>
					</li>
					<li class="nav-item">
					  <a class="nav-link" href="/chat" data-link>Chat</a>
					</li>
					<li class="nav-item">
					  <a class="nav-link" href="/dashboard" data-link>Dashboard</a>
					</li>
				  </ul>
				</div>
			  </div>
			</nav>
		`;
		return navHTML;
    }

    getContent() {
        const FriendlyMatch = `
			<div class="dashboard">
				<div class="friendlymatch"></div>
			</div>
		`;
		return FriendlyMatch;
    }
}