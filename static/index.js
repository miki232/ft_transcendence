import Login from "./views/Login.js";
import About from "./views/About.js";
import Contact from "./views/Contact.js";
import Dashboard from "./views/Dashboard.js";

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

const navigateTo = url => {
    history.pushState(null, null, url);
    router();
};

const router = async () => {
    const routes = [
        // { path: "/404", view: NotFound},
        { path: "/", view: Login },
        { path: "/about", view: About },
        { path: "/contact", view: Contact },
        { path: "/dashboard", view: Dashboard }
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
    // console.log(match.route.path);
    if (match.route.path === "/dashboard") {
        var view = new match.route.view();
        await view.validateLogin();
        if (view.isValid === true) {
            await view.loadUserData();
            nav.innerHTML = await view.getNav();
            document.querySelector("#user").innerHTML = await view.getUser();
            content.innerHTML = await view.getContent();
            document.querySelector("span").innerHTML = await view.getEmail();
            view.setTitle("Dashboard");
        }
    } else {
        const view = new match.route.view();
        nav.innerHTML = await view.getNav();
        content.innerHTML = await view.getContent();
    }
};

window.addEventListener("popstate", router);

document.addEventListener("DOMContentLoaded", () => {
    document.body.addEventListener("click", e => {
        if (e.target.matches("[data-link")) {
            e.preventDefault();
            if (e.target.matches("onclick")) {
                e.target.onclick();
            }
            navigateTo(e.target.href);
        }
    });
    router();
});

function logout(){
	var csrftoken = getCookie('csrftoken')
	fetch('accounts/logout/', {
		method: 'POST',
		headers: {
			'Content-Type' : 'application/json',
			'X-CSRFToken': csrftoken
		}
	})
	.then(response => {
		if (response.status !== 204) {
			throw new Error(`HTTP status ${response.status}`);
		}
		return response.json();
	})
	.then(data => {
		console.log(data);
	})
	.catch((error) => {
		console.error('Error:', error);
	});
}