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
        this.pro_pic = "undefined";
        this.status = "undefined";
        this.is_friend = "none";
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
        this.pro_pic = data[0].pro_pic;
        this.status = data[0].status_login;
    })
    .catch((error) => {
        console.error('Error:', error);
    })
    }

    async getContent() {
        await this.getuserinfo();
        return `
            <div class="single-card">
                <img src="${this.pro_pic}" alt="User pic">
                <h1>${this.username}</h1>
                <div class="friend-info">
                    <p>${this.status}</p>
                </div>
            </div>
            <h1> Qua mettiamo i match ecc.. e anche un bottone per mandare la richiesta di amicizia se non sono amici, o rimuovi la richiesta se sono amici</h1>
        `;
    }
}