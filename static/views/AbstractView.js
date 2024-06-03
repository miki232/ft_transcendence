import { sanitizeInput } from "../utilities.js";

export default class {
	constructor() {
		this.sanitizeInput = sanitizeInput;
	}

	async getCSRFToken() {
		let csrftoken = await fetch("/csrf-token")
			.then(response => response.json())
			.then(data => data.csrfToken);
			// console.log(csrftoken);
		return csrftoken;
	}
	

	getCookie(name) {
		let cookieValue = null;
    	if (document.cookie && document.cookie !== '') {
    	    const cookies = document.cookie.split(';');
    	    for (let i = 0; i < cookies.length; i++) {
    	        const cookie = cookies[i].trim();
    	        // Cookie stringa inizia con il nome desiderato
    	        if (cookie.substring(0, name.length + 1) === (name + '=')) {
    	            cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
    	            break;
    	        }
    	    }
    	}
    	return cookieValue;
	}

	setTitle(title) {
		document.title = title;
	}

	async getNav() {
		return "";
	}

	async getContent() {
		return "";
	}
}