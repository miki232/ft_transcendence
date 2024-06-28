import AbstractView from "./AbstractView.js";
import { changeLanguage, navigateTo } from "../index.js";
import { register } from "../utilities.js";
import { createNotification } from "./Notifications.js";
// import validateLogin from './Dashboard.js';

export default class extends AbstractView {
    constructor(user) {
        super();
		this.user = user;
        this.setTitle("ft_The Match");
		this.is_loggedin = false;
		this.content = document.querySelector("#content");
		this.nav = document.querySelector("header");
		this.nav.innerHTML = this.getNav();
		this.content.innerHTML = this.getContent();
		this.lang = localStorage.getItem('language') || 'en';
		this.activeBtn();
    }

	async loadUserData() {
		var csrftoken = this.getCookie('csrftoken')
		await fetch('accounts/user_info/', {
			method: 'GET',
			headers: {
				'Content-Type' : 'application/json',
				'X-CSRFToken': csrftoken
			}
		})
		.then(response => {
			if (response.ok) {
				this.is_loggedin = true;
				return response.json();
			} else {
				this.is_loggedin = false;
				throw new Error('Not logged in');
			}
		})
		.then(data => {
			console.log(data);
		})
		.catch((error) => {
			console.error('Error:', error);
		})
	}

	activeBtn() {
		const loginBtn = document.getElementById("login-btn");
		const registerBtn = document.getElementById("register-btn");
		const form_box = document.querySelector(".form-box");

		const loginSwap = document.querySelector(".login-btn");
		const registerSwap = document.querySelector(".register-btn");
		const login_username = document.querySelector("#login-user");
		const login_pass = document.querySelector("#login-pass");
		const schoolLoginBtn = document.getElementById("school-login");
		var langSelectors = document.querySelectorAll('.lang-selector');

		langSelectors.forEach(function(selector) {
			selector.addEventListener('click', function(event) {
				this.lang = this.getAttribute('value');
				changeLanguage(this.lang);
				// Do something with the selected language
				console.log('Selected language: ' + this.lang);
			});
		});
		loginSwap.addEventListener("click", e => {
			e.preventDefault();
			form_box.classList.remove("change-form");
		});

		registerSwap.addEventListener("click", e => {
			e.preventDefault();
			form_box.classList.add("change-form");
			login_username.value = "";
			login_pass.value = "";
		});
		
		loginBtn.addEventListener('click', async e => {
			e.preventDefault();
			await this.user.validateLogin();
			if (this.user.logged === true) navigateTo("/dashboard");
		});

		registerBtn.addEventListener('click', async e => {
			e.preventDefault();
			const registered = await register();
			registered === true ? form_box.classList.remove("change-form") : null;
		});
		schoolLoginBtn.addEventListener('click', async e => {
			e.preventDefault();
			const response = await fetch('accounts/authorize/', {
				method: 'GET',
				headers: {
					'Content-Type' : 'application/json',
					'X-CSRFToken': this.getCSRFToken()
				}
			});
			if (response.ok) {
				const data = await response.json();
				const newWindow = window.open(data.url, '_blank');

				const checkWindowClosed = setInterval(function() {
					if (newWindow.closed) {
						clearInterval(checkWindowClosed);
						let exiting = localStorage.getItem('error42');
						console.log('setting storage:', exiting);
						if (exiting === null) {
							console.log('The tab has been closed');
							navigateTo("/dashboard");
						}
						console.log('The tab has been closed with error:', exiting);
						var trans = null;
						if (exiting === "User with this email and username already exists")
						{
							trans = "exiting";
						}
						else
						{
							trans = "success";
						}
						createNotification(exiting, trans);
						localStorage.removeItem('error42');
						navigateTo("/dashboard");
						// Perform any other actions needed after the tab is closed
					}
				}, 1000); // Check every second
			} else {
				console.error('Error:', response.status);
			}
    });
	}

	getNav() {
		const navHTML = `
			<nav class="navbar navbar-expand-lg bg-body-tertiary">
			  <div class="container-fluid">
				<a href="/" id="logo" class="nav-brand" aria-current="page" data-link>
					<img src="/static/img/Logo.png" alt="Logo" class="logo"/>
				</a>
				<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
					<span class="navbar-toggler-icon"><ion-icon name="menu-outline" class="toggler-icon"></ion-icon></span>
				</button>
				<div class="collapse navbar-collapse" id="navbarNavDropdown">
				  <ul class="navbar-nav">
					<li class="nav-item">
					  <a class="nav-link" aria-current="page" href="/" data-link>Home</a>
					</li>
					<li class="nav-item">
					  <a class="nav-link" data-translate="aboutus" href="/about" data-link>About Us</a>
					</li>
					<li class="nav-item">
					  <a class="nav-link" data-translate="contacts" href="/contact" data-link>Contact</a>
					</li>
					<li class="nav-item dropdown">
					  <a class="nav-link dropdown-toggle" data-translate="language" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
						Language
					  </a>
					  <ul class="dropdown-menu select-menu">
						<li class="dropdown-item lang-selector" value="en">English</li>
						<li class="dropdown-item lang-selector" value="fr">Français</li>
						<li class="dropdown-item lang-selector" value="it">Italiano</li>
					  </ul>
					</li>
				  </ul>
				</div>
			  </div>
			</nav>
		`;
		return navHTML;
	}

    getContent() {
		const loginHTML = `
			<div class="form-box">
			    <form class="login-form">
					<h1>Login</h1>
					<div class="input-box">
						<input type="text" id="login-user" required>
						<label data-translate="username">Username</label>
						<ion-icon name="person-outline"></ion-icon>
					</div>
					<div class="input-box">
						<input type="password" id="login-pass" required>
						<label  data-translate="password">Password</label>
						<ion-icon name="lock-closed-outline"></ion-icon>
					</div>
					<div class="checkbox">
						<div>
							<input type="checkbox" id="login-checkbox">
							<label data-translate="rememberme" for="login-checkbox">Remember me</label>
						</div>
					</div>
					<button type="submit" data-translate="login" id="login-btn" class="submit-btn"><ion-icon name="log-in-outline"></ion-icon">Login</button>
					<div class="login-register">
						<p data-translate="noaccount">Don't have an account? <a href="#" data-translate="register" class="register-btn">Register</a></p>
					</div>
					<div class="hr" style="width: 80%; margin: 25px 0 30px 0;"></div>
					<p id="school-login" data-translate="login42">Login with <a href="accounts/authorize/"><img src="/static/img/42_logo_white.svg" id="school-logo"/></a></p>
				</form>
				<form class="register-form">
					<h1 data-translate="makeregister">Registration</h1>
					<div class="input-box">
						<input type="text" id="signup-user" required>
						<label data-translate="signupuser">Username</label>
						<ion-icon name="person-outline"></ion-icon>
					</div>
					<div class="input-box">
						<input type="text" id="email" required>
						<label>Email</label>
						<ion-icon name="mail-outline"></ion-icon>
					</div>
					<div class="input-box">
						<input type="password" id="signup-pass" required>
						<label data-translate="signuppass">Password</label>
						<ion-icon name="lock-closed-outline"></ion-icon>
					</div>
					<button type="submit" id="register-btn" class="submit-btn" data-translate="makeregister">Register<ion-icon name="save-outline"></ion-icon></button>
					<div class="login-register">
						<p data-translate="alreadyacc">Already have an account? <a href="#" class="login-btn" data-translate="fromregtologin">Login</a></p>
					</div>
				</form>
			</div>
		`;
        return loginHTML;
    }
}