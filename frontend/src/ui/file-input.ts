import { UINode } from "./node";

export class FileInput extends UINode {
    private id: string;
    private titleElement: HTMLLabelElement;
    private inputElement: HTMLInputElement;
    public constructor(title: string, multiple: boolean = false) {
        super(title);
        this.id = Math.random().toString();
        this.titleElement = document.createElement("label");
        this.titleElement.innerText = title;
        this.titleElement.id = `fileinpt_title_${this.id}`;
        this.inputElement = document.createElement("input");
        this.inputElement.id = `fileinpt_${this.id}`;
        this.inputElement.type = "file";
        if (multiple) {
            this.inputElement.multiple = true;
        }
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

    public getFiles(): FileList | null {
        return this.inputElement.files;
    }

    public setAccept(accept: string) {
        this.inputElement.accept = accept;
        return this;
    }
}