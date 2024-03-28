import AbstractView from "./AbstractView.js";
import validateLogin from './Dashboard.js';

const loginHTML = `
<div class="login-wrap">
    <div class="login-html">
    	<input id="tab-1" type="radio" name="tab" class="sign-in" checked><label for="tab-1" class="tab">Sign In</label>
      	<input id="tab-2" type="radio" name="tab" class="sign-up"><label for="tab-2" class="tab">Sign Up</label>
      	<div class="login-form">
      	  	<div class="sign-in-htm">
      	    	<div class="group">
      	    	  <label for="user" class="label">Username</label>
      	    	  <input id="login-user" type="text" class="input">
      	    	</div>
      	    	<div class="group">
      	    	  <label for="pass" class="label">Password</label>
      	    	  <input id="login-pass" type="password" class="input" data-type="password">
      	    	</div>
      	    	<div class="group">
      	    	  <a href="/dashboard" id="login" class="button" data-link>Sign In</a>
      	    	</div>
			  	<div class="group" id="forgot">
			  		<a href="#forgot">Forgot Password?</a>
				</div>		
      	    	<div class="hr"></div>
      	    	<div class="foot-lnk">
					<a href="accounts/authorize/" id="login" class="button"">Login with 42 intra account</a>
      	    	</div>
      	 	</div>
      	  	<div class="sign-up-htm">
      	    	<div class="group">
      	    		<label for="user" class="label">Username</label>
      	    		<input id="signup-user" type="text" class="input">
      	    	</div>
      	    	<div class="group">
      	    		<label for="pass" class="label">Password</label>
      	    		<input id="signup-pass" type="password" class="input" data-type="password">
      	    	</div>
      	    	<div class="group">
      	    		<label for="re-pass" class="label">Repeat Password</label>
      	    		<input id="re-pass" type="password" class="input" data-type="password">
      	    	</div>
      	    	<div class="group">
      	    		<label for="email" class="label">Email Address</label>
      	    		<input id="email" type="text" class="input">
      	    	</div>
      	    	<div class="group">
				  <a id="signup" class="button">Sign Up</a>
      	    	</div>
      	    	<div class="hr"></div>
      	    	<div class="foot-lnk">
      	    	  <label for="tab-1">Already Member?</a>
      	    	</div>
      	  	</div>
      	</div>
    </div>
  </div>
`;

const navHTML = `
	<nav>
		<ul>
			<li>Logo</li>
			<li><a href="/" class="active" name="index" data-link>Home</a></li>
			<li><a href="/about" name="about" data-link>About</a></li>
			<li><a href="/contact" name="contact" data-link>Contact</a></li>
		</ul>
	</nav>
`;

export default class extends AbstractView {
    constructor() {
        super();
        this.setTitle("ft_transcendence");
		this.is_loggedin = false;
    }

	async loadUserData() {
		var csrftoken = this.getCookie('csrftoken')
		await fetch('accounts/user_info/', {
			method: 'GET',
			headers: {
				'Content-Type' : 'application/json',
				'X-CSRFToken': csrftoken
			}
		})
		.then(response => {
			if (response.ok) {
				this.is_loggedin = true;
				return response.json();
			} else {
				this.is_loggedin = false;
				throw new Error('Not logged in');
			}
		})
		.then(data => {
			console.log(data);
		})
		.catch((error) => {
			console.error('Error:', error);
		})
	}

	async getNav() {
		return navHTML;
	}

    async getContent() {
        return loginHTML;
    }
}