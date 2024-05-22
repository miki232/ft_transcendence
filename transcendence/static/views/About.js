import AbstractView from "./AbstractView.js";

const aboutHTML = `
<h1>About</h1>
<p>This is a simple web application.</p>
`;

const navHTML = `
    <div class="nav">
        <button type="button" class="nav-toggle"><ion-icon class="nav-toggle" name="menu-outline"></ion-icon></button>
        <div class="nav-links">
            <a href="/" name="index" data-link>Home</a>
            <a href="/about" name="about" data-link>About</a>
            <a href="/contact" name="contact" data-link>Contact</a>
        </div>
    </div>
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