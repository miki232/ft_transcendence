const content = document.getElementById('content');
// const navLinks = document.getElementsByClassName('link');

// function loadContent() {
// 	const hash = window.location.hash.substring(1);
// 	switch (hash) {
// 		case 'signin':
// 			content.innerHTML = '<h1>Sign In</h1>';
// 			break;
// 		case 'signup':
// 			content.innerHTML = '<h1>Sign Up</h1>';
// 			break;
// 		default:
// 			content.innerHTML = '<h1>Home</h1>';
// 	}
	
// }

// window.addEventListener('hashchange', loadContent);

// window.addEventListener('load', loadContent);

function loadContent(page) {
	var xhr = new XMLHttpRequest();

	xhr.open('GET', 'data/' + page + '.json', true);
	xhr.onreadystatechange = function() {
		if (xhr.readyState === 4 && xhr.status === 200) {
			responseObject = JSON.parse(xhr.responseText);
			var newContent = responseObject.title + responseObject.content;
			content.innerHTML = newContent;
		}
	};
	xhr.send(null);
	
};

function loadPage(page) {
	loadContent(page);
	// history.pushState(null, "", "/" + page);
};

window.onpopstate = function() {
	var path = window.location.hash.substring(1);
	console.log(path);
	if (!path) {
		path = 'home';
		window.location.hash = path;
	}
	loadContent(path);
};

window.onload = function() {
	var path = location.hash.substring(1);
	if (path) {
		loadPage(path);
	} else {
		window.location.hash = 'home';
		loadPage('home');
	}
};