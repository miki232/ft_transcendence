// import { getCookie, register, closeWebSocket } from "./utilities.js";
import User from "./views/User.js";
import { createNotification } from "./views/Notifications.js";
import Info, { getCSRFToken, getusename } from "./views/Info.js";
import MatchMaking from "./views/MatchMaking.js";
import Pong from "./views/TournamentPong.js"
import LocalGame from "./views/LocalGame.js";
import Online from "./views/Online.js";
import ChatRoom from "./views/ChatRoom.js";
import Tournament from "./views/Tournament.js";
// import Login from "./views/Login.js";
// import About from "./views/About.js";
// import Contact from "./views/Contact.js";
// import Dashboard from "./views/Dashboard.js";
// import Requests from "./views/Requests.js";
// import Room from "./views/Room.js";
// import { invite_to_play } from "./views/Room.js";
// import Friends from "./views/Friends.js";
// import AbstractView from "./views/AbstractView.js";
// import { getRequests, sendFriendRequest } from "./views/Requests.js";
// import { sendFriendRequest, acceptFriendRequest, declineFriendRequest, cancelRequest, removeFriend } from "./views/Friends.js"

// function activeLink(page) {
//     let oldActive = document.querySelector('a.active');
// 	if (oldActive) {
// 		oldActive.classList.remove('active');
// 	}
// 	let newActive = document.querySelector(`a[href="${page}"]`);
// 	newActive.classList.add('active');
// }

/*

LANGUAGE SWITCHER

<p id="greeting" data-en="Hello" data-it="Ciao"></p>
<p id="farewell" data-en="Goodbye" data-it="Addio"></p>


function setLanguage(lang) {
    document.querySelectorAll('[data-en]').forEach(el => {
        el.innerText = el.getAttribute(`data-${lang}`);
    });
}

// Imposta la lingua in base alla preferenza dell'utente
const userLanguage = navigator.language.startsWith('it') ? 'it' : 'en';
setLanguage(userLanguage);

*/

const container = document.querySelector("#container");
const nav = document.querySelector("header");
const content = document.querySelector("#content");
var user = new User();
let view = null;
var refreshRoomList;
var ws;
var localGame_Cache = {};
var Tournament_Cache = {};
// const room = new Room()
let room_name;
let room_match = null;
let username;
// let previousUrl = '';

// const checkRequest = async () => {
// 	var requestList = await getRequests();
// 	console.log(requestList);
// };

export const navigateTo = async url => {
	history.pushState(null, null, url);
	// previousUrl = url;
	await router();
};

// document.getElementById('languageSwitcher').addEventListener('change', (event) => {
//     changeLanguage(event.target.value);
// });

// Set initial language based on user preference or default

// export async function changeLanguage(language) {
//     localStorage.setItem('language', language);
//     console.log(language);
//     try {
//         const module = await import(`./languagepak/${language}.lang.js`);
//         const translations = module.default;

//         document.querySelectorAll('[data-translate]').forEach(element => {
//             const key = element.getAttribute('data-translate');
//             let translation = translations[key];

//             if (translation) {
//                 // Replace placeholders in the translation with dynamic content if any
//                 translation = translation.replace(/\$\{(.*?)\}/g, (_, expression) => {
//                     try {
//                         return eval(expression);
//                     } catch (error) {
//                         console.error(`Error evaluating expression: ${expression}`, error);
//                         return '';
//                     }
//                 });

//                 // Replace only text nodes while preserving the order of other nodes
//                 let childNodes = Array.from(element.childNodes);
//                 let textNodes = childNodes.filter(child => child.nodeType === Node.TEXT_NODE);
//                 let nonTextNodes = childNodes.filter(child => child.nodeType !== Node.TEXT_NODE);

//                 // Update text nodes
//                 if (textNodes.length > 0) {
//                     textNodes.forEach(textNode => {
//                         textNode.nodeValue = translation;
//                     });
//                 } else {
//                     const textNode = document.createTextNode(translation);
//                     if (nonTextNodes.length > 0) {
//                         element.insertBefore(textNode, nonTextNodes[0]);
//                     } else {
//                         element.appendChild(textNode);
//                     }
//                 }
//             }
//         });
//     } catch (error) {
//         console.error(`Error loading language pack: ${error}`);
//     }
// }

export async function changeLanguage(language) {
    localStorage.setItem('language', language);
    console.log(language);
    try {
        const module = await import(`./languagepak/${language}.lang.js`);
        const translations = module.default;

        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            let translation = translations[key];

            if (translation) {
                // Replace placeholders in the translation with dynamic content if any
                translation = translation.replace(/\$\{(.*?)\}/g, (_, expression) => {
                    try {
                        return eval(expression);
                    } catch (error) {
                        console.error(`Error evaluating expression: ${expression}`, error);
                        return '';
                    }
                });

                // If the element is an input and has a placeholder, translate the placeholder
                if (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) {
                    element.setAttribute('placeholder', translation);
                } else {
                    // Replace only text nodes while preserving the order of other nodes
                    let childNodes = Array.from(element.childNodes);
                    let textNodes = childNodes.filter(child => child.nodeType === Node.TEXT_NODE);
                    let nonTextNodes = childNodes.filter(child => child.nodeType !== Node.TEXT_NODE);

                    // Update text nodes
                    if (textNodes.length > 0) {
                        textNodes.forEach(textNode => {
                            textNode.nodeValue = translation;
                        });
                    } else {
                        const textNode = document.createTextNode(translation);
                        if (nonTextNodes.length > 0) {
                            element.insertBefore(textNode, nonTextNodes[0]);
                        } else {
                            element.appendChild(textNode);
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error(`Error loading language pack: ${error}`);
    }
}


// changeLanguage(user.language);
// document.getElementById('languageSwitcher').value = userLang;
	// const is_loggedin = async () => {
		//     var csrftoken = getCookie('csrftoken');
		
		//     return fetch('/accounts/user_info/', {
			//         method: 'GET',
			//         headers: {
				//             'Content-Type' : 'application/json',
				//             'X-CSRFToken': csrftoken
				//         }
				//     })
				//     .then(response => {
					//         if (response.ok) {
						//             return true;
						//         } else {
							//             return false;
							//         }
							//     });
							// };
							
function wsConnection() {
	if (!ws){
		ws	= new WebSocket('wss://'
		+ window.location.hostname
		+ ':8000'
		+ '/ws/notifications'
		+ '/');
	}
	ws.onmessage = function(event) {
		const data = JSON.parse(event.data);
		console.log(event);
		console.log(data.content);
		if (data.read === false){
			// alert(data.content);
			createNotification(data.content);
			ws.send(JSON.stringify({'action': "read"}));
		}
	}
}

const router = async () => {
	console.log(user.lastURL);
	user.loadUserData();
	console.log(user, user.language);

	wsConnection();

	if (location.pathname.includes("/user_info")) {
		let count = location.pathname.split("/").length - 1;
		if (count === 2) {
			var userID = location.pathname.split("_")[2];
		} else if (count === 3) {
			var userID = location.pathname.split("_")[2].split("/")[0];
		}
	}

	if (location.pathname.includes("/chat")) {
		var room_name = location.pathname.split("/")[2];
		console.log(room_name);
	}

	if (!location.pathname.includes(user.local_room) && user.local_ws) {
        document.querySelector('header').style.display = 'block';
		document.querySelector('body').classList.remove('game-bg');
		user.local_room = null;
		await user.local_ws.close();
		// user.lastURL = null;
	}

	const routes = [
		// { path: "/404", view: NotFound},
		{ path: "/", view: () => import('./views/Login.js') },
        { path: "/about", view: () => import('./views/About.js') },
		{ path: "/chat", view: () => import('./views/Chat.js') },
		{ path: "/chat/" + room_name, view: () => import('./views/ChatRoom.js') },
        { path: "/contact", view: () => import('./views/Contact.js') },
        { path: "/dashboard", view: () => import('./views/Dashboard.js') },
		{ path: "/dashboard/history", view: () => import('./views/History.js')},
        { path: "/dashboard/settings", view: () => import('./views/Settings.js') },
        { path: "/dashboard/requests", view: () => import('./views/Requests.js') },
		{ path: "/local_game", view: () => import('./views/LocalGame.js')},
        { path: "/friends", view: () => import('./views/Friends.js') },
        { path: "/friends/user_info_" + userID, view: () => import('./views/User_Info.js') },
        { path: "/friends/user_info_" + userID + "/history", view: () => import('./views/History.js') },
        { path: "/online", view: () => import('./views/Online.js') },
		{ path: "/online/matchmaking", view: () => import('./views/MatchMaking.js')},
		{ path: "/tournament", view: () => import('./views/Tournament.js')},
		{ path: "/pong_tournament", view: () => import('./views/TournamentPong.js')},
		{ path: "/online/friendly_match", view: () => import('./views/FriendlyMatch.js')},
		{ path: "/local_game/1P-vs-CPU/" + user.local_room, view: () => import('./views/PongCpu.js')},
		{ path: "/local_game/1P-vs-2P/" + user.local_room, view: () => import('./views/Localpong.js')},
		{ path: "/local_game/tournament", view: () => import('./views/TournamentLocal.js')},
		// { path: "/game", view: () => import('./views/Localpong.js')}
	];

	if (user.game_ws) {
		console.log("GAME_WS EXIT:", user.game_ws);
		await user.game_ws.close();
	}
	
	// Added for Close websocekt when Tournament is Available but the user choose the 1v1
	
	// if (view instanceof Pong) {
	// 	view.closeWebSocket();
	// 			// Ho fatto questo per non far rimanere il canvas di pong quando si torna da pong
	// 			// if (window.location.pathname === "/matchmaking") {
	// 				// 	// const canvas = document.getElementById("pongCanvas").remove();
	// 				// 	// container.insertAdjacentHTML("beforeend", "<div id = 'content'></div>");
	// 	// 	navigateTo("/online");
	// 	// }
	// }
	// if (view instanceof LocalGame) {
	// 		await view.closeWebSocket();
	// }

	const potentialMatches = routes.map(route => {
		return {
			route: route,
			isMatch: location.pathname === route.path
		};
	});
	console.log("dsmdainstanceofskmdslkmsdmlkdslkmsa", user.lastURL);

	let match = potentialMatches.find(potentialMatch => potentialMatch.isMatch);
	try {
		if (view instanceof Online && match.route.path !== "/tournament")
			{
				view.closeWebSocket();
				console.log("DISCONNESIONE DALLA WEBSOCKET");
			}
		console.log("dsmdainstanceofskmdslkmsdmlkdslkmsa", user.lastURL);

		if (user.lastURL === "/tournament" && match.route.path !== "/tournament")
			{
				user.lastURL = null;
				console.log(view);
				user.ws_tournament.close();
				document.querySelector("header").style.display = "block";
                document.querySelector("body").classList.remove("game-bg");
				console.log("DISCONNESIONE DALLA WEBSOCKET DEL TORNEO");
			}
		if (view instanceof ChatRoom && match.route.path !== "/chat/")
			{
				view.closeWebSocket();
				console.log("DISCONNESIONE DALLA WEBSOCKET DEllA CHAT");
			}
		if (user.matchmaking_ws && match.route.path !== "/tournament"){
			console.log("MATCHMAKING_WS EXIT:", user.matchmaking_ws);
			await user.matchmaking_ws.close();
		}
	} catch {
		console.log("THERE IS NO MATCHMAKING_WS");
	}
	// if (previousUrl === "/pong" && match.route.path === "/matchmaking") {
	// 	// history.replaceState(null, null, "/online");
	// 	console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
	// 	history.back();
	// 	// previousUrl = match.route.path;
	// }
	// else if (user.lastURL === "/1P-vs-CPU") {
	// 	match = {
	// 		route: routes[7],
	// 		isMatch: true
	// 	};
	// 	console.log(match.route.path);
	// 	user.lastURL = null;
	// }
	if (user.lastURL === "/1P-vs-2P") {
		match = {
			route: routes[7],
			isMatch: true
		};
		user.lastURL = null;
	}
	else if (user.lastURL === "/pong") {
		match = {
			route: routes[13],
			isMatch: true
		};
		document.querySelector('header').style.display = 'block';
		document.querySelector('body').classList.remove('game-bg');
		user.disconnected === true ? createNotification("You have been disconnected from the game", "error") : user.disconnected = true;
		user.lastURL = null;
	}
	if (!match) {
		match = {
			route: routes[0],
			isMatch: true
		};
	}
	console.log(match.route.path);

	switch (match.route.path) {
		case "/":
			await user.isLogged() === true ? navigateTo("/dashboard") : null;
			const LoginClass = await match.route.view();
			view = new LoginClass.default(user);
			break;
		case "/about":
			await user.isLogged() === true ? navigateTo("/dashboard") : null;
			const AboutClass = await match.route.view();
			view = new AboutClass.default();
			break;
		case "/contact":
			await user.isLogged() === true ? navigateTo("/dashboard") : null;
			const ContactClass = await match.route.view();
			view = new ContactClass.default();
			break;
		case "/dashboard":
			await user.isLogged() === false ? navigateTo("/") : await user.loadUserData();
			const DashboardClass = await match.route.view();
			view = new DashboardClass.default(user);
			break;
		case "/dashboard/history":
			await user.isLogged() === false ? navigateTo("/") : await user.loadUserData();
			const HistoryClass = await match.route.view();
			view = new HistoryClass.default(user, user);
			break;
		case "/dashboard/settings":
			await user.isLogged() === false ? navigateTo("/") : await user.loadUserData();
			const SettingsClass = await match.route.view();
			view = new SettingsClass.default(user);
			break;
		case "/dashboard/requests":
			await user.isLogged() === false ? navigateTo("/") : await user.loadUserData();
			const RequestsClass = await match.route.view();
			view = new RequestsClass.default(user);
			break;
		case "/local_game":
			await user.isLogged() === false ? navigateTo("/") : await user.loadUserData();
			const LocalClass = await match.route.view();
			view = new LocalClass.default(user);
			break;
		case "/friends":
			await user.isLogged() === false ? navigateTo("/") : await user.loadUserData();
			const FriendsClass = await match.route.view();
			view = new FriendsClass.default(user);
			break;
		case `/friends/user_info_${userID}`:
			await user.isLogged() === false ? navigateTo("/") : await user.loadUserData();
			const InfoClass = await match.route.view();
			view = new InfoClass.default(userID, user);
			break;
		case `/friends/user_info_${userID}/history`:
			await user.isLogged() === false ? navigateTo("/") : await user.loadUserData();
			console.log(userID);
			const UserInfoHistoryClass = await match.route.view();
			view = new UserInfoHistoryClass.default(userID, user);
			break;
		case "/online":
			await user.isLogged() === false ? navigateTo("/") : await user.loadUserData();
			const OnlineClass = await match.route.view();
			view = new OnlineClass.default(user, ws);
			break;
		case "/online/matchmaking":
			await user.isLogged() === false ? navigateTo("/") : await user.loadUserData();
			// if (previousUrl === "/pong")
			// 	break;
			const MatchMakingClass = await match.route.view();
			view = new MatchMakingClass.default(user);
			// console.log("OSU", room_name);
			break;
		case "/online/friendly_match":
			await user.isLogged() === false ? navigateTo("/") : await user.loadUserData();
			const FriendlyMatchClass = await match.route.view();
			view = new FriendlyMatchClass.default(user);
			break;
		case "/local_game/1P-vs-CPU/" + user.local_room:
			await user.isLogged() === false ? navigateTo("/") : await user.loadUserData();
			const PongCpuClass = await match.route.view();
			view = new PongCpuClass.default(user, user.local_opponent, user.local_room, user.local_ws);
			break;
		case "/local_game/1P-vs-2P/" + user.local_room:
			await user.isLogged() === false ? navigateTo("/") : await user.loadUserData();
			const LocalPongClass = await match.route.view();
			view = new LocalPongClass.default(user, user.local_opponent, user.local_room, user.local_ws);
			break;
		// case "/pong":
		// 	const PongClass = await match.route.view();
		// 	view = new PongClass.default(user);
		// 	content.innerHTML = await view.getContent();
		// 	await view.loop();
		// 	break;
		// case "/pong_tournament":
		// 	///** DA rivisitare */
		// 	// document.body.classList.remove("body");
		// 	// document.body.classList.add("bodypong");
		// 	// document.getElementById("container").classList.add("containerpong");
		// 	// document.getElementById("container").removeAttribute("id");
		// 	//***sdassdad */
		// 	console.log("SUCASD", match.route.view(), match.route.path, user, room_name);
		// 	const Pong_tournamentClass = await match.route.view();
		// 	view = new Pong_tournamentClass.default(user, room_name);
		// 	content.innerHTML = await view.getContent();
		// 	await view.loop();
		// 	break;
		case "/tournament":
			const TournamentClass = await match.route.view();
			console.log(user.matchmaking_ws);
			view = new TournamentClass.default(user, user.matchmaking_ws);
			content.innerHTML = await view.getContent();
			room_name = await view.getRoom_Match();
			// console.log("OSU", room_name);
			// if (room_name !== null) navigateTo("/pong_tournament");
			break;
		case "/local_game/tournament":
			await user.isLogged() === false ? navigateTo("/") : await user.loadUserData();
			const TournamentLocalClass = await match.route.view();
			view = new TournamentLocalClass.default(user, user.local_ws);
			break;
		case "/chat":
			await user.isLogged() === false ? navigateTo("/") : null;
			const ChatClass = await match.route.view();
			view = new ChatClass.default(user);
			break;
		case "/chat/" + room_name:
			await user.isLogged() === false ? navigateTo("/") : null;
			const ChatRoomClass = await match.route.view();
			view = new ChatRoomClass.default(user, room_name);
			break;
		// case "/game":
		// 	const LocalPongClass = await match.route.view();
		// 	view = new LocalPongClass.default(localGame_Cache["user"], localGame_Cache["opponent"], "prova", localGame_Cache["ws_connection"]);
		// 	content.innerHTML = await view.getContent();
		// 	await view.loop();
		// 	break;
		default:
			user.isLogged() === true ? navigateTo("/dashboard") : navigateTo("/");
	}
	console.log(localStorage.getItem('language'));
	if (user.language == undefined) {
		await changeLanguage(localStorage.getItem('language'));
	}
	else
		await changeLanguage(user.language);

};

window.addEventListener("popstate", async () => {
	await router();
});
//** API per le History Dei Match*/
// https://127.0.0.1:8001/accounts/match_history/?username=<USERNAME>
// URL per vedere la history dei match,
// tramite il parametro <USERNAME> si può vedere la history dei match di quell'utente
///*/

document.addEventListener("DOMContentLoaded", () => {
	
	document.body.addEventListener("click", async (e) => {
		const form_box = document.querySelector(".form-box");
		const dashboard = document.querySelector(".dashboard");
		
		if (e.target.matches(".toggler-icon")) {
			const navbarCollaspe = document.querySelector("#navbarNavDropdown");
			const spanToggler = document.querySelector(".navbar-toggler-icon");
			if (navbarCollaspe.classList.contains("show-navbar")) {
				setTimeout(() => {
					spanToggler.innerHTML = '<ion-icon name="menu-outline" class="toggler-icon"></ion-icon>';
					navbarCollaspe.classList.remove("show-navbar");
				}, 400);
			} else {
				spanToggler.innerHTML = '<ion-icon name="close-outline" class="toggler-icon"></ion-icon>';
				navbarCollaspe.classList.add("show-navbar");
			}
		}
		// if (e.target.matches("#play-local")) {
		// 	localGame_Cache["ws_connection"] = await view.getWebSocket();
		// 	localGame_Cache["user"] = view.getUser();
		// 	localGame_Cache["opponent"] = view.getOpponent();
		// }
		if (e.target.matches("#Tournament")) {
			Tournament_Cache["ws"] = await view.getWebSocket();
			console.log(Tournament_Cache["ws"]);
		}
		if (e.target.matches(".info")) {
			e.preventDefault();
			dashboard.classList.add("change-view");
		}
		// if (e.target.matches("#requests-btn")) {
		// 	e.preventDefault();
		// 	dashboard.classList.add("change-view");
		// }
		if (e.target.matches("#settings-btn")) {
			e.preventDefault();
			dashboard.classList.add("change-setting");
		}
		if (e.target.matches(".login-btn")) {
			e.preventDefault();
			form_box.classList.remove("change-form");
		}
		// if (e.target.matches("#back") || e.target.matches("#remove")) {
		// 	e.preventDefault();
		// 	navigateTo("/dashboard");
		// }
		if (e.target.matches("[data-link]")) {
			e.preventDefault();
			navigateTo(e.target.href);
		}
		if (e.target.matches(".nav-toggle")) {
			const navLinks = document.querySelector(".nav-links");
			navLinks.classList.add("nav-links-toggle");
			navLinks.style.display = "flex";

		}
		// if (e.target.matches("#login-btn")) {
		// 	e.preventDefault();
		// 	await user.validateLogin();
		// 	console.log(user.logged);
		// 	if (user.logged === true) {
		// 		console.log("LOGGATO OK");
		// 		navigateTo("/dashboard");
		// 	}
		// }
		if (e.target.matches("#createRoomBtn")) {
			console.log("SUCA");
		}
		if (e.target.matches("#cancel-request")){
			e.preventDefault();
			await renderDashboard("friends");
		}
		if (e.target.matches("#decline-request")){			
			e.preventDefault();
			await renderDashboard("friends");
		}
		if (e.target.matches("#Accept-request")){
			e.preventDefault();
			await renderDashboard("friends");
		}
		if (e.target.matches("#Remove-friend"))//**si può levare forse */
			await renderDashboard("friends");
		// if (e.target.matches("#friendBtn")){
		// 	e.preventDefault();
		// 	let user = document.getElementById("friendNameInput").value;
		// 	if (user)
		// 		renderDashboard("friend_info", user);
		// 	else
		// 		alert("Please provide a username")
		// }
		// if (e.target.matches("#register-btn")) {
		// 	console.log("FANCULO!");
		// 	await register();
		// }
		if (e.target.matches("#logout-btn")) {
			ws.close();
			await user.logout();
			navigateTo("/");
		}
		// if (e.target.closest(".nav-button")) {
		// 	let selected = e.target.id;
		// 	if (!selected) {
		// 		selected = e.target.parentElement.id;
		// 	}
		// 	console.log(selected);
		// 	await renderDashboard(selected);
		// }
		// if (e.target.matches("#nav-title")) {
		// 	await renderDashboard("dashboard");
		// }
		// if (e.target.matches("#nav-footer-title")) {
		// 	let user = document.getElementById("nav-footer-title").innerHTML;
		// 	await renderDashboard("friend_info", user);
		// }
		// if (e.target.matches("a[href='/user_info']")){
		// 	e.preventDefault();
		// 	let friend_name = e.target.getAttribute('data-username');
		// 	await renderDashboard("friend_info", friend_name);
		// 	history.pushState(null, '', '/user_info');
		// }
		///////////////////NOUOVA PARTE////////////////////////
		//// Manda una richiesta POST per creare una room /////
		//// con "Friend Username" che è il nome dell'amico ///
		//// e    "selfuser" è il nome dell'utente attuale ////
		///////////////////////////////////////////////////////
		if (e.target.matches('#game'))
		{
			try {
				var Friend_username = document.querySelector(".user-info h3").innerHTML;
			}
			catch {
				var Friend_username = document.querySelector(".profile-link").textContent;
			}

			console.log(Friend_username);
			let selfuser = await getusename() // Per ora lascio Admin, ma è solo per provare, è da sostituire con l'username reale di chi sta cliccand PLAY
			console.log(selfuser);
			send_game_request(Friend_username, selfuser);
		}
		/////////////////
	});
	router();
});

//////////////
///Quando invia una richiesta, oltre a creare una room
///Viene creata ed inviata una notifica all'utente che si sfida
async function send_game_request(receiver, selfuser)
{
	let csr = await getCSRFToken();
	const data = {
		name: "1",
		created_by: selfuser,
		to_fight: receiver
	};

	// Send the POST request
	fetch('/pong/create/', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-CSRFToken': csr
			// Add any other necessary headers, such as CSRF token
		},
		body: JSON.stringify(data)
	})
	.then(response => {
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		createNotification("Request sent to " + receiver);
		return response.json();
	})
	.then(data => {
		// Handle the respons
		console.log(data.name);
		// window.location.href = "/pong/" + data.name + "/";
	})
	.catch(error => {
		// Handle the error
		createNotification("Alredy sent a request to this user");
	});
}

// content.addEventListener("click", e => {
// 	if (e.target.matches("#signup")) {
// 		register();
// 	}
// 	// console.log("sudsa", e.target);
// 	if (e.target.matches("#logout")) {
// 		logout();
// 	}
// });

// async function renderDashboard(render, addArg = null) {
// 	var view;
// 	switch(render) {
// 		case "rooms":
// 			if (!(view instanceof Room)) {
// 				view = new Room();
// 			}
// 			content.innerHTML = await view.getContent();
// 			if (refreshRoomList) {
// 				clearInterval(refreshRoomList);
// 			}
			
// 			view.updateRoomList();
// 			refreshRoomList = setInterval(() => {
// 					view.updateRoomList();
// 					console.log("Room list updated");
// 			}, 5000);
// 			document.getElementById("createRoomBtn").addEventListener("click", view.btnCreateRoom);
// 			break;
// 		case "friends":
// 			if (refreshRoomList) clearInterval(refreshRoomList);
// 			view = new Friends();
// 			content.innerHTML = await view.getContent();
// 			await view.loadData();
// 			await view.getPendingRequests();
// 			await view.getFriendList();
// 			var friendNameInput = document.getElementById("friendNameInput");
// 			var dataList = document.createElement("datalist");
// 			dataList.id = "users";
// 			friendNameInput.setAttribute("list", "users");
// 			friendNameInput.parentNode.insertBefore(dataList, friendNameInput.nextSibling);

// 			friendNameInput.addEventListener("input", function() {
// 				var inputText = this.value
// 				fetch(`https://127.0.0.1:8001/accounts/search/?q=${inputText}`)
// 				.then(response => {
// 					if (response.status == "404"){
// 						throw new Error('NO user FOund!');
// 					}
// 					return response.json();
// 				})
// 				.then(data => {
// 					// Clear the datalist
// 					dataList.innerHTML = "";
		
// 					// Add the users to the datalist
// 					data.forEach(function(user) {
// 						var option = document.createElement("option");
// 						option.value = user.username; // Replace with the actual property name for the username
// 						dataList.appendChild(option);
// 					});
// 				})
// 				.catch(error => {
// 					console.log('Error', error);
// 					alert("Not Found!");
// 				}
// 				);
				
// 			})
// 			break;
// 		case "friend_info":
// 			if (refreshRoomList) clearInterval(refreshRoomList);
// 			try {
// 				view = new Info(addArg);
// 				content.innerHTML = await view.getContent();
// 				try{
// 					document.getElementById("sendFriendRequestButton").addEventListener("click", function() {
// 						sendFriendRequest(view.username);
// 						renderDashboard("friend_info", view.username);
// 					});
// 				}
// 				catch{
// 					try{
// 						/**Play: visibile solo se amici, e crea una room con <"Nome utente di chi manda", "Sfidante">
// 						 * quando chi manda clicca su Play(Invite to play) e laaromm è stata generata, viene indirizzato
// 						 * alla room e aspetta che lo sfidante si colleghi alla stessa room per giocare.
// 						 * Allo sfidante, quando visita il profilo di manda la richiesta, compare "X ti sta sfidando"
// 						 * se clicca lo porta alla room
// 						 */
// 						document.getElementById("Acceptrequest").addEventListener("click", function() {
// 							acceptFriendRequest(view.username);
// 							renderDashboard("friend_info", view.username);
// 						});
// 						document.getElementById("Declinerequest").addEventListener("click", function() {
// 							console.log("PRova");
// 							declineFriendRequest(view.username);
// 							renderDashboard("friend_info", view.username);
// 						});
// 					}
// 					catch{
// 						document.getElementById("Cancelrequest").addEventListener("click", function() {
// 							cancelRequest(view.username);
// 							renderDashboard("friend_info", view.username);
// 						});
// 						/**non fare nulla */
// 					}
// 				}
// 			} catch {
// 				document.getElementById("RemoveFriend").addEventListener("click", function() {
// 				removeFriend(view.username);
// 				renderDashboard("friend_info", view.username);
// 				});
// 				document.getElementById("Play").addEventListener("click", function() {
// 					invite_to_play(view.selfuser, addArg);
// 					renderDashboard("friend_info", view.username);
// 				});
// 				// console.error('Error', error);
// 				// renderDashboard("friends");
// 			}
// 			break;
// 		default:
// 			if (refreshRoomList) clearInterval(refreshRoomList);
// 			view = new Dashboard();
// 			content.innerHTML = await view.getContent();
// 	}
// }

