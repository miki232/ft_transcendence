const content = document.getElementById('content');
const loginHTML = `
<div class="login-wrap">
    <div class="login-html">
    	<input id="tab-1" type="radio" name="tab" class="sign-in" checked><label for="tab-1" class="tab">Sign In</label>
      	<input id="tab-2" type="radio" name="tab" class="sign-up"><label for="tab-2" class="tab">Sign Up</label>
      	<div class="login-form">
      	  	<div class="sign-in-htm">
      	    	<div class="group">
      	    	  <label for="user" class="label">Username</label>
      	    	  <input id="user" type="text" class="input">
      	    	</div>
      	    	<div class="group">
      	    	  <label for="pass" class="label">Password</label>
      	    	  <input id="pass" type="password" class="input" data-type="password">
      	    	</div>
      	    	<div class="group">
      	    	  <input type="submit" class="button" value="Sign In">
      	    	</div>
			  	<div class="group" id="forgot">
			  		<a href="#forgot">Forgot Password?</a>
				</div>		
      	    	<div class="hr"></div>
      	    	<div class="foot-lnk">
					<a href="#42-login">Login with 42 intra account</a>
      	    	</div>
      	 	</div>
      	  	<div class="sign-up-htm">
      	    	<div class="group">
      	    		<label for="user" class="label">Username</label>
      	    		<input id="user" type="text" class="input">
      	    	</div>
      	    	<div class="group">
      	    		<label for="pass" class="label">Password</label>
      	    		<input id="pass" type="password" class="input" data-type="password">
      	    	</div>
      	    	<div class="group">
      	    		<label for="re-pass" class="label">Repeat Password</label>
      	    		<input id="re-pass" type="password" class="input" data-type="password">
      	    	</div>
      	    	<div class="group">
      	    		<label for="email" class="label">Email Address</label>
      	    		<input id="email" type="text" class="input">
      	    	</div>
      	    	<div class="group">
      	    		<input type="submit" class="button" value="Sign Up">
      	    	</div>
      	    	<div class="hr"></div>
      	    	<div class="foot-lnk">
      	    	  <label for="tab-1">Already Member?</a>
      	    	</div>
      	  	</div>
      	</div>
    </div>
  </div>
`;
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
};

function loadContent(response) {
	var newContent = response.title + response.content;
	content.innerHTML = newContent;
}

function requestContent(page) {
	var xhr = new XMLHttpRequest();

	xhr.open('GET', 'data/' + page + '.json', true);
	xhr.onreadystatechange = function() {
		if (xhr.readyState === 4 && xhr.status === 200) {
			responseObject = JSON.parse(xhr.responseText);
			loadContent(responseObject);
		}
	};
	xhr.send(null);
	
};

function loadPage(page) {
	const oldActive = document.querySelector('a.active');
	if (oldActive) {
		oldActive.classList.remove('active');
	}
	const newActive = document.querySelector('a[href="#' + page + '"]');
	newActive.classList.add('active');
	if (page === 'home') {
		content.innerHTML = loginHTML;
	}
	else {
		requestContent(page);
	}
	// history.pushState(null, "", "/" + page);
};

window.onpopstate = function() {
	var path = window.location.hash.substring(1);
	console.log(path);
	if (!path) {
		path = 'home';
		window.location.hash = path;
	}
	loadPage(path);
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