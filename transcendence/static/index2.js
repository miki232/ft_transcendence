import { getCookie, register, logout } from "./utilities.js";
import Login from "./views/Login.js";
import About from "./views/About.js";
import Contact from "./views/Contact.js";
import Dashboard from "./views/Dashboard.js";
import Room from "./views/Room.js";
import { invite_to_play } from "./views/Room.js";
import Friends from "./views/Friends.js";
import Info from "./views/Info.js";
import { getRequests, sendFriendRequest } from "./views/Requests.js";
import { createNotification } from "./views/Notifications.js";

const nav = document.querySelector("nav");
const content = document.querySelector("#content");
var route = "/";
var user_logged = false;
var ws;

const is_loggedin = async () => {
    var csrftoken = getCookie('csrftoken');

    return fetch('/accounts/user_info/', {
        method: 'GET',
        headers: {
            'Content-Type' : 'application/json',
            'X-CSRFToken': csrftoken
        }
    })
    .then(response => {
        if (response.ok) {
            return true;
        } else {
            return false;
        }
    });
};

function webSockeConnection() {
	if (!ws){
		ws	= new WebSocket('wss://'
		+ window.location.hostname
		+ ':8000'
		+ '/ws/notifications'
		+ '/');
	}
	ws.onmessage = function(event) {
		const data = JSON.parse(event.data);
		if (data.read === false){
			createNotification(data.content);
			ws.send(JSON.stringify({'action': "read"}));
		}
	}
}

const navigateTo = (url) => {
	history.pushState(null, null, url);
	route = url;
	router();
}

const router = async () => {
	user_logged = await is_loggedin();
	// if (user_logged === true) {
	// 	navigateTo("/dashboard");
	// 	return;
	// }
	console.log(route);
	switch(route) {
		case "/":
			const home = new Login();
			nav.innerHTML = await home.getNav();
			content.innerHTML = await home.getContent();
			home.homeBtn();
			break;
		case "/about":
			const about = new About();
			nav.innerHTML = await about.getNav();
			content.innerHTML = await about.getContent();
			break;
		case "/contact":
			const contact = new Contact();
			nav.innerHTML = await contact.getNav();
			content.innerHTML = await contact.getContent();
			break;
		case "/dashboard":
			const dashboard = new Dashboard();
			if (user_logged === false) {
				var validateLogin = await dashboard.validateLogin();
				if (!validateLogin) {
					navigateTo("/");
					return
				}
			}
			if (dashboard.isValid === true || user_logged === true) {
				webSockeConnection();	
				await dashboard.loadUserData();
				nav.innerHTML = await dashboard.getNav();
				content.innerHTML = await dashboard.getContent();
				dashboard.dashboardBtn();
			}
			break;
	}
}

window.onpopstate = () => {
	route = window.location.pathname;
	router();
};

document.addEventListener("DOMContentLoaded", () => {
	document.body.addEventListener("click", async (e) => {
		e.preventDefault();
		if (e.target.matches("[data-link]")) {
			var url = new URL(e.target.href);
			navigateTo(url.pathname);
		}
		if (e.target.matches("#login-btn")) {
			navigateTo("/dashboard");
		}
		if (e.target.matches("#logout-btn")) {
			await logout();
			navigateTo("/");
		}
	});
	router();
});