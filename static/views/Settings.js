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
		const changePasswordBtn = document.getElementById("change-password");
		const deleteAccountBtn = document.getElementById("delete-account");
		const changeUsernameBtn = document.getElementById("change-username");
		changePicBtn.style.display = "none";
		changePasswordBtn.style.display = "none";
		deleteAccountBtn.style.display = "none";
		changeUsernameBtn.setAttribute("disabled", "true");
		const changePasswordHTML = `
			<div class="input-box change">
				<input type="text" placeholder="New Username">
				<ion-icon name="person-outline"></ion-icon>
			</div>
			<div class="change-btn change">
				<button type="button" class="submit-btn dashboard-btn confirm-btn"><ion-icon name="checkmark-outline"></ion-icon>Accept modify</button>
				<button type="button" class="submit-btn dashboard-btn red-btn"><ion-icon name="close-outline"></ion-icon>Cancel</button>
			</div>
		`;
		changeUsernameBtn.insertAdjacentHTML("afterend", changePasswordHTML);
		const change_all = document.querySelectorAll(".change");
		const confirmBtn = document.querySelector(".confirm-btn");
		confirmBtn.addEventListener("click", async e => {
			e.preventDefault();
			const input = document.querySelector(".input-box input");
			const newUsername = input.value;
			if (newUsername === "") {
				createNotification("Username cannot be empty!");
				return;
			}
			if (newUsername === this.user.getUser()) {
				createNotification("Username can't be the same as the old");
				input.value = "";
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
			changeUsernameBtn.removeAttribute("disabled");
			change_all.forEach(e => {
				e.remove();
			});
			changePicBtn.style.display = "block";
			changePasswordBtn.style.display = "block";
			deleteAccountBtn.style.display = "block";
		});
	}

	async changePassword() {
		const changePicBtn = document.getElementById("change-pic");
		const changeUsernameBtn = document.getElementById("change-username");
		const deleteAccountBtn = document.getElementById("delete-account");
		const changePasswordBtn = document.getElementById("change-password");
		changePicBtn.style.display = "none";
		changeUsernameBtn.style.display = "none";
		deleteAccountBtn.style.display = "none";
		changePasswordBtn.setAttribute("disabled", "true");
		const changePasswordHTML = `
			<div class="input-box change">
				<input type="password" placeholder="New Password" id="new-password">
				<ion-icon name="lock-closed-outline"></ion-icon>
			</div>
			<div class="input-box change">
				<input type="password" placeholder="Confirm Password" id="confirm-password">
				<ion-icon name="lock-closed-outline"></ion-icon>
			</div>
			<div class="change-btn change">
				<button type="button" class="submit-btn dashboard-btn confirm-btn"><ion-icon name="checkmark-outline"></ion-icon>Accept modify</button>
				<button type="button" class="submit-btn dashboard-btn red-btn"><ion-icon name="close-outline"></ion-icon>Cancel</button>
			</div>
		`;
		changePasswordBtn.insertAdjacentHTML("afterend", changePasswordHTML);
		const change_all = document.querySelectorAll(".change");
		const confirmBtn = document.querySelector(".confirm-btn");
		confirmBtn.addEventListener("click", async e => {
			e.preventDefault();
			const inputNew = document.querySelector("#new-password");
			const inputConfirm = document.querySelector("#confirm-password");
			const newPassword = inputNew.value;
			const confirmPassword = inputConfirm.value;
			if (!newPassword || !confirmPassword) {
				createNotification("Fields cannot be empty!");
				return;
			}
			if (newPassword !== confirmPassword) {
				createNotification("Passwords do not match!");
				inputNew.value = "";
				inputConfirm.value = "";
				return;
			}
			const csrf = await getCSRFToken();
			try {
				const response = await fetch('/accounts/user_info/', {
					method: 'PUT',
					headers: {
						'Content-Type' : 'application/json',
						'X-CSRFToken': csrf
					},
					body: JSON.stringify({
						newpassword : newPassword,
						confirmpassword : confirmPassword
					})
				});
				if (!response.ok) {
					const data = await response.json();
					if (data.newpassword && data.newpassword[0]) {
						console.error(data.newpassword[0]);
						throw new Error(data.newpassword[0]);
					}
				} else {
					createNotification("Password changed successfully! Please log in again.");
					await this.user.loadUserData();
					navigateTo("/");
				}
			} catch (error) {
				console.error('Error: ', error);
				createNotification(error.message);
			}
		});
		const cancelBtn = document.querySelector(".red-btn");
		cancelBtn.addEventListener("click", e => {
			e.preventDefault();
			changePasswordBtn.removeAttribute("disabled");
			change_all.forEach(e => {
				e.remove();
			});
			changePicBtn.style.display = "block";
			changeUsernameBtn.style.display = "block";
			deleteAccountBtn.style.display = "block";
		});
	}

	async deleteAccount() {
		const csrf = await getCSRFToken();
		await fetch('/accounts/delete/', {
			method: 'POST',
			headers: {
				'Content-Type' : 'application/json',
				'X-CSRFToken': csrf
			}
		});
		createNotification("Account deleted successfully!");
		navigateTo("/");
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
		const changePasswordBtn = document.getElementById("change-password");
		changePasswordBtn.addEventListener("click", () => {
			this.changePassword();
		});
		const deleteAccountBtn = document.getElementById("delete-account");
		deleteAccountBtn.addEventListener("click", () => {
			this.deleteAccount();
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