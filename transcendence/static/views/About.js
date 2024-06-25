import { changeLanguage } from "../index.js";
import AbstractView from "./AbstractView.js";


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
				<a href="/" id="logo" class="nav-brand" aria-current="page" data-link>
					<img src="/static/img/Logo.png" alt="Logo" class="logo"/>
				</a>
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
		const aboutHTML = `
			<div class="dashboard">
				<div class="about">
					<h1 data-translate="about">About</h1>
					<p data-translate="aboutmsg">
						Welcome to The Match, the best place to find your perfect match. We are a team of professionals who have been working in the dating industry for years. Our goal is to help you find your soulmate, and we are here to make your journey as easy and enjoyable as possible. Whether you are looking for a long-term relationship or just a casual date, we have everything you need to find the perfect match. So why wait? Sign up today and start your journey to finding true love.
					</p>
				</div>
			</div>
		`;
	var langSelectors = document.querySelectorAll('.lang-selector');
	langSelectors.forEach(function(selector) {
		selector.addEventListener('click', function(event) {
			this.lang = this.getAttribute('value');
			changeLanguage(this.lang);
			
			// Do something with the selected language
			console.log('Selected language: ' + this.lang);
		});
	});
		return aboutHTML;
	}
}