import { UINode } from "./node";

export class Button extends UINode {
    private buttonElement: HTMLButtonElement;
    public constructor(title: string, hasPopup: boolean = false) {
        super(title);
        this.buttonElement = document.createElement("button");
        this.buttonElement.innerText = title;
        if (hasPopup) this.buttonElement.setAttribute("aria-haspopup", "true");
        this.element.appendChild(this.buttonElement);
        this.element.setAttribute("aria-label", this.title);
    }

    public focus() {
        this.buttonElement.focus();
        return this;
    }

    public click() {
        this.buttonElement.click();
        return this;
    }

    public getElement(): HTMLElement {
        return this.buttonElement;
    }

    public setText(text: string) {
        this.title = text;
        this.buttonElement.innerText = text;
        this.element.setAttribute("aria-label", this.title);
        return this;
    }

    public setDisabled(val: boolean) {
        this.buttonElement.disabled = val;
        return this;
    }
}