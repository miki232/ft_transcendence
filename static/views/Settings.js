import { getCSRFToken } from "./Info.js";
import { createNotification } from "./Notifications.js";
import AbstractView from "./AbstractView.js";
import { changeLanguage, navigateTo } from "../index.js";

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
		this.nav = document.querySelector("header");
		this.nav.innerHTML = this.getNav();
		this.lang = localStorage.getItem('language') || 'en';
		this.content.innerHTML = this.getContent();
		this.activeBtn();
	}

	async changeAvatar() {
		const changePicBtn = document.getElementById("change-pic");
		const changePasswordBtn = document.getElementById("change-password");
		const deleteAccountBtn = document.getElementById("delete-account");
		const changeLang = document.querySelector(".change-language");
		changeLang.style.display = "none";
		const changeUsernameBtn = document.getElementById("change-username");
		changePasswordBtn.style.display = "none";
		deleteAccountBtn.style.display = "none";
		changeUsernameBtn.style.display = "none";
		changePicBtn.setAttribute("disabled", "true");
		changePicBtn.classList.remove("submit-btn");
		changePicBtn.classList.add("settings-btn");
		const changePicHTML = `
			<div class="change-btn change">
				<button type="button" data-translate="defaultImage" class="submit-btn default-pic"><ion-icon name="image-outline"></ion-icon>Default avatar</button>
				<input type="file" id="file-input" style="display: none;" accept="image/*"/>
				<button type="button" data-translate="uploadImage" class="submit-btn upload-file"><ion-icon name="cloud-upload-outline"></ion-icon>Upload File</button>
			</div>
			<div class="input-box change">
				<input type="text" data-translate="insertAvatarURL" placeholder="Insert avatar URL">
				<ion-icon name="link-outline"></ion-icon>
			</div>
			<div class="change-btn change">
				<button type="button" data-translate="save" class="submit-btn confirm-btn"><ion-icon name="checkmark-outline"></ion-icon>Accept</button>
				<button type="button" data-translate="notsave" class="submit-btn red-btn"><ion-icon name="close-outline"></ion-icon>Cancel</button>
			</div>
		`;
		changePicBtn.insertAdjacentHTML("afterend", changePicHTML);
		const defaultAvatar = document.querySelector(".default-pic");
		defaultAvatar.addEventListener("click", async e => {
			e.preventDefault();
			const csrf = await getCSRFToken();
			await fetch('/accounts/user_info/', {
				method: 'PUT',
				headers: {
					'Content-Type' : 'application/json',
					'X-CSRFToken': csrf
				},
				body: JSON.stringify({
					pro_pic : "defaultPic",
				})
			});
			// await this.user.loadUserData(); /// Se dopo il fetch viene renderizzato la pagina "Dashboard", non è necessarion fare loadUserData
			createNotification("Profile picture changed successfully!");
			navigateTo("/dashboard");
		});
		const uploadBtn = document.querySelector(".upload-file");
		uploadBtn.addEventListener("click", e => {
			e.preventDefault();
			this.uploadPic();
		});
		const confirmBtn = document.querySelector(".confirm-btn");
		confirmBtn.addEventListener("click", async e => {
			e.preventDefault();
			const urlInput = document.querySelector(".input-box input").value;
			if (!urlInput) {
				createNotification("Please, insert an URL.");
				return;
			}
			const csrf = await getCSRFToken();
			const formdata = new FormData();
			formdata.append('url', urlInput);
			await fetch('/accounts/user_info/', {
				method: 'POST',
				headers: {
					'X-CSRFToken': csrf
				},
				body: formdata
			});
			// await this.user.loadUserData(); /// Se dopo il fetch viene renderizzato la pagina "Dashboard", non è necessarion fare loadUserData
			createNotification("Profile picture changed successfully!");
			navigateTo("/dashboard");
		});
		const cancelBtn = document.querySelector(".red-btn");
		cancelBtn.addEventListener("click", e => {
			e.preventDefault();
			const change_all = document.querySelectorAll(".change");
			changePicBtn.removeAttribute("disabled");
			change_all.forEach(e => {
				e.remove();
			});
			changePicBtn.classList.remove("settings-btn");
			changePicBtn.classList.add("submit-btn");
			changeUsernameBtn.style.display = "block";
			changePasswordBtn.style.display = "block";
			deleteAccountBtn.style.display = "block";
			changeLang.style.display = "flex";
		});
		await changeLanguage(this.lang);
	}

	async changeUsername() {
		const changePicBtn = document.getElementById("change-pic");
		const changePasswordBtn = document.getElementById("change-password");
		const deleteAccountBtn = document.getElementById("delete-account");
		const changeUsernameBtn = document.getElementById("change-username");
		const changeLang = document.querySelector(".change-language");
		changeLang.style.display = "none";
		changePicBtn.style.display = "none";
		changePasswordBtn.style.display = "none";
		deleteAccountBtn.style.display = "none";
		changeUsernameBtn.setAttribute("disabled", "true");
		changeUsernameBtn.classList.remove("submit-btn");
		changeUsernameBtn.classList.add("settings-btn");
		const changeUsernameHTML = `
			<div class="input-box change">
				<input type="text" placeholder="New Username">
				<ion-icon name="person-outline"></ion-icon>
			</div>
			<div class="change-btn change">
				<button type="button" data-translate="save" class="submit-btn confirm-btn"><ion-icon name="checkmark-outline"></ion-icon>Accept</button>
				<button type="button" data-translate="notsave" class="submit-btn red-btn"><ion-icon name="close-outline"></ion-icon>Cancel</button>
			</div>
		`;
		changeUsernameBtn.insertAdjacentHTML("afterend", changeUsernameHTML);
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
			try {
				const response = await fetch('/accounts/user_info/', {
					method: 'PUT',
					headers: {
						'Content-Type' : 'application/json',
						'X-CSRFToken': csrf
					},
					body: JSON.stringify({
						username : newUsername,
					})
				});
				if (!response.ok) {
					const data = await response.json();
					console.log(data);
					if (data.username && data.username[0]) {
						console.error(data.username[0]);
						throw new Error(data.username[0]);
					}
				} else {
					// await this.user.loadUserData();
					createNotification("Username changed successfully!");
					navigateTo("/dashboard");
				}
			} catch (error) {
				input.value = "";
				console.error('Error: ', error);
				createNotification(error.message);
			}
		});
		const cancelBtn = document.querySelector(".red-btn");
		cancelBtn.addEventListener("click", e => {
			e.preventDefault();
			changeUsernameBtn.removeAttribute("disabled");
			const change_all = document.querySelectorAll(".change");
			change_all.forEach(e => {
				e.remove();
			});
			changeUsernameBtn.classList.remove("settings-btn");
			changeUsernameBtn.classList.add("submit-btn");
			changePicBtn.style.display = "block";
			changePasswordBtn.style.display = "block";
			deleteAccountBtn.style.display = "block";
			changeLang.style.display = "flex";
		});
		await changeLanguage(this.lang);
	}

	async changePassword() {
		const changePicBtn = document.getElementById("change-pic");
		const changeUsernameBtn = document.getElementById("change-username");
		const deleteAccountBtn = document.getElementById("delete-account");
		const changePasswordBtn = document.getElementById("change-password");
		const changeLang = document.querySelector(".change-language");
		changeLang.style.display = "none";
		changePicBtn.style.display = "none";
		changeUsernameBtn.style.display = "none";
		deleteAccountBtn.style.display = "none";
		changePasswordBtn.setAttribute("disabled", "true");
		changePasswordBtn.classList.remove("submit-btn");
		changePasswordBtn.classList.add("settings-btn");
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
				<button type="button" data-translate="save" class="submit-btn confirm-btn"><ion-icon name="checkmark-outline"></ion-icon>Accept</button>
				<button type="button" data-translate="notsave" class="submit-btn red-btn"><ion-icon name="close-outline"></ion-icon>Cancel</button>
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
					// await this.user.loadUserData();
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
			changePasswordBtn.classList.remove("settings-btn");
			changePasswordBtn.classList.add("submit-btn");
			changePicBtn.style.display = "block";
			changeUsernameBtn.style.display = "block";
			deleteAccountBtn.style.display = "block";
			changeLang.style.display = "flex";
		});
		await changeLanguage(this.lang);
	}

	async deleteAccount() {
		const changePicBtn = document.getElementById("change-pic");
		const changeUsernameBtn = document.getElementById("change-username");
		const changePasswordBtn = document.getElementById("change-password");
		const deleteAccountBtn = document.getElementById("delete-account");
		const changeLang = document.querySelector(".change-language");
		changeLang.style.display = "none";
		changePicBtn.style.display = "none";
		changeUsernameBtn.style.display = "none";
		changePasswordBtn.style.display = "none";
		deleteAccountBtn.setAttribute("disabled", "true");
		deleteAccountBtn.classList.remove("red-btn");
		deleteAccountBtn.classList.remove("submit-btn");
		deleteAccountBtn.classList.add("no-btn");
		deleteAccountBtn.classList.add("settings-btn");
		const deleteAccountHTML = `
			<div class="delete-box change"><h5>Are you sure you want to delete your account?</h5></div>
			<div class="change-btn change">
				<button type="button" class="submit-btn confirm-btn"><ion-icon name="checkmark-outline"></ion-icon>Yes</button>
				<button type="button" class="submit-btn red-btn no-btn"><ion-icon name="close-outline"></ion-icon>No</button>
			</div>
		`;
		deleteAccountBtn.insertAdjacentHTML("afterend", deleteAccountHTML);
		const change_all = document.querySelectorAll(".change");
		const confirmBtn = document.querySelector(".confirm-btn");
		confirmBtn.addEventListener("click", async e => {
			e.preventDefault();
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
		});
		const cancelBtn = document.querySelectorAll(".no-btn");
		cancelBtn[1].addEventListener("click", e => {
			e.preventDefault();
			deleteAccountBtn.removeAttribute("disabled");
			change_all.forEach(e => {
				e.remove();
			});
			deleteAccountBtn.classList.remove("settings-btn");
			deleteAccountBtn.classList.add("submit-btn");
			changePicBtn.style.display = "block";
			changeUsernameBtn.style.display = "block";
			changePasswordBtn.style.display = "block";
			changeLang.style.display = "flex";
		});
		await changeLanguage(this.lang);
	}

	async uploadPic() {
		document.getElementById("file-input").click();
			document.getElementById("file-input").addEventListener("change", async e => {
				if (e.target.files.length > 0) {
					const csrf = await getCSRFToken();
					const formData = new FormData();
					formData.append('imageFile', e.target.files[0]);
					try {
						const response = await fetch('/accounts/user_info/', {
							method: 'POST',
							headers: {
								'X-CSRFToken': csrf
							},
							body: formData
						});
						if (!response.ok) {
							const data = await response.json();
							throw new Error(data.Error);
						}
						const data = await response.json();
						// await this.user.loadUserData(); /// Se dopo il fetch viene renderizzato la pagina "Dashboard", non è necessarion fare loadUserData
						createNotification("Profile picture changed successfully!");
						navigateTo("/dashboard");
					} catch (error) {
						console.error('Error: ', error);
						createNotification(error.message);
					}
				}
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
		const changePasswordBtn = document.getElementById("change-password");
		changePasswordBtn.addEventListener("click", () => {
			this.changePassword();
		});
		const deleteAccountBtn = document.getElementById("delete-account");
		deleteAccountBtn.addEventListener("click", () => {
			this.deleteAccount();
		});
		const changePicBtn = document.getElementById("change-pic");
		changePicBtn.addEventListener("click", () => {
			this.changeAvatar();
		});
		
	}

	getNav() {
		const navHTML = `
			<nav class="navbar navbar-expand-lg bg-body-tertiary">
			  <div class="container-fluid">
				<a href="/dashboard" id="logo" class="nav-link" aria-current="page" data-link>The Match</a>
				<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
					<span class="navbar-toggler-icon"><ion-icon name="menu-outline" class="toggler-icon"></ion-icon></span>
				</button>
				<div class="collapse navbar-collapse" id="navbarNavDropdown">
				  <ul class="navbar-nav">
					<li class="nav-item">
					  <a class="nav-link" href="/local_game" data-link>Local Game</a>
					</li>
					<li class="nav-item">
					  <a class="nav-link" href="/online" data-link>Online Game</a>
					</li>
					<li class="nav-item">
					  <a class="nav-link" href="/ranking" data-link>Ranking</a>
					</li>
					<li class="nav-item">
					  <a class="nav-link" href="/friends" data-link>Friends</a>
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
		const user_infoHTML = `
			<div class="dashboard">
				<div class="settings">
					<h1 data-translate="settings">Settings</h1>
					<div class="user-data">
						<img alt="Profile picture" src="${this.user.getPic()}"/>
						<h3>${this.user.getUser()}</h3>
					</div>
					<div class="btns-container">
						<div class="hr" style="width: 80%; margin-bottom: 15px;"></div>
						<button type="button" data-translate="changeavatar" class="submit-btn dashboard-btn" id="change-pic"><ion-icon name="image-outline"></ion-icon>Change Avatar</button>
						<button type="button" data-translate="changeuser" class="submit-btn dashboard-btn" id="change-username"><ion-icon name="person-outline"></ion-icon>Change Username</button>
						<button type="button" data-translate="changepass" class="submit-btn dashboard-btn" id="change-password"><ion-icon name="key-outline"></ion-icon>Change Password</button>
						<div class="change-language">
							<p>Change Language:</p>
							<div class="flags">
								<img src="/static/img/flags/gb.png" alt="English" class="flag lang-selector" value="en">
								<img src="/static/img/flags/fr.png" alt="Français" class="flag lang-selector" value="fr">
								<img src="/static/img/flags/it.png" alt="Italiano" class="flag lang-selector" value="it">
							</div>
						</div>
						<button type="button" data-translate="delaccount" class="submit-btn dashboard-btn red-btn" id="delete-account"><ion-icon name="trash-outline"></ion-icon>Delete Account</button>
					</div>
					<div class="back-btn-container">
						<div class="hr" style="width: 80%; margin-bottom: 15px;"></div>
						<button type="button" data-translate="back" class="submit-btn dashboard-btn" id="back"><ion-icon name="chevron-back-outline"></ion-icon>Back</button>
					</div>
				</div>
			</div>
		`;
		return user_infoHTML;
	}
}