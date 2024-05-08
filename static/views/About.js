import AbstractView from "./AbstractView.js";

const aboutHTML = `
<h1>About</h1>
<p>This is a simple web application.</p>
`;

const navHTML = `
    <a href="/" name="index" data-link>Home</a>
    <a href="/about" name="about" data-link>About</a>
    <a href="/contact" name="contact" data-link>Contact</a>
`;

export default class extends AbstractView {
    constructor() {
        super();
        this.setTitle("About");
    }

    getNav() {
		return navHTML;
	}

    getContent() {
        return aboutHTML;
    }
}