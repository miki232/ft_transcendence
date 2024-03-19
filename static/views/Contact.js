import AbstractView from "./AbstractView.js";

const contactHTML = `
<h1>Contact</h1>
<p>Made by 800A.</p>
`;

export default class extends AbstractView {
    constructor() {
        super();
        this.setTitle("Contact");
    }

    async getHtml() {
        return contactHTML;
    }
}