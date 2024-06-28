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
		this.isStartSettings = true;
		this.activeBtn();
	}

	async changeAvatar() {
		this.isStartSettings = false;
		const changePicBtn = document.getElementById("change-pic");
		const changePasswordBtn = document.getElementById("change-password");
		const deleteAccountBtn = document.getElementById("delete-account");
		const changeLang = document.querySelector(".change-language");
		const changeUsernameBtn = document.getElementById("change-username");
		changeLang.style.display = "none";
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
				<button type="button" data-translate="save" class="submit-btn confirm-btn" style="width: 100%;"><ion-icon name="checkmark-outline"></ion-icon>Accept</button>
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
			// createNotification("Profile picture changed successfully!");
			createNotification("Profile picture changed successfully!", "changepic");
			// this.lang = localStorage.getItem('language') || 'en';
			// changeLanguage(this.lang);
			navigateTo("/dashboard/settings");
		});
		const uploadBtn = document.querySelector(".upload-file");
		uploadBtn.addEventListener("click", e => {
			e.preventDefault();
			this.uploadPic();
		});
		const confirmBtn = document.querySelector(".confirm-btn");
		confirmBtn.addEventListener("click", async e => {
			e.preventDefault();
			const urlInput = document.querySelector(".input-box input");
			// if (!urlInput.value) {
			// 	createNotification("Please, insert an URL.", "urlinsert");
			// 	return;
			// }
			try {
				const csrf = await getCSRFToken();
				const formdata = new FormData();
				formdata.append('url', urlInput.value);
				const response = await fetch('/accounts/user_info/', {
					method: 'POST',
					headers: {
						'X-CSRFToken': csrf
					},
					body: formdata
				});
				console.log(response);
				if (!response.ok) {
					throw new Error("Error in changing the profile picture");
				}
				createNotification("Profile picture changed successfully!", "changepic");
				navigateTo("/dashboard/settings");
			} catch (error) {
				urlInput.value = "";
				console.error('Error: ', error);
				createNotification("Provided URL is not valid!", "urlnotvalid");
			}

		});
		this.lang = localStorage.getItem('language') || 'en';
		changeLanguage(this.lang);
	}

	async changeUsername() {
		this.isStartSettings = false;
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
				<input type="text" id="new-username" data-translate="newusername" placeholder="New Username">
				<ion-icon name="person-outline"></ion-icon>
			</div>
			<div class="input-box change">
				<input type="text" id="new-alias" data-translate="alias" placeholder="New Alias">
				<ion-icon name="person-outline"></ion-icon>
			</div>
			<div class="change-btn change">
				<button type="button" data-translate="save" class="submit-btn confirm-btn" style="width: 100%;"><ion-icon name="checkmark-outline"></ion-icon>Accept</button>
			</div>
		`;
		changeUsernameBtn.insertAdjacentHTML("afterend", changeUsernameHTML);
		// changeLanguage(this.lang);
		const confirmBtn = document.querySelector(".confirm-btn");
		confirmBtn.addEventListener("click", async e => {
			e.preventDefault();
			const newUsername = document.querySelector("#new-username").value;
			const newAlias = document.querySelector("#new-alias").value;
			try {
				const csrf = await getCSRFToken();
				const response = await fetch('/accounts/user_info/', {
					method: 'PUT',
					headers: {
						'Content-Type' : 'application/json',
						'X-CSRFToken': csrf
					},
					body: JSON.stringify({
						username : newUsername,
						alias : newAlias
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
					createNotification("Username changed successfully!", "userchanged");
					navigateTo("/settings");
				}
			} catch (error) {
				input.value = "";
				console.error('Error: ', error);
				createNotification(error.message);
			}
		});

		this.lang = localStorage.getItem('language') || 'en';
		changeLanguage(this.lang);
	}

	async changePassword() {
		this.lang = localStorage.getItem('language') || 'en';
		this.isStartSettings = false;
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
				<input type="password" data-translate="newpass" placeholder="New Password" id="new-password">
				<ion-icon name="lock-closed-outline"></ion-icon>
			</div>
			<div class="input-box change">
				<input type="password" data-translate="confirmpass" placeholder="Confirm Password" id="confirm-password">
				<ion-icon name="lock-closed-outline"></ion-icon>
			</div>
			<div class="change-btn change">
				<button type="button" data-translate="save" class="submit-btn confirm-btn" style="width: 100%;"><ion-icon name="checkmark-outline"></ion-icon>Accept</button>
			</div>
		`;
		changePasswordBtn.insertAdjacentHTML("afterend", changePasswordHTML);
		changeLanguage(this.lang);
		const change_all = document.querySelectorAll(".change");
		const confirmBtn = document.querySelector(".confirm-btn");
		confirmBtn.addEventListener("click", async e => {
			e.preventDefault();
			const inputNew = document.querySelector("#new-password");
			const inputConfirm = document.querySelector("#confirm-password");
			const newPassword = inputNew.value;
			const confirmPassword = inputConfirm.value;
			// if (!newPassword || !confirmPassword) {
			// 	createNotification("Field cannot be empty!", "fieldcannotempty");
			// 	return;
			// }
			// if (newPassword !== confirmPassword) {
			// 	createNotification("Passwords do not match!", "passdontmatch");
			// 	inputNew.value = "";
			// 	inputConfirm.value = "";
			// 	return;
			// }
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
				if (response.status === 400) {
					const data = await response.json();
					throw new Error(data);
				}
				if (!response.ok) {
					const data = await response.json();
					if (data.newpassword && data.newpassword[0]) {
						console.error(data.newpassword[0]);
						throw new Error(data.newpassword[0]);
					}
				} else {
					createNotification("Password changed successfully! Please log in again.", "passchanged");
					// await this.user.loadUserData();
					navigateTo("/");
				}
			} catch (error) {
				console.error('Error: ', error);
				createNotification(error.message, "passdontmatch");
			}

		});
		await changeLanguage(this.lang);
	}

	async deleteAccount() {
		this.isStartSettings = false;
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
			createNotification("Account deleted successfully!", "accdeleted");
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

		this.lang = localStorage.getItem('language') || 'en';});
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
						createNotification("Profile picture changed successfully!", "changepic");
						// changeLanguage(this.lang);
						navigateTo("/dashboard");
					} catch (error) {
						console.error('Error: ', error);
						createNotification(error.message);
					}
				}

		this.lang = localStorage.getItem('language') || 'en';	});
		await changeLanguage(this.lang);
	}

	async paddleColor (color) {
		const csrf = await getCSRFToken();
		await fetch('/accounts/user_info/', {
			method: 'POST',
			headers: {
				'Content-Type' : 'application/json',
				'X-CSRFToken': csrf
			},
			body: JSON.stringify({
				paddle_color : color,
			})
		});
	}

	async pongColor (color) {
		const csrf = await getCSRFToken();
		await fetch('/accounts/user_info/', {
			method: 'POST',
			headers: {
				'Content-Type' : 'application/json',
				'X-CSRFToken': csrf
			},
			body: JSON.stringify({
				pong_color : color,
			})
		});
	}

	activeBtn() {
		const colorPicker = document.getElementById("paddle_color");
		const customize = document.querySelector(".customize-paddle-color");
		colorPicker.addEventListener("input", async () => {
			await this.paddleColor(colorPicker.value);
		});
		const pongColorPicker = document.getElementById("pong_color");
		const customizePong = document.querySelector(".customize-pong-style");
		const lang_selector = document.querySelectorAll(".lang-selector");
		pongColorPicker.addEventListener("input", async () => {
			await this.pongColor(pongColorPicker.value);
		});
		lang_selector.forEach(e => {
			e.addEventListener("click", async () => {
				const language = e.getAttribute("value");
				console.log(language);
				await changeLanguage(language);

				// Send a POST request
				try {
					const response = await fetch('/accounts/user_info/', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'X-CSRFToken': await getCSRFToken()
						},
						body: JSON.stringify({ "language": language }),
					});
					const data = await response.json();
					console.log('Success:', data);
				} catch (error) {
					console.error('Error:', error);
				}
			});
		});
		const backBtn = document.getElementById("back");
		backBtn.addEventListener("click", e => {
			e.preventDefault();
			if (this.isStartSettings) {
				navigateTo("/dashboard");
			} else {
				this.isStartSettings = true;
				navigateTo("/dashboard/settings");
			}
		});
		const changeUsernameBtn = document.getElementById("change-username");
		changeUsernameBtn.addEventListener("click", () => {
			customize.setAttribute("style", "display: none;");
			customizePong.setAttribute("style", "display: none;");
			this.changeUsername();
		});
		const changePasswordBtn = document.getElementById("change-password");
		changePasswordBtn.addEventListener("click", () => {
			customize.setAttribute("style", "display: none;");
			customizePong.setAttribute("style", "display: none;");
			this.changePassword();
		});
		const deleteAccountBtn = document.getElementById("delete-account");
		deleteAccountBtn.addEventListener("click", () => {
			customize.setAttribute("style", "display: none;");
			customizePong.setAttribute("style", "display: none;");
			this.deleteAccount();
		});
		const changePicBtn = document.getElementById("change-pic");
		changePicBtn.addEventListener("click", () => {
			customize.setAttribute("style", "display: none;");
			customizePong.setAttribute("style", "display: none;");
			this.changeAvatar();
		});
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
		const settingsHTML = `
			<div class="dashboard">
				<div class="settings">
					<h1 data-translate="settings">Settings</h1>
					<div class="user-data">
						<img alt="Profile picture" src="${this.user.getPic()}"/>
						<h3>${this.user.getUser()}</h3>
						${this.user.getAlias() != "None" ? `<h4>${this.user.getAlias()}</h4>` : ""}
					</div>
					<div class="btns-container">
						<div class="hr" style="width: 80%; margin-bottom: 25px;"></div>
						<button type="button" data-translate="changeavatar" class="submit-btn dashboard-btn" id="change-pic"><ion-icon name="image-outline"></ion-icon>Change Avatar</button>
						<button type="button" data-translate="changeuser" class="submit-btn dashboard-btn" id="change-username"><ion-icon name="person-outline"></ion-icon>Change Username</button>
						<button type="button" data-translate="changepass" class="submit-btn dashboard-btn" id="change-password"><ion-icon name="key-outline"></ion-icon>Change Password</button>
						<div class="customize-pong-style">
							<p data-translate="customizePong">Customize Pong Color:</p>
							<input type="color" id="pong_color" value="${this.user.pong_color}">
						</div>
						<div class="customize-paddle-color">
							<p data-translate="customizePaddle">Customize Paddle Color:</p>
							<input type="color" id="paddle_color" value="${this.user.paddle_color}">
						</div>
						<div class="change-language">
							<p data-translate="changelang">Change Language:</p>
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
		return settingsHTML;
	}
}