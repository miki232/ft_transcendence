import { getCookie, register, logout } from "./utilities.js";
import Login from "./views/Login.js";
import About from "./views/About.js";
import Contact from "./views/Contact.js";
import Dashboard from "./views/Dashboard.js";
import Room from "./views/Room.js";
import Friends from "./views/Friends.js";
import { sendFriendRequest } from "./views/Friends.js"

// function activeLink(page) {
//     let oldActive = document.querySelector('a.active');
// 	if (oldActive) {
// 		oldActive.classList.remove('active');
// 	}
// 	let newActive = document.querySelector(`a[href="${page}"]`);
// 	newActive.classList.add('active');
// }

const container = document.querySelector("#container");
const nav = document.querySelector("#navbar");
const content = document.querySelector("#content");
var refreshRoomList;

// const room = new Room();

const navigateTo = url => {
	history.pushState(null, null, url);
	router();
};

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

const router = async () => {
	const routes = [
		// { path: "/404", view: NotFound},
		{ path: "/", view: Login },
		{ path: "/about", view: About },
		{ path: "/contact", view: Contact },
		{ path: "/dashboard", view: Dashboard }
		// { path: "/pong", view: Pong }
	];
	
	const potentialMatches = routes.map(route => {
		return {
			route: route,
			isMatch: location.pathname === route.path
		};
	});
	
	let match = potentialMatches.find(potentialMatch => potentialMatch.isMatch);
	if (!match) {
		match = {
			route: routes[0],
			isMatch: true
		};
	}
	let is_logged_in = await is_loggedin();
	// console.log(is_logged_in);
	// console.log(match.route.path);
	if (match.route.path === "/dashboard") {
		var view = new match.route.view();
		if (is_logged_in === false){
			const isVAlid = await view.validateLogin();
			console.log("SUCA");
			if (!isVAlid){
				navigateTo("/");
				return;
			}
		}
		if (view.isValid === true || is_logged_in === true) {
			container.classList.add("dashboard");
			await view.loadUserData();
			// nav.innerHTML = await view.getNav();
			nav.setAttribute("style", "display: none;");
			container.insertAdjacentHTML('afterbegin', await view.getNav());
			content.innerHTML = await view.getContent();
			view.setTitle("Dashboard");
			// room.updateRoomList();
		}
	} else {
		if (is_logged_in === true)
			navigateTo("/dashboard");
		container.classList.remove("dashboard");
		let dashNav = document.getElementById("nav-bar");
		if (dashNav) {
			dashNav.remove();
		}
		nav.setAttribute("style", "display: block;");
		const view = new match.route.view();
		nav.innerHTML = await view.getNav();
		content.innerHTML = await view.getContent();
	}
};

window.addEventListener("popstate", router);

document.addEventListener("DOMContentLoaded", () => {

	document.body.addEventListener("click", async e => {
		if (e.target.matches("[data-link]")) {
			e.preventDefault();
			navigateTo(e.target.href);
		}
		if (e.target.matches("#createRoomBtn")) {
			console.log("SUCA");
		}
		if (e.target.matches("#cancel-request"))
			await renderDashboard("friends");
		if (e.target.matches("#decline-request"))
			await renderDashboard("friends");
		if (e.target.matches("#Accept-request"))
			await renderDashboard("friends");
		if (e.target.matches("#Remove-friend"))
			await renderDashboard("friends");
		if (e.target.matches("#friendBtn")){
			let user = document.getElementById("friendNameInput").value;
			sendFriendRequest(user);
			await renderDashboard("friends")
		}
		if (e.target.matches("#signup")) {
			await register();
		}
		if (e.target.matches("#logout")) {
            await logout();
			navigateTo("/");
        }
		if (e.target.closest(".nav-button")) {
			let selected = e.target.id;
			if (!selected) {
				selected = e.target.parentElement.id;
			}
			console.log(selected);
			await renderDashboard(selected);
		}
		if (e.target.matches("#nav-title")) {
			await renderDashboard("dashboard");
		}
	});
	router();
});

// content.addEventListener("click", e => {
// 	if (e.target.matches("#signup")) {
// 		register();
// 	}
// 	// console.log("sudsa", e.target);
// 	if (e.target.matches("#logout")) {
// 		logout();
// 	}
// });

async function renderDashboard(render) {
	var view;
	switch(render) {
		case "rooms":
			if (!(view instanceof Room)) {
				view = new Room();
			}
			content.innerHTML = await view.getContent();
			if (refreshRoomList) {
				clearInterval(refreshRoomList);
			}
			
			view.updateRoomList();
			refreshRoomList = setInterval(() => {
					view.updateRoomList();
					console.log("Room list updated");
			}, 5000);
			document.getElementById("createRoomBtn").addEventListener("click", view.btnCreateRoom);
			break;
		case "friends":
			if (refreshRoomList) clearInterval(refreshRoomList);
			view = new Friends();
			content.innerHTML = await view.getContent();
			await view.loadData();
			await view.getPendingRequests();
			await view.getFriendList();
			break;
		default:
			if (refreshRoomList) clearInterval(refreshRoomList);
			view = new Dashboard();
			content.innerHTML = await view.getContent();
	}
}