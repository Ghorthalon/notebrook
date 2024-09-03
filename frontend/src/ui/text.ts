import { UINode } from "./node";

export class Text extends UINode {
    private textElement: HTMLSpanElement;
    public constructor(title: string) {
        super(title);
        this.textElement = document.createElement("span");
        this.textElement.innerText = title;
        this.textElement.setAttribute("tabindex", "-1");
        this.element.appendChild(this.textElement);
    }

    public focus() {
        this.textElement.focus();
        return this;
    }

    public click() {
        this.textElement.click();
        return this;
    }

    public getElement(): HTMLElement {
        return this.textElement;
    }

    public setText(text: string) {
        this.title = text;
        this.textElement.innerText = text;
        return this;
    }
}