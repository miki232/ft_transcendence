import AbstractView from "./AbstractView.js";
import Room from "./Room.js";

const navHTML = `
<ul>
	<li id="user"></li>
	<li><a id="logout">Logout</a></li>
</ul>
`;

let dashboardHTML = `
<h1>Dashboard</h1>
<img src=""</img>
<p>Welcome to the dashboard <span></span>.</p>
`;

export default class extends AbstractView {
	constructor() {
		super();
		this.isValid = false;
		this.user;
		this.email;
		this.room = new Room();
		this.pro_pic;
		// this.validateLogin();
		// this.setTitle("Dashboard");
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

	async validateLogin() {
		try{
			var username = this.sanitizeInput(document.getElementById('login-user').value);
			var password = this.sanitizeInput(document.getElementById('login-pass').value);
		} catch (error){
			console.error(error);
			return;
		}
		var csrftoken = this.getCookie('csrftoken');

		await fetch('accounts/login/', {
			method: 'POST',
			headers: {
				'Content-Type' : 'application/json',
				'X-CSRFToken': csrftoken
			},
			body: JSON.stringify({
				username: username,
				password: password,
			}),
		}).then(response => {
			response.json();
			console.log(response);
			if (response.status === 200) {
				this.isValid = true;
			} else {
				alert('Wrong username or password');
			}
			})
			.then(data => console.log(data))
			.catch((error) => {
				console.error('Error: ', error);
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
		return navHTML;
	}

	async getContent() {
		let content = '';
		content = dashboardHTML + await this.room.getContent();
		return content;
	}
}