import AbstractView from "./AbstractView.js";

export async function getCSRFToken() {
	let csrftoken = await fetch("csrf-token")
		.then(response => response.json())
		.then(data => data.csrfToken);
		console.log(csrftoken);
	return csrftoken;
}


export default class Info extends AbstractView {
    constructor(friend_name) {
        super();
        this.friend_name = friend_name;
        this.username = "undefined";
        this.email = "undefined";
    }

    async getuserinfo(){
        var csrf = await getCSRFToken();
        return fetch('/accounts/guser_info/?username=' + this.friend_name, {
            method: 'GET',
            headers: {
                'Content-Type' : 'application/json',
                'X-CSRFToken': csrf
            }
    }).then(response => response.json())
    .then(data => {
        console.log(data[0]);
        this.username = data[0].username;
        this.email = data[0].email;
    })
    .catch((error) => {
        console.error('Error:', error);
    })
    }

    async getContent() {
        await this.getuserinfo();
        return `
            <div>
                <h1>User Info</h1>
                <p>Name: ${this.username}</p>
                <p>Email: ${this.email}</p>
            </div>
        `;
    }
}