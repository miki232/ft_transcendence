import AbstractView from "./AbstractView.js";
import { createNotification } from "./Notifications.js";
import { getCookie, sanitizeInput } from "../utilities.js";

export default class extends AbstractView {
    constructor() {
        super();
        this.user;
        this.email;
        this.password;
        this.pro_pic;
        this.logged = false;
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
                return true;
            } else {
                createNotification("Wrong username or password");
                return false;
            }
			// if (response.status === 200) {
			// 	this.isValid = true;
			// } else {
			// 	alert('Wrong username or password');
			// }
			})
			.then(data => console.log(data))
			.catch((error) => {
				console.error('Error: ', error);
		})
	}

    async isLogged() {
        var csrftoken = this.getCookie('csrftoken');

        return fetch('/accounts/user_info/', {
            method: 'GET',
            headers: {
                'Content-Type' : 'application/json',
                'X-CSRFToken': csrftoken
            }
        })
        .then(response => {
            if (response.ok) {
                this.logged = true;
            } else {
                 false;
            }
        });
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
				this.setPic(data.pro_pic);
                this.setPassword(data.password);
			})
			.catch((error) => {
				console.error('Error:', error);
			})
	}

    async setPic(data_pic) {
		this.pro_pic = data_pic;
	}

	async setUser(data_user) {
		this.user = data_user;
	}
	
	async setEmail (data_email) {
		this.email = data_email;
	}

    async setPassword(data_password) {
        this.password = data_password;
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

    async getPassword() {
        return this.password;
    }
}