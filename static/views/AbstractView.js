export default class {
    constructor() {

    }

    getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    sanitizeInput(input) {
        // Rimuovi markup HTML pericoloso
        var sanitizedInput = input.replace(/<[^>]*>/g, '');
        // Escape caratteri speciali per prevenire XSS
        sanitizedInput = sanitizedInput.replace(/[&<>"']/g, function(match) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#x27;',
                "`": '&#x60;'
            }[match];
        });
        return sanitizedInput;
    }

    setTitle(title) {
        document.title = title;
    }

    async getHtml() {
        return "";
    }
}