export function createNotification(message) {
	const notification = document.createElement('div');
	notification.classList.add('notification');
	const text = document.createElement('span');
	text.innerHTML = message;
	notification.innerHTML = `<ion-icon name="notifications"></ion-icon>`;
	notification.appendChild(text);
	document.body.appendChild(notification);
	setTimeout(() => {
		document.body.removeChild(notification);
	}, 3000);
}

// export function createNotification(message) {
// 	const notification = `
// 		<dialog id="notification">
// 			<p>${message}</p>
// 			<ion-icon name="notifications"></ion-icon>
// 		</dialog>
// 	`;
// 	document.body.innerHTML += notification;
// 	const notificationDialog = document.getElementById("notification");
// 	notificationDialog.showModal();
// 	setTimeout(() => {
// 		notificationDialog.close();
// 		document.body.removeChild(notification);
// 	}, 5000);
// }