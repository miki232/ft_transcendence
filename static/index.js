import Login from "./views/Login.js";
import About from "./views/About.js";
import Contact from "./views/Contact.js";
import Dashboard from "./views/Dashboard.js";
import Room from "./views/Room.js";

// function activeLink(page) {
//     let oldActive = document.querySelector('a.active');
// 	if (oldActive) {
// 		oldActive.classList.remove('active');
// 	}
// 	let newActive = document.querySelector(`a[href="${page}"]`);
// 	newActive.classList.add('active');
// }

const nav = document.querySelector("nav");
const content = document.querySelector("#content");
const room = new Room();
// const groupContainer = document.querySelector(".group");
let inDashboard = false;

const navigateTo = url => {
	history.pushState(null, null, url);
	router();
};

const is_loggedin = async () => {
    var csrftoken = getCookie('csrftoken');

    return fetch('accounts/user_info/', {
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
	console.log(is_logged_in);
	// console.log(match.route.path);z
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
			await view.loadUserData();
			// inDashboard = true;
			nav.innerHTML = await view.getNav();
			document.querySelector("#user").innerHTML = await view.getUser();
			content.innerHTML = await view.getContent();
			document.querySelector("span").innerHTML = await view.getEmail();
			document.querySelector("img").src = await view.getPic(); //new
			view.setTitle("Dashboard");
			room.updateRoomList();
		}
	} else {
		if (is_logged_in === true)
			navigateTo("/dashboard");
		// inDashboard = false;
		const view = new match.route.view();
		nav.innerHTML = await view.getNav();
		content.innerHTML = await view.getContent();
	}
};

window.addEventListener("popstate", router);

const updateRoomList = setInterval(() => {
	if (inDashboard) {
		room.updateRoomList();
		console.log("Room list updated");
	}
}, 5000);

// const loadNewElement = setInterval(() => {
// 	const signUp = document.querySelector("#signup");
// 	const logoutBtn = document.querySelector("#logout");
// 	if (signUp) {
// 		signUp.addEventListener("click", register);
// 	}
// 	if (logoutBtn) {
// 		logoutBtn.addEventListener("click", logout);
// 	}
// }, 1000);


document.addEventListener("DOMContentLoaded", () => {
	document.body.addEventListener("click", async e => {
		if (e.target.matches("[data-link]")) {
			e.preventDefault();
			navigateTo(e.target.href);
		}
		if (e.target.matches("#createRoomBtn")) {
			room.btnCreateRoom();
		}
		if (e.target.matches("#signup")) {
			await register();
		}
		if (e.target.matches("#logout")) {
            await logout();
			// navigateTo("/");
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

async function logout(){
	var csrftoken = getCookie('csrftoken')
	var sessionid = getCookie('sessionid')
	await fetch('accounts/logout/', {
		method: 'POST',
		headers: {
			'Content-Type' : 'application/json',
			'X-CSRFToken': csrftoken,
			'sessionid' : sessionid
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
		// inDashboard = false;
		navigateTo('/');
		console.log(data);
	})
	.catch((error) => {
		console.error('Error:', error);
	});
}

async function register() {
	var username = sanitizeInput(document.getElementById('signup-user').value);
	var password = sanitizeInput(document.getElementById('signup-pass').value);
	var re_pass = sanitizeInput(document.getElementById('re-pass').value);
	var email = sanitizeInput(document.getElementById('email').value);
	var csrftoken = getCookie('csrftoken');

	if (password !== re_pass){
		alert('Password and Repeat Password do not match');
		return;
	}

	if (username === '' || password === '' || email === ''){
		alert('Please fill in all fields');
		return;
	}

	await fetch('accounts/register/', {
		method: 'POST',
		headers: {
			'Content-Type' : 'application/json',
			'X-CSRFToken': csrftoken
		},
		body: JSON.stringify({
			username: username,
			password: password,
			email : email
		}),
	}).then(response => response.json())
		.then(data => {
			console.log(data);
			console.log("Register");
			alert("Account created successfully");
			var inputs = document.getElementsByTagName('input');
			for (var i = 0; i < inputs.length; i++) {
                inputs[i].value = '';
			}
			document.querySelector('input[id="tab-2"]').checked = false;
			document.querySelector('input[id="tab-1"]').checked = true;
		})
		.catch((error) => {
			console.error('Error: ', error);
		});
}

function sanitizeInput(input) {
	// Rimuovi markup HTML pericoloso
	var sanitizedInput = input.replace(/<[^>]*>/g, '');
	// Escape caratteri speciali per prevenire XSS
	sanitizedInput = sanitizedInput.replace(/[&<>"']/g, function(match) {
		return {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#x27;',
			"`": '&#x60;'
		}[match];
	});
	return sanitizedInput;
}

function getCookie(name) {
	let cookieValue = null;
	if (document.cookie && document.cookie !== '') {
		const cookies = document.cookie.split(';');
		for (let i = 0; i < cookies.length; i++) {
			const cookie = cookies[i].trim();
			if (cookie.substring(0, name.length + 1) === (name + '=')) {
				cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
				break;
			}
		}
	}
	return cookieValue;
}