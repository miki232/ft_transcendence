import AbstractView from "./AbstractView.js";
import { createNotification } from "./Notifications.js";

export default class Tournament extends AbstractView {
    constructor(user, ws) {
        super();
        this.user = user;
        this.content = document.querySelector("#content");
        this.nav = document.querySelector("nav");
        this.nav.innerHTML = this.getNav();
        this.activeBtn();
        // this.user.expProgress();
        this.roomName = null;
        this.tournamentstarted = false;
        this.ws = ws;
        this.players = []; // Array to store the players who have joined the tournament
        this.torunament_chart = [];
        this.getWaitingPlayers(); // Fetch waiting players on initialization

        // Fetch the list of users waiting in the tournament from the API
        // fetch('/waiting_for_tournament/')
        // .then(response => response.json())
        // .then(data => {
            //     // Add the users to the players array
            //     this.players =  Object.values(data).map(item => item[0]);
            //     // Update the content to reflect the new players
            //     // this.content.innerHTML = this.getContent();
            //     this.content.innerHTML = this.getContent();
            // })
            // .catch(error => console.error('Error:', error));
            
    //         this.ws.onmessage = async (event) => {
    //             const data = JSON.parse(event.data);
    //             console.log(data);
    //             // if (data.status === "Tournament start") {
    //             //     this.tournamentstarted = true;
    //             //     this.content.innerHTML = `<h1>TOURNAMENT STARTED</h1>`;
    //             //     // Extract the usernames
    //             //     let matches = [];
    //             //     for (let key in data.dict) {
    //             //         let pair = data.dict[key];
    //             //         if (pair.length === 2) {
    //             //             matches.push(`${pair[0]} vs ${pair[1]}`);
    //             //         }
    //             //     }
                    
    //             //     this.content.innerHTML += `<h2>Matches: ${matches.join(', ')}</h2>`;
    //             // }
    //             if (data.status === "Tournament start") {
    //                 this.tournamentstarted = true;
    //                 this.ws.close(); // Close the WebSocket
            
    //                 // Fetch the match data from the API
    //                 try {
    //                     const response = await fetch('/tournament_match/');
    //                     const matchData = await response.json();
    //                     // Store the room name
    //                     this.roomName = matchData.name;
    //                     // Update the content to show the match
    //                     this.content.innerHTML = `<h1>TOURNAMENT STARTED</h1>`;
    //                     this.content.innerHTML += `<h2>Match: ${matchData.player1} vs ${matchData.player2}</h2>`;
    //                 } catch (error) {
    //                     console.error('Error:', error);
    //                 }
    //             }
    //             else if (data.status === "Waiting for players") {
    //                 this.getWaitingPlayers();
    //             }
    //         };
    //         // this.getWaitingPlayers();
    //     }
    
    
    // async getRoom() {
    //     // if (this.roomName === null) {
    //     //     try {
    //     //         const response = await fetch('/tournament_match/');
    //     //         const matchData = await response.json();
    //     //         this.roomName = matchData.name;
    //     //     } catch (error) {
    //     //         console.error('Error:', error);
    //     //     }
    //     // }
    //     return this.roomName;
    }

    async getRoom_Match() {
        // await this.connect();
        this.getWaitingPlayers();
        return new Promise((resolve, reject) => {
            // this.matchmaking_ws.onopen = () => {
            //     console.log('WebSocket connection opened');
            //     console.log("CONNECTED");
            //     this.matchmaking_ws.send(JSON.stringify({'action': 'join_queue'}));
            // };
            this.user.matchmaking_ws.onmessage = async event => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('WebSocket message received:', event.data);
                    console.log('Parsed data:', data);
                    console.log(data.status)
                    if (data.status === "6"){ /// LO STATUS  6 è L'ADV, è più semplice prendere il match da API, ma si può anche fare da WS
                        const response = await fetch('/tournament_match/');
                        const matchData = await response.json();
                        console.log(`${matchData.created_by} Vs ${matchData.opponent}`)
                        if (this.user.username === matchData.created_by){
                            this.user.tournament_opp.username = matchData.opponent;
                            this.user.tournament_opp.pro_pic = matchData.pro_pic_opponent;
                        }
                        else{
                            this.user.tournament_opp.username = matchData.created_by;
                            this.user.tournament_opp.pro_pic = matchData.pro_pic_created_by;
                        }
                        // this.torunament_chart.push(`${matchData.created_by} Vs ${matchData.opponent}`);
                        // this.displayTournamentChart(this.torunament_chart);
                        // createNotification(`${matchData.created_by} Vs ${matchData.opponent}`)
                        let round = [];
                        for (const matchId in data.dict) {
                            if (data.dict.hasOwnProperty(matchId)) {
                                const match = `${data.dict[matchId][0]} Vs ${data.dict[matchId][1]}`;
                                console.log(match);
                                round.push(match);
                                this.torunament_chart.push(match);
                                // createNotification(match);
                            }
                        }
                        // Check if the round already exists in the user's rounds
                        const roundExists = this.user.round.some(existingRound => {
                            return existingRound.every((value, index) => value === round[index]);
                        });
                        // If the round does not exist, add it
                        if (!roundExists) {
                            this.user.round.push(round);
                        }
                        this.displayTournamentChart();
                        console.log("ROUND", this.user.round);
                    }
                    else if (data.status === "Tournament start") {
                        this.user.matchmaking_ws.close(); // Close the WebSocket
                        // Fetch the match data from the API
                        const response = await fetch('/tournament_match/');
                        const matchData = await response.json();
                        // Store the room name
                        console.log("MATCH DATA", matchData);
                        this.roomName = matchData.name;
                        // Update the content to show the match
                        // let conente_opponent = document.getElementById("opponent")
                        // let img_opponet = document.getElementById("opponent_img")
                        // img_opponet.src = this.opponent_pic;
                        this.content.innerHTML = `<h1>TOURNAMENT STARTED</h1>`;
                        this.content.innerHTML += `${matchData.created_by} vs ${matchData.opponent}`;
                        console.log("ROOM NAME", this.roomName);
                        resolve(this.roomName);
                    }
                    else if (data.status === "Waiting for players") {
                        this.getWaitingPlayers();
                    }
                    //  else if (data.User_self === this.username){
                    //     this.setOpponent(data.opponent);
                    //     await this.getFriendInfo(this.opponent)
                    //     this.roomName = data.room_name;
                    //     let conente_opponent = document.getElementById("opponent")
                    //     let img_opponet = document.getElementById("opponent_img")
                    //     img_opponet.src = this.opponent_pic;
                    //     conente_opponent.innerHTML = this.opponent;
                    //     // await this.connect_game(this.roomName);
                    //     await new Promise(r => setTimeout(r, 2000));
                    //     console.log("ROOM NAME", this.roomName);
                    //     resolve(this.roomName);
                    // }
                } catch (error) {
                    console.error('Error parsing message:', error);
                    reject(error);
                }
            };
    
            this.user.matchmaking_ws.onerror = error => {
                console.error('WebSocket error:', error);
                reject(error);
            };
        });
    }

// DEVO CAPIRE SE CONVIENE CHIAMARE LE API PER OTTENERE I GIOCATORI CHE SONO IN ATTESA DI GIOCARE IL TORNEO
// O SE UTILIZZARE LA SOCKET PER OTTENERE I GIOCATORI CHE SONO IN ATTESA DI GIOCARE IL TORNEO
// PER ORA UTILIZZO LE API, E L'ULTIMO GIOCATORE CHE SI REGISTRA, NON RICEVE RENDERIZZA LA PAGINA CON "TOURNAMENT STARTED"

    
    async getWaitingPlayers() {
        if (this.tournamentstarted) {
            return;
        }
        try {
            const response = await fetch('/waiting_for_tournament/');
            const data = await response.json();
            this.players = Object.values(data).map(item => item[0]);
            this.displayWaitingPlayers(); // Update the content to reflect the new players
        } catch (error) {
            console.error('Error:', error);
        }
    }

    displayWaitingPlayers() {
        const container = document.querySelector('.tournament-container');
        container.innerHTML = ''; // Clear any existing content
    
        const waitingWrapper = document.createElement('div');
        waitingWrapper.className = 'waiting-wrapper';

        const title = document.createElement('h2');
        title.textContent = 'Waiting Players';
        waitingWrapper.appendChild(title);

        const playerList = document.createElement('ul');
        playerList.className = 'waiting-players';
    
        this.players.forEach(player => {
            const playerItem = document.createElement('li');
            playerItem.textContent = player.username;
            playerList.appendChild(playerItem);
        });
    
        waitingWrapper.appendChild(playerList);
        container.appendChild(waitingWrapper);
    }



    async sendJoin() {
        this.user.matchmaking_ws.send(JSON.stringify({
            "action": "joinTournamentQueue",
            "username": this.user.user,
            "status": "not_ready_nextmatch",
        }));
    }


    getNav() {
        // Implement navigation bar here
    }

    getContent() {
        
        // let content = `<div class="tournament-container">`;
        // content += `<h2>Tournament Participants</h2>`;
        // content += `<ul class="tournament-participants">`;
        // this.players.forEach(player => {
        //     content += `<li>${player.username}</li>`;
        // });
        // content += `</ul>`;
        // content += `</div>`;
        // return content;
        let content = `<div class="tournament-container"></div>`;
        return content;
    }

    activeBtn() {
        // Implement button functionality here
    }

    // Method to add a player to the tournament
    addPlayer(player) {
        this.players.push(player);
        this.content.innerHTML = this.getContent(); // Update the content to reflect the new player
    }

    // displayTournamentChart() {
    //     console.log(this.user.round); // Add logging
    
    //     const container = document.querySelector('.tournament-container');
    //     container.innerHTML = ''; // Clear any existing content
    
    //     const tournamentWrapper = document.createElement('div');
    //     tournamentWrapper.className = 'tournament-wrapper';
    
    //     this.user.round.forEach((data, round) => {
    //         const roundDiv = document.createElement('div');
    //         roundDiv.className = 'round';
    //         roundDiv.dataset.round = round;
        
    //         data.forEach((match, index) => {
    //             const matchDiv = document.createElement('div');
    //             matchDiv.className = 'match';
        
    //             const players = match.split(' Vs ');
        
    //             const player1 = document.createElement('div');
    //             player1.className = 'player';
    //             player1.textContent = players[0];
        
    //             // Create player2 element
    //             const player2 = document.createElement('div');
    //             player2.className = 'player';
    //             player2.textContent = players[1];
        
    //             // Append players to matchDiv
    //             matchDiv.appendChild(player1);
    //             matchDiv.appendChild(player2);
        
    //             // Append matchDiv to roundDiv
    //             roundDiv.appendChild(matchDiv);
    //         });
        
    //         // Append roundDiv to tournamentWrapper
    //         tournamentWrapper.appendChild(roundDiv);
    //     });
        
    //     // Append tournamentWrapper to container
    //     container.appendChild(tournamentWrapper);
    // }

    displayTournamentChart() {
        console.log(this.user.round); // Add logging
    
        const container = document.querySelector('.tournament-container');
        container.innerHTML = ''; // Clear any existing content
    
        const tournamentWrapper = document.createElement('div');
        tournamentWrapper.className = 'tournament-wrapper';
    
        this.user.round.forEach((data, roundIndex) => {
            const roundDiv = document.createElement('div');
            roundDiv.className = 'round';
            roundDiv.dataset.round = roundIndex;
        
            data.forEach((match, matchIndex) => {
                const matchDiv = document.createElement('div');
                matchDiv.className = 'match';
        
                const players = match.split(' Vs ');
        
                const player1 = document.createElement('div');
                player1.className = 'player';
                player1.textContent = players[0];
        
                const player2 = document.createElement('div');
                player2.className = 'player';
                player2.textContent = players[1];
        
                matchDiv.appendChild(player1);
                matchDiv.appendChild(player2);
    
                if (roundIndex > 0) {
                    const connectorDiv = document.createElement('div');
                    connectorDiv.className = 'connector';
                    matchDiv.appendChild(connectorDiv);
                }
        
                roundDiv.appendChild(matchDiv);
            });
        
            tournamentWrapper.appendChild(roundDiv);
        });
    
        container.appendChild(tournamentWrapper);
    }
    
}