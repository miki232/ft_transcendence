import AbstractView from "./AbstractView.js";

const aboutHTML = `
	<h1 data-translate="about"> About</h1>
	<p data-translate="aboutmsg"> This is a simple web application.</p>
`;

// const navHTML = `
// 	<div class="nav">
// 		<button type="button" class="nav-toggle"><ion-icon class="nav-toggle" name="menu-outline"></ion-icon></button>
// 		<div class="nav-links">
// 			<a href="/" name="index" data-link>Home</a>
// 			<a href="/about" name="about" data-link>About</a>
// 			<a href="/contact" name="contact" data-link>Contact</a>
// 		</div>
// 	</div>
// `;

export default class extends AbstractView {
	constructor() {
		super();
		this.setTitle("About");
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
					  <a class="nav-link" data-translate="aboutus" href="/about" aria-current="page" data-link>About Us</a>
					</li>
					<li class="nav-item">
					  <a class="nav-link" data-translate="contacts" href="/contact" data-link>Contacts</a>
					</li>
					<li class="nav-item dropdown">
					  <a class="nav-link dropdown-toggle" data-translate="language" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
						Language
					  </a>
					  <ul class="dropdown-menu select-menu">
						<li class="dropdown-item lang-selector" data-translate="eng" value="en">English</li>
						<li class="dropdown-item lang-selector" data-translate="fr" value="fr">Français</li>
						<li class="dropdown-item lang-selector" data-translate="it" value="it">Italiano</li>
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
		return aboutHTML;
	}
}