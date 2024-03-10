const content = document.getElementById('content');

function loadContent() {
	const hash = window.location.hash.substring(1);
	switch (hash) {
		case 'signin':
			content.innerHTML = '<h1>Sign In</h1>';
			break;
		case 'signup':
			content.innerHTML = '<h1>Sign Up</h1>';
			break;
		default:
			content.innerHTML = '<h1>Home</h1>';
	}
}

window.addEventListener('hashchange', loadContent);

window.addEventListener('load', loadContent);