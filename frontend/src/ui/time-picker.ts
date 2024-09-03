import { UINode } from "./node";

export class TimePicker extends UINode {
    private id: string;
    private titleElement: HTMLLabelElement;
    private inputElement: HTMLInputElement;
    public constructor(title: string) {
        super(title);
        this.id = Math.random().toString();
        this.titleElement = document.createElement("label");
        this.titleElement.innerText = title;
        this.titleElement.id = `timepicker_title_${this.id}`;
        this.inputElement = document.createElement("input");
        this.inputElement.id = `timepicker_${this.id}`;
        this.inputElement.type = "time";
        this.titleElement.appendChild(this.inputElement);
        this.element.appendChild(this.titleElement);
    }

    public focus() {
        this.inputElement.focus();
        return this;
    }

    public getElement(): HTMLElement {
        return this.inputElement;
    }

    public setText(text: string) {
        this.title = text;
        this.titleElement.innerText = text;
        return this;
    }

    public getValue(): string {
        return this.inputElement.value;
    }

    public setValue(value: string) {
        this.inputElement.value = value;
        return this;
    }
}