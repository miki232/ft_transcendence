import AbstractView from "./AbstractView.js";
import { changeLanguage } from "../index.js";
import { createNotification } from "./Notifications.js";
import LocalTpong from "./LocalTpong.js";
import { navigateTo } from "../index.js";

export default class TournamentLocal extends AbstractView {
    constructor(user, ws) {
        super();
        this.user = user;
		this.lang = localStorage.getItem('language') || 'en';
        this.content = document.querySelector("#content");
        this.nav = document.querySelector("nav");
		this.init();
        this.activeBtn();
		this.token = null;
		this.matches = [];
        // this.nav.innerHTML = this.getNav();
        // this.user.expProgress();
        // this.roomName = null;
        // this.tournamentstarted = false;
        // this.ws = ws;
        // this.players = []; // Array to store the players who have joined the tournament
        // this.torunament_chart = [];
        // this.getWaitingPlayers(); // Fetch waiting players on initialization
        // let isMessageProcessed = false;
	}

	async init() {
		console.log("TournamentLocal.js");
		console.log(this.user);
		this.token = await this.getCSRFToken();
		console.log(this.user.tournament_local_room);
		console.log(this.user.tournament_local_room.pk_tournament);
		this.load_match();
		this.content.innerHTML = this.getContent();
	}

	load_match() {
		fetch(`/getlocal_tournament/?id=${this.user.tournament_local_room.pk_tournament}`)
			.then(response => response.json())
			.then(data => {
				this.matches = data.matches;
				this.updateContentWithMatches();
				changeLanguage(this.lang);
			})
			.catch(error => console.error('Error:', error));
	}

	/*
	<div class="tournament-container" id="tournamentBracket" style="display: flex">
				<ul class="bracket semifinals">
					<li class="match" id="semifinal1">${semifinal1}</li>
					<li class="match" id="semifinal2">${semifinal2}</li>
				</ul>
				<ul class="bracket finals">
					<li class="match" id="final">${final}</li>
				</ul>
				<ul class="bracket winner">
					<li class="match" id="champion">${winner}</li>
				</ul>
				<button id="playMatch" class="btn btn-primary m-2">Play match</button>
	</div>
	*/

	updateContentWithMatches() {
		const semifinal1 = this.matches[0] ? `<p>${this.matches[0].user1}</p><span> VS </span><p>${this.matches[0].user2}</p>` : '<p>-</p> <span> VS </span><p>-</p>';
		const semifinal2 = this.matches[1] ? `<p>${this.matches[1].user1}</p><span> VS </span><p>${this.matches[1].user2}</p>` : '<p>-</p> <span> VS </span><p>-</p>';;
		const final = this.matches[2] ? `<p>${this.matches[2].user1}</p><span> VS </span><p>${this.matches[2].user2}</p>` : '<p>-</p> <span> VS </span><p>-</p>';
		const winner = this.matches[2] ? `<p>${this.matches[2].winner}</p>` : '<p data-translate="winner">Winner</p>';

		this.content.innerHTML = `
			<div class="dashboard">
				<div class="tournament">
					<h1 data-translate="localtournament">Local Tournament</h1>
					<div class="match-tab">
						<h3 data-translate="semifinals1">Semifinals 1</h3>
						<div class="match-line">
							${semifinal1}
						</div>
						<h3 data-translate="semifinals2">Semifinals 2</h3>
						<div class="match-line">
							${semifinal2}
						</div>
						<h3 data-translate="final">Final</h3>
						<div class="match-line">
							${final}
						</div>
						<h3 data-translate="winner">Winner</h3>
						<div class="match-line">
							${winner}
						</div>
						<button type="button" id="playMatch" data-translate="play" class="submit-btn confirm-btn" style="width: 100%;"><ion-icon name="game-controller-outline"></ion-icon>Play Match</button>
					</div>
				</div>
			</div>
		`;

		const playMatchButton = document.querySelector("#playMatch");
		playMatchButton.addEventListener('click', this.handlePlayMatchClick.bind(this));
		if (this.user.tournament_local_room.matchindex > 2) {
			playMatchButton.removeEventListener('click', this.handlePlayMatchClick.bind(this));
			playMatchButton.addEventListener('click', this.handleEndMatchClick.bind(this));
			playMatchButton.textContent = 'End tournament';
		}
	}

	handleEndMatchClick(){
		// End tournament
		this.user.tournament_local_room.matchindex = 0;
		navigateTo('/local_game');
	}

	handlePlayMatchClick() {
		if (this.matches[this.user.tournament_local_room.matchindex]) {
			this.connectToWsLocalPong(this.matches[this.user.tournament_local_room.matchindex].room_name, this.matches[this.user.tournament_local_room.matchindex].user1, this.matches[this.user.tournament_local_room.matchindex].user2);
		} else {
			console.log('No matches available');
		}
	}

	onLocalTpongLoopFinish() {
		// This function will be called when the loop function in LocalTpong finishes
		if (this.user.tournament_local_room.matchindex < 1) {
			const url = '/local_tournament_one_update/';
			const data = {
				"id": this.user.tournament_local_room.pk_tournament,
				"user1": this.user.tournament_local_room.winner,
			};

			fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRFToken': this.token,
				},
				body: JSON.stringify(data),
			})
			.then(response => response.json())
			.then(data => {
				console.log('Success:', data);
				this.user.tournament_local_room.matchindex++;
				this.user.tournament_local_room.pk_match = data.pk;
				this.load_match();
			})
			.catch((error) => {
				console.error('Error:', error);
			});
		}
		else if (this.user.tournament_local_room.matchindex > 1) {
			console.log('Tournament finished');
			const url = '/local_tournament_set_winner/';
			const data = {
				"tournament_id": this.user.tournament_local_room.pk_tournament,
				"match_id": this.user.tournament_local_room.pk_match,
				"winner": this.user.tournament_local_room.winner,
			};

			fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRFToken': this.token,
				},
				body: JSON.stringify(data),
			})
			.then(response => response.json())
			.then(data => {
				console.log('Success:', data);
				this.user.tournament_local_room.matchindex++;
				this.user.tournament_local_room.pk_match = data.pk;
				this.load_match();
			})
			.catch((error) => {
				console.error('Error:', error);
			});
		}
		else
		{
			const url = '/local_tournament_update/';
			const data = {
				"tournament_id": this.user.tournament_local_room.pk_tournament,
				"user2": this.user.tournament_local_room.winner,
				"match_id": this.user.tournament_local_room.pk_match,
			};

			fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRFToken': this.token,
				},
				body: JSON.stringify(data),
			})
			.then(response => response.json())
			.then(data => {
				console.log('Success:', data);
				this.user.tournament_local_room.matchindex++;
				this.load_match();
			})
			.catch((error) => {
				console.error('Error:', error);
			});
		}

	}

	connectToWsLocalPong(roomName, user1, user2) {
		// Connect to ws_localpong with the given roomName
		// This is a placeholder, replace with your actual implementation
		const localPong = new LocalTpong(this.user, user1, user2, roomName, this.onLocalTpongLoopFinish.bind(this));

		console.log(`Connecting to ws_localpong with roomName: ${roomName}`);
	}

	activeBtn() {

	}

	getContent() {
		return `
		`;
	}

}