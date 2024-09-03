import { UINode } from "./node";

export class Checkbox extends UINode {
    private id: string;
    private titleElement: HTMLLabelElement;
    private checkboxElement: HTMLInputElement;
    public constructor(title: string) {
        super(title);
        this.id = Math.random().toString();
        this.titleElement = document.createElement("label");
        this.titleElement.id = `chkbx_title_${this.id}`;
        this.checkboxElement = document.createElement("input");
        this.checkboxElement.id = `chkbx_${this.id}`;
        this.checkboxElement.type = "checkbox";
        this.titleElement.appendChild(this.checkboxElement);
        this.titleElement.appendChild(document.createTextNode(this.title));
        this.element.appendChild(this.titleElement);
    }

    public focus() {
        this.checkboxElement.focus();
        return this;
    }

    public click() {
        this.checkboxElement.click();
        return this;
    }

    public getElement(): HTMLElement {
        return this.checkboxElement;
    }

    public setText(text: string) {
        this.title = text;
        this.titleElement.innerText = text;
        this.element.setAttribute("aria-label", this.title);
        this.element.setAttribute("aria-roledescription", "checkbox");
        return this;
    }

    public isChecked(): boolean {
        return this.checkboxElement.checked;
    }

    public setChecked(value: boolean) {
        this.checkboxElement.checked = value;
        return this;
    }
}