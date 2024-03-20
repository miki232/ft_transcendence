import AbstractView from "./AbstractView.js";

const aboutHTML = `
<h1>About</h1>
<p>This is a simple web application.</p>
`;

const navHTML = `
<ul>
	<li>Logo</li>
	<li><a onclick="logout()">logout</a></li>
	<li><a href="/" data-link>Home</a></li>
	<li><a href="/about" class="active" name="about" data-link>About</a></li>
	<li><a href="/contact" data-link>Contact</a></li>
</ul>
`;

export default class extends AbstractView {
    constructor() {
        super();
        this.setTitle("About");
    }

    async getNav() {
		return navHTML;
	}

    async getContent() {
        return aboutHTML;
    }
}