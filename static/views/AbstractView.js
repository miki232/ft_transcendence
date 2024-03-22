import { getCookie, sanitizeInput } from "../utilities.js";

export default class {
	constructor() {
		this.getCookie = getCookie;
		this.sanitizeInput = sanitizeInput;
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