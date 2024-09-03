import { UINode } from "./node";

export class MultilineInput extends UINode {
    private id: string;
    private titleElement: HTMLLabelElement;
    private textareaElement: HTMLTextAreaElement;
    public constructor(title: string) {
        super(title);
        this.id = Math.random().toString();
        this.titleElement = document.createElement("label");
        this.titleElement.innerText = title;
        this.titleElement.id = `txtarea_title_${this.id}`;
        this.textareaElement = document.createElement("textarea");
        this.textareaElement.id = `txtarea_${this.id}`;
        this.titleElement.appendChild(this.textareaElement);
        this.element.appendChild(this.titleElement);
    }

    public focus() {
        this.textareaElement.focus();
        return this;
    }

    public click() {
        this.textareaElement.click();
        return this;
    }

    public getElement(): HTMLElement {
        return this.textareaElement;
    }

    public setText(text: string) {
        this.title = text;
        this.titleElement.innerText = text;
        return this;
    }

    public getValue(): string {
        return this.textareaElement.value;
    }

    public setValue(value: string) {
        this.textareaElement.value = value;
        return this;
    }
}