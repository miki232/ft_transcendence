import AbstractView from "./AbstractView.js";

const contactHTML = `
<h1>Contact</h1>
<p>Made by 800A.</p>
`;

export default class extends AbstractView {
	constructor() {
		super();
		this.setTitle("Contact");
		this.content = document.querySelector("#content");
		this.nav = document.querySelector("header");
		this.nav.innerHTML = this.getNav();
		this.content.innerHTML = this.getContent();
	}

	getNav() {
		const navHTML = `
			<nav class="navbar navbar-expand-lg bg-body-tertiary">
			  <div class="container-fluid">
				<h1 id="logo">The Match</h1>
				<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavDropdown" aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
					<span class="navbar-toggler-icon"><ion-icon name="menu-outline" class="toggler-icon"></ion-icon></span>
				</button>
				<div class="collapse navbar-collapse" id="navbarNavDropdown">
				  <ul class="navbar-nav">
					<li class="nav-item">
					  <a class="nav-link" href="/" data-link>Home</a>
					</li>
					<li class="nav-item">
					  <a class="nav-link" href="/about" data-link>About Us</a>
					</li>
					<li class="nav-item">
					  <a class="nav-link" aria-current="page" href="/contact" data-link>Contact</a>
					</li>
					<li class="nav-item dropdown">
					  <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
						Language
					  </a>
					  <ul class="dropdown-menu select-menu">
						<li class="dropdown-item lang-selector" value="en">English</li>
						<li class="dropdown-item lang-selector" value="fr">Français</li>
						<li class="dropdown-item lang-selector" value="it">Italiano</li>
					  </ul>
					</li>
				  </ul>
				</div>
			  </div>
			</nav>
		`;
		return navHTML;
	}

	getContent() {
		return contactHTML;
	}
}