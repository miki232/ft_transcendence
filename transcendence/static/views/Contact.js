import { changeLanguage } from "../index.js";
import AbstractView from "./AbstractView.js";


export default class extends AbstractView {
	constructor() {
		super();
		this.setTitle("Contact");
		this.arecce_pic = "https://avatars.githubusercontent.com/u/77490508?v=4";
		this.arecce_level = null;
		this.arecce_github = "https://github.com/Sepherd";
		this.arecce_linkedin = "https://www.linkedin.com/in/andrearecce/";
		this.lbusi_pic = "https://avatars.githubusercontent.com/u/77490508?v=4";
		this.lbusi_level = null;
		this.lbusi_github = "";
		this.lbusi_linkedin = "";
		this.mtoia_pic = "https://avatars.githubusercontent.com/u/77490508?v=4";
		this.mtoia_level = null;
		this.mtoia_github = "";
		this.mtoia_linkedin = "";
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
					  <a class="nav-link" data-translate="aboutus" href="/about" data-link>About Us</a>
					</li>
					<li class="nav-item">
					  <a class="nav-link" aria-current="page" data-translate="contacts" href="/contact" data-link>Contact</a>
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
		const contactHTML = `
			<div class="dashboard">
				<div class="contact">
					<h1 data-translate="contact">Contact</h1>
					<div class="contact-list">
						<div class="user-dashboard">
							<img src=${this.arecce_pic} alt="arecce picture" />
							<div class="user-info">
								<h3>Arecce</h3>
								<div class="user-level">
									<p data-translate="level3">Level: <span>${this.arecce_level}</span></p>
								</div>
							</div>
							<div class="user-contact">
								<a href=${this.arecce_github} target="_blank"><ion-icon name="logo-github"></ion-icon></a>
								<a href=${this.arecce_linkedin} target="_blank"><ion-icon name="logo-linkedin"></ion-icon></a>
							</div>
						</div>
						<div class="user-dashboard">
							<img src=${this.lbusi_pic} alt="lbusi picture" />
							<div class="user-info">
								<h3>Lbusi</h3>
								<div class="user-level">
									<p data-translate="level3">>Level: <span>${this.lbusi_level}</span></p>
								</div>
							</div>
							<div class="user-contact">
								<a href=${this.lbusi_github} target="_blank"><ion-icon name="logo-github"></ion-icon></a>
								<a href=${this.lbusi_linkedin} target="_blank"><ion-icon name="logo-linkedin"></ion-icon></a>
							</div>
						</div>
						<div class="user-dashboard">
							<img src=${this.mtoia_pic} alt="mtoia picture" />
							<div class="user-info">
								<h3>Mtoia</h3>
								<div class="user-level">
									<p data-translate="level3">>Level: <span>${this.mtoia_level}</span></p>
								</div>
							</div>
							<div class="user-contact">
								<a href=${this.mtoia_github} target="_blank"><ion-icon name="logo-github"></ion-icon></a>
								<a href=${this.mtoia_linkedin} target="_blank"><ion-icon name="logo-linkedin"></ion-icon></a>
							</div>
						</div>
					</div>
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
		return contactHTML;
	}
}