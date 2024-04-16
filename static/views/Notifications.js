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
	}, 5000);
}