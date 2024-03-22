import AbstractView from "./AbstractView.js";

const contactHTML = `
<h1>Contact</h1>
<p>Made by 800A.</p>
`;

const navHTML = `
<ul>
	<li>Logo</li>
	<li><a href="/" data-link>Home</a></li>
	<li><a href="/about" data-link>About</a></li>
	<li><a href="/contact" class="active" data-link>Contact</a></li>
</ul>
`;

export default class extends AbstractView {
	constructor() {
		super();
		this.setTitle("Contact");
	}

	async getNav() {
		return navHTML;
	}

	async getContent() {
		return contactHTML;
	}
}