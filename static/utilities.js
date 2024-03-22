export function getCookie(name) {
    console.log("getCookie called");
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

export function sanitizeInput(input) {
    console.log("sanitizeInput called");
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

export async function register() {
    console.log("register called");
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

export async function logout(){
    console.log("logout called");
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
		// navigateTo('/');
		console.log(data);
	})
	.catch((error) => {
		console.error('Error:', error);
	});
}
