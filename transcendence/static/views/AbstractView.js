import { getCookie, sanitizeInput } from "../utilities.js";

export default class {
	constructor() {
		this.getCookie = getCookie;
		this.sanitizeInput = sanitizeInput;
	}

	async getCSRFToken() {
		let csrftoken = await fetch("csrf-token")
			.then(response => response.json())
			.then(data => data.csrfToken);
			console.log(csrftoken);
		return csrftoken;
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