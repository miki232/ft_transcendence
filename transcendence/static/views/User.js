import AbstractView from "./AbstractView.js";
import { createNotification } from "./Notifications.js";
import { getCookie } from "../utilities.js";

export default class User extends AbstractView {
	constructor() {
		super();
		this.username;
		this.email;
		this.alias = "null";
		this.language = "en";
        this.round = [];
		// this.password;
		this.pro_pic;
		this.logged = false;
		this.level;
		this.exp;
		this.paddle_color = "#00FF99"
		this.pong_color = "#141414";
		this.online_room;
		this.online_opponent = {
			username: "null",
			pro_pic: "null",
			level: "null",
		};
		this.tournament_opp = {
			alias: "null",
			username: "null",
			pro_pic: "null",
			level: "null",
		}
		this.tournament_local_room = {
			pk_tournament: "null",
			pk_match: "null",
			winner : "null",
			matchindex : 0,
		};
		this.disconnected = true;
		this.game_ws = null;
		this.matchmaking_ws = null;
		this.ws_tournament = null;
		this.lastURL = null;
		this.room_nextround = null;
		//localPong
		this.local_opponent = null;
		this.local_room = null;
		this.local_ws = null;
	}

	async logout(){
		///Csrf_token
		let csrftoken = await fetch("csrf-token")
		.then(response => response.json())
		.then(data => data.csrfToken);
		///
		await fetch('accounts/logout/', {
			method: 'POST',
			headers: {
				'Content-Type' : 'application/json',
				'X-CSRFToken': csrftoken,
			}
		})
		.then(response => {
			if (response.status > 204) {
				throw new Error(`HTTP status ${response.status}`);
			}
			if (response.status === 200) {
				return response.json();
			}
		})
		.then(data => {
			console.log("Logged out");
			console.log(data);
			createNotification("Successfully logged out", "logoutSuccess");
			this.logged = false;
		})
		.catch((error) => {
			console.error('Error:', error);
		});
	}

	async validateLogin() {
		try{
			var username = (document.getElementById('login-user').value);
			var password = (document.getElementById('login-pass').value);
			var rememberme = (document.getElementById('login-checkbox').checked);
		} catch (error){
			console.error(error);
			return;
		}
		const csrftoken = this.getCookie('csrftoken');

		await fetch('accounts/login/', {
			method: 'POST',
			headers: {
				'Content-Type' : 'application/json',
				'X-CSRFToken': csrftoken
			},
			body: JSON.stringify({
				username: username,
				password: password,
				remember_me : rememberme,
			}),
		}).then(response => {
			response.json();
			console.log(response);
			if (response.status === 200) {
				this.logged = true;
			} else {
				createNotification("Wrong username or password", "wrongUserPass");
				this.logged = false;
			}
		}).then(data => console.log(data))
		.catch((error) => {
			console.error('Error: ', error);
		})
	}

	setLocalGame(opponent, room, ws) {
		this.local_opponent = opponent;
		this.local_room = room;
		this.local_ws = ws;
	}

	async isLogged() {
		// var csrftoken = await this.getCookie();

		const response = await fetch('/accounts/user_info/');
		if (response.ok) {
			return true;
		} else {
			return false;
		}
	}

	async loadUserData() {
		const csrftoken = await this.getCookie("csrftoken");

		await fetch('/accounts/user_info/', {
			method: 'GET',
			headers: {
				'Content-Type' : 'application/json',
				'X-CSRFToken': csrftoken
			}
		})
			.then(response => response.json())
			.then(data => {
				console.log(" iasdlnasd", data);
				this.setUser(data.username);
				this.setEmail(data.email);
				this.setPic(data.pro_pic);
				this.setLevel(data.level);
				this.setExp(data.exp);
				this.setPaddleColor(data.paddle_color);
				this.setPongColor(data.pong_color);
				this.setLanguage(data.language);
				this.setPaddleColor(data.paddle_color);
				this.setPongColor(data.pong_color);
				this.setAlias(data.alias);
				// localStorage.setItem('language', data.language);
				console.log("User data loaded", this.language);
				// this.setPassword(data.password);
			})
			.catch((error) => {
				console.error('Error:', error);
			})
	}

	setAlias(data_alias) {
		this.alias = data_alias;
	}

	setPongColor(data_color) {
		this.pong_color = data_color;
	}

	setPaddleColor(data_color) {
		this.paddle_color = data_color;
	}

	setLanguage(data_lang) {
		this.language = data_lang;
	}
	
	setPic(data_pic) {
		this.pro_pic = data_pic;
	}

	setUser(data_user) {
		this.username = data_user;
	}
	
	setEmail (data_email) {
		this.email = data_email;
	}

	setPaddleColor(data_color) {
		this.paddle_color = data_color;
	}

	setPongColor(data_color) {
		this.pong_color = data_color;
	}

	// setPassword(data_password) {
	//     this.password = data_password;
	// }

	setLevel(data_level){
		this.level = data_level;
	}

	setExp(data_exp){
		this.exp = data_exp;
	}

	getUser() {
		return this.username;
	}

	getAlias() {
		return this.alias;
	}

	getEmail() {
		return this.email;
	}
	
	getPic(){ //new
		return this.pro_pic;
	}

	// getPassword() {
	//     return this.password;
	// }

	getLevel(){
		return this.level;
	}

	getExp(){
		return this.exp;
	}

	expProgress(){
		const exp_bar = document.querySelector(".progress-bar");
		const exp = this.getExp();
		const level = this.getLevel();
		const exp_needed = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987];
		const next_level = exp_needed[level + 1];
		const percentage = (exp / next_level) * 100;
		percentage.toFixed(2);
		exp_bar.style.width = `${percentage}%`;
	}
}