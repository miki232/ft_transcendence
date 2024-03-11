const content = document.getElementById('content');
const navLinks = document.getElementsByClassName('link');

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
		else {
			console.log("ERROR: " + page);
		}
	};
	xhr.send(null);
	
};

navLinks.onclick = function(e) {
	e.preventDefault();
	var hash = this.href.lastIndexOf('#');
	console.log(hash);
	loadContent(hash);
	history.pushState(null, null, hash);
};

window.onpopstate = function() {
	var path = location.pathname;
	loadContent(path);
};

window.onload = function() {
	loadContent('home');
};