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
      	    	  <input id="login-user" type="text" class="input">
      	    	</div>
      	    	<div class="group">
      	    	  <label for="pass" class="label">Password</label>
      	    	  <input id="login-pass" type="password" class="input" data-type="password">
      	    	</div>
      	    	<div class="group">
      	    	  <input type="submit" id="login" onclick="login()" class="button" value="Sign In">
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
      	    		<input id="signup-user" type="text" class="input">
      	    	</div>
      	    	<div class="group">
      	    		<label for="pass" class="label">Password</label>
      	    		<input id="signup-pass" type="password" class="input" data-type="password">
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
      	    		<input type="submit" onclick="register()"  class="button" value="Sign Up">
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
// Questo è un esempio di come utilizzare le mie API, il getCookie capisci da solo a che serve
// ma ogni volta che si fa una richiesta bisogna passargli anche il cookie CSRF
// e non so ancora se devo anche passare il cookie di sessione
// ho aggiunto sul bottone Sig-in che quando viene cliccato richiama la funzione login()

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

function register(){
	var username = document.getElementById('signup-user').value;
	var password = document.getElementById('signup-pass').value;
	var re_pass = document.getElementById('re-pass').value;
	var email = document.getElementById('email').value;
	var csrftoken = getCookie('csrftoken');

	if (password !== re_pass){
		alert('Password and Repeat Password do not match');
		return;
	}

	fetch('accounts/register/', {
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
		.then(data => console.log(data))
		.catch((error) => {
			console.error('Error: ', error);
		});
}

function login(){
	var username = (document.getElementById('login-user').value);
	var password = (document.getElementById('login-pass').value);
	var csrftoken = getCookie('csrftoken');


	fetch('accounts/login/', {
		method: 'POST',
		headers: {
			'Content-Type' : 'application/json',
			'X-CSRFToken': csrftoken
		},
		body: JSON.stringify({
			username: username,
			password: password
		}),
	}).then(response => {
		response.json();
		console.log(response);
		if (response.status === 200) {
			loadDashboard();
		} else {
			alert('Wrong username or password');
		}
	})
		.then(data => console.log(data))
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
};

function loadContent(response) {
	var newContent = response.title + response.content;
	content.innerHTML = newContent;
}

function requestContent(page) {
	var xhr = new XMLHttpRequest();

	xhr.open('GET', 'static/data/' + page + '.json', true);
	xhr.onreadystatechange = function() {
		if (xhr.readyState === 4 && xhr.status === 200) {
			responseObject = JSON.parse(xhr.responseText);
			loadContent(responseObject);
		}
	};
	xhr.send(null);
	
};

// function loadPage(page) {
// 	const oldActive = document.querySelector('a.active');
// 	if (oldActive) {
// 		oldActive.classList.remove('active');
// 	}
// 	const newActive = document.querySelector('a[href="#' + page + '"]');
// 	newActive.classList.add('active');
// 	if (page === 'home') {
// 		content.innerHTML = loginHTML;
// 	}
// 	else {
// 		requestContent(page);
// 	}
// 	// history.pushState(null, "", "/" + page);
// };

// window.onpopstate = function() {
// 	var path = window.location.hash.substring(1);
// 	console.log(path);
// 	if (!path) {
// 		path = 'home';
// 		window.location.hash = path;
// 	}
// 	loadPage(path);
// };

// window.onload = function() {
// 	var path = location.hash.substring(1);
// 	console.log(path);
// 	if (path) {
// 		loadPage(path);
// 	} else {
// 		window.location.hash = 'home';
// 		loadPage('home');
// 	}
// };

function loadDashboard() {
	csrftoken = getCookie('csrftoken')
	fetch('accounts/user_info/', {
		method: 'GET',
		headers: {
			'Content-Type' : 'application/json',
			'X-CSRFToken': csrftoken
		}
	})
		.then(response => response.json())
		.then(data => {
			content.innerHTML = `
				<p>Username: ${data.username}</p>
				<p>Email: ${data.email}</p>
				<p>First Name: ${data.first_name}</p>
				<p>Last Name: ${data.last_name}</p>
			`;
			console.log(data);
		})
		.catch((error) => {
			console.error('Error:', error);
		});
};


function logout(){
	csrftoken = getCookie('csrftoken')
	fetch('accounts/logout/', {
		method: 'POST',
		headers: {
			'Content-Type' : 'application/json',
			'X-CSRFToken': csrftoken
		}
	})
		.then(response => {
			if (response.status !== 204)
				response.json()})
		.then(data => {
			console.log(data);
		})
		.catch((error) => {
			console.error('Error:', error);
		});
}

function activeLink(page) {
	let oldActive = document.querySelector('a.active');
	if (oldActive) {
		oldActive.classList.remove('active');
	}
	let newActive = document.querySelector(`a[name="${page}"]`);
	newActive.classList.add('active');
}
//Ho aggiunto che se la pagina richiesta è login, fa un fetch a userinfo
//se ritorna uno stato differente a 200 vuol dire che l'utente
// deve ancora fare il login, se è già loggato direttamente 
// riporta le info e non richiede di fare il login. 
// sicuramente c'è un metodo migliore ma era solo un test

function goToPage(page) {
	if (page === 'index') {
		page = 'login';
		// history.replaceState({ page: 'index' }, "", "/");
	}
	if (page === 'login')
	{
		csrftoken = getCookie('csrftoken')
		fetch('accounts/user_info/', {
			method: 'GET',
			headers: {
				'Content-Type' : 'application/json',
				'X-CSRFToken': csrftoken
			}
		}).then(response => {
			if (response.status !== 200) {
				throw new Error(`HTTP status ${response.status}`);
			}
			return response.json();
		})
		.then(data => {
			fetch(`pong/suca`)
				.then(response => response.text())
				.then(html => {
					document.getElementById('content').innerHTML = html;
					// history.pushState({ page }, "", `/${page}`);
					
					let script = document.createElement('script');
					script.src = '/static/pong.js';
					document.body.appendChild(script);
				})
				.catch((error) => {
					console.error('Error:', error);
			});
			console.log(data);
		})
		.catch((error) => {
			// console.error('Error:', error);
		});
	}
	console.log('DAJE');
	fetch(`static/data/${page}.html`)
		.then(response => response.text())
		.then(html => {
			activeLink(page);
			document.getElementById('content').innerHTML = html;
			// history.pushState({ page }, "", `/${page}`);
		})
		.catch((error) => {
			console.error('Error:', error);
	});
};

// window.onpopstate = function(event) {
// 	if (event.state && event.state.page) {
// 		console.log(event.state.page);
// 		goToPage(event.state.page);
// 	}
// 	else {
// 		goToPage('index');
// 	}
// };

window.onload = function() {
	let page = document.querySelector('a.active');
	console.log(page);
	if (page) {
		page.click();
	}
};
