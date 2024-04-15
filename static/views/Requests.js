import { getCSRFToken } from "./Info.js";

export async function getRequests() {
    var response = await fetch("friend/request/list/");
    var data = await response.json();
    return data;
    // var pendingRequestsElement = document.querySelector(".pending-requests");
    // // pendingRequestsElement.innerHTML = "";
    
    // for (var i = 0; i < data.length; i++) {
    //     var request = data[i];
    //     var senderUsername = request.sender.username;
    //     var receiverUsername = request.receiver.username;
        
    //     var requestElement = document.createElement("a");
    //     requestElement.href = '/user_info';
    //     if (receiverUsername == this.CurrentUsername){

    //         requestElement.setAttribute('data-username', senderUsername);
    //         requestElement.textContent = senderUsername;
    //     }
    //     else{
    //         requestElement.setAttribute('data-username', receiverUsername);
    //         requestElement.textContent = receiverUsername;
    //     }
            
    //      // Create a button to accept the request
    //     if (senderUsername !== this.CurrentUsername){
    //         var acceptButton = document.createElement("button");
    //         var declineButton = document.createElement("button");
    //         declineButton.innerHTML = "Decline";
    //         declineButton.id = "decline-request";
    //         declineButton.onclick = (function(senderUsername) {
    //             return function(){
    //                 declineFriendRequest(senderUsername);
    //             };
    //         })(senderUsername);
                    
    //         requestElement.appendChild(declineButton);
    //         acceptButton.innerHTML = "Accept";
    //         acceptButton.id = "Accept-request";
    //         acceptButton.onclick = (function(senderUsername) {
    //             return function(){
    //                 acceptFriendRequest(senderUsername);
    //             };
    //         })(senderUsername);
                    
    //         requestElement.appendChild(acceptButton);
    //     }
    //     else
    //     {
    //         var cancelButton = document.createElement("button");
    //         cancelButton.innerHTML = "Cancel";
    //         cancelButton.id = "cancel-request";
    //         cancelButton.onclick = (function(receiverUsername) {
    //             return function(){
    //                 cancelRequest(receiverUsername);
    //             };
    //         })(receiverUsername);
    //         console.log(receiverUsername);
    //         requestElement.appendChild(cancelButton);
            

    //     }
    //     pendingRequestsElement.appendChild(requestElement);
    // }
}

export async function cancelRequest(user){
	// Get the username from the list of friend
	// Create a new XMLHttpRequest object
	var xhr = new XMLHttpRequest();

	// Set the request URL
	var url = "friend/request/cancel/";

	// Set the request method to POST
	xhr.open("POST", url, true);

	// Set the request headers
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.setRequestHeader("X-CSRFToken", await getCSRFToken());

	// Set the request body
	var data = JSON.stringify({
		"receiver_user_id": user
	});

	// Send the request
	xhr.send(data);
}

export async function declineFriendRequest(userId) {
	// Create a new XMLHttpRequest object
	var xhr = new XMLHttpRequest();
	
	// Set the request URL
	var url = "friend/request/decline/";
	
	// Set the request method to POST
	xhr.open("POST", url, true);

	// Set the request headers
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.setRequestHeader("X-CSRFToken", await getCSRFToken());

	// Set the request body
	var data = JSON.stringify({
		"sender_user_id": userId
	});

	// Send the request
	xhr.send(data);
}

export function acceptFriendRequest(userId) {
	// Create a new XMLHttpRequest object
	var xhr = new XMLHttpRequest();
	
	// Set the request URL
	var url = "friend/accept/" + userId + "/";
	
	// Set the request method to GET
	xhr.open("GET", url, true);
	
	// Send the request
	xhr.send()
}

export async function sendFriendRequest(user) {

    // Get the username from the input field
    var csrf = await getCSRFToken();
    // var username = document.getElementById("friendNameInput").value;
    // Create a new XMLHttpRequest object
    var xhr = new XMLHttpRequest();
    console.log(user)
    // Set the request URL
    var url = "/friend/request/send/";

    // Set the request method to POST
    xhr.open("POST", url, true);

    // Set the request headers
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("X-CSRFToken", csrf);

    // Set the request body
    var data = JSON.stringify({
        "receiver_user_id": user
    });

    // Send the request
    // ws.send(JSON.stringify({'notifications to ': user}));

    xhr.send(data);
}