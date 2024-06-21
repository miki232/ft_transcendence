import { createNotification } from "./views/Notifications.js";

export function getCookieRegister(name) {
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

export async function getCookie() {
		let csrftoken = await fetch("csrf-token")
			.then(response => response.json())
			.then(data => data.csrfToken);
			console.log(csrftoken);
		return csrftoken;
	}

async function getCSRFToken() {
        let csrftoken = await fetch("/csrf-token")
            .then(response => response.json())
            .then(data => data.csrfToken);
            // console.log(csrftoken);
        return csrftoken;
    }

export async function sanitizeInput(input) {
	// Rimuovi markup HTML pericoloso
	// var sanitizedInput = input.replace(/<[^>]*>/g, '');
	// // Escape caratteri speciali per prevenire XSS
	// sanitizedInput = sanitizedInput.replace(/[&<>"']/g, function(match) {
	// 	return {
	// 		'&': '&amp;',
	// 		'<': '&lt;',
	// 		'>': '&gt;',
	// 		'"': '&quot;',
	// 		"'": '&#x27;',
	// 		"`": '&#x60;'
	// 	}[match];
	// });
	// return sanitizedInput;
    return await fetch("/sanity/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": await getCSRFToken()
        },
        body: JSON.stringify({ "input": input })
    })
    .then(response => response.json())
    .then(data => {
        // Handle response data
        console.log(data);
        // Print the response
        return data.sanitized_input;
    })
    .catch(error => {
        // Handle error
        console.error(error);
    });
}

export async function register() {
    const usernameInput = document.getElementById('signup-user');
    const passwordInput = document.getElementById('signup-pass');
    const emailInput = document.getElementById('email');

    const username = usernameInput.value;
    const password = passwordInput.value;
    const email = emailInput.value;
    const csrftoken = getCookieRegister('csrftoken');

    // if (!username || !password || !email) {
    //     createNotification('Please fill in all fields', "fillfields");
    //     return;
    // }

    try {
        const response = await fetch('accounts/register/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({
                username: username,
                password: password,
                email: email
            })
        });

        if (!response.ok) {
            const data = await response.json();
            if (data.email && data.email[0]) {
                console.error(data.email[0]);
                throw new Error(data.email[0]);
            }
            if (data.username && data.username[0]) {
                console.error(data.username[0]);
                throw new Error(data.username[0]);
            }
            if (data.password && data.password[0]) {
                console.error(data.password[0]);
                throw new Error(data.password[0]);
            }
        } else {
            const data = await response.json();
            console.log(data);
            console.log("Register");
            createNotification("Account created successfully!", "acccreated");
            usernameInput.value = '';
            passwordInput.value = '';
            emailInput.value = '';
			return true;
        }
    } catch (error) {
        console.error('Error:', error);
        createNotification(error.message);
    }
}

export async function closeWebSocket(ws) {
    if (ws) {
        await ws.close();
    }
}


// export async function logout(){
// 	///Csrf_token
// 	let csrftoken = await fetch("csrf-token")
// 	.then(response => response.json())
// 	.then(data => data.csrfToken);
// 	console.log(csrftoken);
// 	///
// 	await fetch('accounts/logout/', {
// 		method: 'POST',
// 		headers: {
// 			'Content-Type' : 'application/json',
// 			'X-CSRFToken': csrftoken,
// 		}
// 	})
// 	.then(response => {
// 		if (response.status > 204) {
// 			throw new Error(`HTTP status ${response.status}`);
// 		}
// 		if (response.status === 200) {
// 			return response.json();
// 		}
// 	})
// 	.then(data => {
// 		console.log("Logged out");
// 		console.log(data);
// 	})
// 	.catch((error) => {
// 		console.error('Error:', error);
// 	});
// }

// export async function deleteUser() {
//     const csrftoken = await getCookie('csrftoken');

//     try {
//         const response = await fetch('/api/delete-user/', {  // Sostituisci con l'URL appropriato
//             method: 'DELETE',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'X-CSRFToken': csrftoken
//             },
//             credentials: 'include'
//         });

//         if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//         }

//         console.log('User deleted successfully');
//     } catch (error) {
//         console.error('Error:', error);
//     }
// }
