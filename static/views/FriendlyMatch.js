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
		this.nav = document.querySelector("nav");
		this.nav.innerHTML = this.getNav();
		this.content.innerHTML = this.getContent();
        this.roomName = "undefined";
        this.initialize();
    }

    async initialize() {
        await this.getFriendlyMatchList();
    }

    async getFriendlyMatchList() {
        try {
            const response = await fetch('/rooms_list/');
            const rooms = await response.json();
    
            const roomsElement = document.querySelector(".requests");
            
            rooms.forEach(room => {
                const roomView = `
                    <div class="request-line">
                        <span class="info" data-username="${room.created_by}">${room.created_by} vs </span>
                        
                        <span class="info" data-username="${room.opponent}">${room.opponent}</span>
                        <button type="button" class="submit-btn accept-request" data-room-name="${room.name}"><ion-icon name="checkmark-outline"></ion-icon>Join</button>
                    </div>
                `;
                roomsElement.innerHTML += roomView;
                // Add event listeners to your buttons here
            });
            const joinButtons = document.querySelectorAll(".accept-request");
            joinButtons.forEach(button => {
                button.addEventListener("click", async (event) => {
                    const roomName = event.target.getAttribute('data-room-name');
                    console.log('Joining room:', roomName);
                    this.roomName = roomName;
                    console.log("ROOM NAME", this.roomName);
                    this.user.online_room = this.roomName;
                    history.replaceState(null, null, "/pong");
                    this.user.lastURL = "/pong";
                    const view = new Pong(this.user);
                    await view.connect_game();
                    await view.loop();
                });
            });
            const lang = localStorage.getItem('language') || 'en';
            changeLanguage(lang);
        } catch (error) {
            console.error('Failed to fetch rooms list:', error);
        }
    }

    getNav() {
        const navHTML = `
			<a href="/local_game" data-translate="local" name="local" class="dashboard-nav" data-link>Local Game</a>
			<a href="/online" data-translate="online" name="online" class="dashboard-nav" data-link>Online Game</a>
			<a href="/ranking" data-translate="ranking" name="ranking" class="dashboard-nav" data-link>Ranking</a>
			<a href="/friends" data-translate="friends" name="friends" class="dashboard-nav" data-link>Friends</a>
			<a href="/chat" name="chat" class="dashboard-nav" data-link>Chat</a>
			<a href="/dashboard" name="dashboard" class="profile-pic dashboard-nav" data-link><img alt="Profile picture" src="${this.user.pro_pic}"/></a>
		`;
		return navHTML;
    }

    getContent() {
        const FriendlyMatch = `
			<div class="dashboard">
				<div class="requests">
                <h1>Friend Match</h1>
				</div>
			</div>
		`;
		return FriendlyMatch;
    }
}