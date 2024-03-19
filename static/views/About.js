import AbstractView from "./AbstractView.js";

const aboutHTML = `
<h1>About</h1>
<p>This is a simple web application.</p>
`;

export default class extends AbstractView {
    constructor() {
        super();
        this.setTitle("About");
    }

    async getHtml() {
        return aboutHTML;
    }
}