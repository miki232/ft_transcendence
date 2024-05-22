import AbstractView from "./AbstractView.js";

const contactHTML = `
<h1>Contact</h1>
<p>Made by 800A.</p>
`;

const navHTML = `
	<a href="/" name="index" data-link>Home</a>
	<a href="/about" name="about" data-link>About</a>
	<a href="/contact" name="contact" data-link>Contact</a>
`;

export default class extends AbstractView {
	constructor() {
		super();
		this.setTitle("Contact");
	}

	getNav() {
		return navHTML;
	}

	getContent() {
		return contactHTML;
	}
}