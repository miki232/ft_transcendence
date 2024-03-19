import Login from "./views/Login.js";
import About from "./views/About.js";
import Contact from "./views/Contact.js";

function activeLink(page) {
    let oldActive = document.querySelector('a.active');
	if (oldActive) {
		oldActive.classList.remove('active');
	}
	let newActive = document.querySelector(`a[href="${page}"]`);
	newActive.classList.add('active');
}

const navigateTo = url => {
    history.pushState(null, null, url);
    router();
};

const router = async () => {
    const routes = [
        // { path: "/404", view: NotFound},
        { path: "/", view: Login },
        { path: "/about", view: About },
        { path: "/contact", view: Contact }
        // { path: "/Dashboard", view: Dashboard }
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

    const view = new match.route.view();
    document.querySelector("#content").innerHTML = await view.getHtml();
    
    // console.log(match.route.view());
};

window.addEventListener("popstate", router);

document.addEventListener("DOMContentLoaded", () => {
    document.body.addEventListener("click", e => {
        if (e.target.matches("[data-link")) {
            e.preventDefault();
            activeLink(e.target.href.substring(21));
            navigateTo(e.target.href);
        }
    });
    router();
});