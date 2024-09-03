import { UINode } from "./node";

export class ListItem extends UINode {
    private listElement: HTMLLIElement;

    public constructor(title: string) {
        super(title);
        this.listElement = document.createElement("li");
        this.listElement.innerText = this.title;
        this.listElement.setAttribute("tabindex", "-1");
        this.element.appendChild(this.listElement);
        this.listElement.setAttribute("aria-label", this.title);
        this.listElement.setAttribute("role", "option");
    }

    public focus() {
        this.listElement.focus();
        return this;
    }

    public click() {
        this.listElement.click();
        return this;
    }

    public getElement(): HTMLElement {
        return this.listElement;
    }

    public setText(text: string) {
        this.title = text;
        this.listElement.innerText = text;
        this.element.setAttribute("aria-label", this.title);
        this.listElement.setAttribute("aria-label", this.title);
        return this;
    }
}