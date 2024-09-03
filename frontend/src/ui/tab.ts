import { UINode } from "./node";

export class UITab extends UINode {
    private textElement: HTMLButtonElement;
    private selected: boolean;
    
    public constructor(title: string) {
        super(title);
        this.title = title;
        this.textElement = document.createElement("button");
        this.textElement.innerText = title;
        this.textElement.setAttribute("tabindex", "-1");
        this.textElement.setAttribute("role", "tab");
        this.textElement.setAttribute("aria-selected", "false");
        this.element.appendChild(this.textElement);
        this.selected = false;
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

    public setSelected(val: boolean) {
        this.selected = val;
        this.textElement.setAttribute("aria-selected", this.selected.toString());
        return this;
    }
}