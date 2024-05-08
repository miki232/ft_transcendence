import { getCSRFToken } from "./Info.js";
import { createNotification } from "./Notifications.js";
import AbstractView from "./AbstractView.js";
import { navigateTo } from "../index.js";

// export async function getCSRFToken() {
// 	let csrftoken = await fetch("csrf-token")
// 		.then(response => response.json())
// 		.then(data => data.csrfToken);
// 		console.log(csrftoken);
// 	return csrftoken;
// }

export default class Settings extends AbstractView {
	constructor(user) {
		super();
		this.user = user;
		this.content = document.querySelector("#content");
		this.nav = document.querySelector("nav");
		this.nav.innerHTML = this.getNav();
		this.content.innerHTML = this.getContent();
		this.activeBtn();
	}

	async changeUsername() {
		const changePicBtn = document.getElementById("change-pic");
		changePicBtn.style.display = "none";
		const changePasswordBtn = document.getElementById("change-password");
		changePasswordBtn.style.display = "none";
		const deleteAccountBtn = document.getElementById("delete-account");
		deleteAccountBtn.style.display = "none";
		const changeBtn = document.getElementById("change-username");
		changeBtn.setAttribute("disabled", "true");
		const changeUsernameHTML = `
			<div class="input-box">
				<input type="text" placeholder="New Username">
				<ion-icon name="person-outline"></ion-icon>
				</div>
				<button type="button" class="submit-btn dashboard-btn confirm-btn"><ion-icon name="checkmark-outline"></ion-icon>Accept modify</button>
				<button type="button" class="submit-btn dashboard-btn red-btn"><ion-icon name="close-outline"></ion-icon>Cancel</button>
		`;
		changeBtn.insertAdjacentHTML("afterend", changeUsernameHTML);
		const confirmBtn = document.querySelector(".confirm-btn");
		confirmBtn.addEventListener("click", async e => {
			e.preventDefault();
			const newUsername = document.querySelector(".input-box input").value;
			if (newUsername === "") {
				createNotification("Username cannot be empty!");
				return;
			}
			const csrf = await getCSRFToken();
			await fetch('/accounts/user_info/', {
				method: 'PUT',
				headers: {
					'Content-Type' : 'application/json',
					'X-CSRFToken': csrf
				},
				body: JSON.stringify({
					username : newUsername,
				})
			});
			await this.user.loadUserData();
			navigateTo("/settings");
		});
		const cancelBtn = document.querySelector(".red-btn");
		cancelBtn.addEventListener("click", e => {
			e.preventDefault();
			navigateTo("/settings");
		});
	}

	activeBtn() {
		const backBtn = document.getElementById("back");
		backBtn.addEventListener("click", e => {
			e.preventDefault();
			navigateTo("/dashboard");
		});
		const changeUsernameBtn = document.getElementById("change-username");
		changeUsernameBtn.addEventListener("click", () => {
			this.changeUsername();
		});
	}

	getNav() {
		const navHTML = `
			<a href="/local" name="local" class="dashboard-nav" data-link>Local Game</a>
			<a href="/online" name="online" class="dashboard-nav" data-link>Online Game</a>
			<a href="/ranking" name="ranking" class="dashboard-nav" data-link>Ranking</a>
			<a href="/friends" name="friends" class="dashboard-nav" data-link>Friends</a>
			<a href="/chat" name="chat" class="dashboard-nav" data-link>Chat</a>
			<a href="/dashboard" name="dashboard" class="profile-pic dashboard-nav" data-link><img alt="Profile picture" src="${this.user.getPic()}"/></a>
		`;
		return navHTML;
	}

	getContent() {
		const user_infoHTML = `
			<div class="dashboard">
				<div class="settings">
					<h1>Settings</h1>
					<div class="user-data">
						<img alt="Profile picture" src="${this.user.getPic()}"/>
						<h3>${this.user.getUser()}</h3>
					</div>
					<button type="button" class="submit-btn dashboard-btn" id="change-pic"><ion-icon name="image-outline"></ion-icon>Upload Avatar Image</button>
					<button type="button" class="submit-btn dashboard-btn" id="change-username"><ion-icon name="person-outline"></ion-icon>Change Username</button>
					<button type="button" class="submit-btn dashboard-btn" id="change-password"><ion-icon name="key-outline"></ion-icon>Change Password</button>
					<button type="button" class="submit-btn dashboard-btn red-btn" id="delete-account"><ion-icon name="trash-outline"></ion-icon>Delete Account</button>
					<div class="hr" style="width: 75%; margin: 15px 0 20px 0;"></div>
					<button type="button" class="submit-btn dashboard-btn" id="back"><ion-icon name="chevron-back-outline"></ion-icon>Back</button>
				</div>
			</div>
		`;
		return user_infoHTML;
	}
}