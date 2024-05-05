import AbstractView from "./AbstractView.js";
import { navigateTo } from "../index.js";
import { register } from "../utilities.js";
// import validateLogin from './Dashboard.js';

export default class extends AbstractView {
    constructor(user) {
        super();
		this.user = user;
        this.setTitle("ft_transcendence");
		this.is_loggedin = false;
		this.content = document.querySelector("#content");
		this.nav = document.querySelector("nav");
		this.nav.innerHTML = this.getNav();
		this.content.innerHTML = this.getContent();
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
	}

	getNav() {
		const navHTML = `
			<a href="/" name="index" data-link>Home</a>
			<a href="/about" name="about" data-link>About</a>
			<a href="/contact" name="contact" data-link>Contact</a>
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
						<label>Username</label>
						<ion-icon name="person-outline"></ion-icon>
					</div>
					<div class="input-box">
						<input type="password" id="login-pass" required>
						<label>Password</label>
						<ion-icon name="lock-closed-outline"></ion-icon>
					</div>
					<div class="checkbox">
						<span>
							<input type="checkbox" id="login-checkbox">
							<label for="login-checkbox">Remember me</label>
						</span>
						<h5>Forgot password?</h5>
					</div>
					<button type="submit" id="login-btn" class="submit-btn"><ion-icon name="log-in-outline"></ion-icon>Login</button>
					<div class="login-register">
						<p>Don't have an account? <a href="#" class="register-btn">Register</a></p>
					</div>
					<div class="hr" style="width: 75%; margin: 25px 0 30px 0;"></div>
					<a href="accounts/authorize/" id="school-login">Login with 42 intra account</a>
				</form>
				<form class="register-form">
					<h1>Registration</h1>
					<div class="input-box">
						<input type="text" id="signup-user" required>
						<label>Username</label>
						<ion-icon name="person-outline"></ion-icon>
					</div>
					<div class="input-box">
						<input type="text" id="email" required>
						<label>Email</label>
						<ion-icon name="mail-outline"></ion-icon>
					</div>
					<div class="input-box">
						<input type="password" id="signup-pass" required>
						<label>Password</label>
						<ion-icon name="lock-closed-outline"></ion-icon>
					</div>
					<div class="checkbox">
						<input type="checkbox" id="register-checkbox">
						<label for="register-checkbox">I agree to the terms & conditions</label>
					</div>
					<button type="submit" id="register-btn" class="submit-btn">Register</button>
					<div class="login-register">
						<p>Already have an account? <a href="#" class="login-btn">Login</a></p>
					</div>
				</form>
			</div>
		`;
        return loginHTML;
    }
}