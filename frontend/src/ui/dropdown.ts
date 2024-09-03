import { UINode } from "./node";

export class Dropdown extends UINode {
    private id: string;
    private titleElement: HTMLLabelElement;
    private selectElement: HTMLSelectElement;

    public constructor(title: string, options: { key: string; value: string }[]) {
        super(title);
        this.id = Math.random().toString();
        this.titleElement = document.createElement("label");
        this.titleElement.innerText = title;
        this.titleElement.id = `dd_title_${this.id}`;
        this.selectElement = document.createElement("select");
        this.selectElement.id = `dd_${this.id}`;
        this.titleElement.appendChild(this.selectElement);
        this.element.appendChild(this.titleElement);

        this.setOptions(options);
    }

    public focus() {
        this.selectElement.focus();
        return this;
    }

    public getElement(): HTMLElement {
        return this.selectElement;
    }

    public setText(text: string) {
        this.title = text;
        this.titleElement.innerText = text;
        return this;
    }

    public getSelectedValue(): string {
        return this.selectElement.value;
    }

    public setSelectedValue(value: string) {
        this.selectElement.value = value;
        return this;
    }

    public setOptions(options: { key: string; value: string }[]) {
        this.clearOptions();
        options.forEach((option) => {
            this.addOption(option.key, option.value);
        });
        return this;
    }

    public addOption(key: string, value: string) {
        const optionElement = document.createElement("option");
        optionElement.value = key;
        optionElement.innerText = value;
        this.selectElement.appendChild(optionElement);
        return this;
    }

    public removeOption(key: string) {
        const options = Array.from(this.selectElement.options);
        const optionToRemove = options.find(option => option.value === key);
        if (optionToRemove) {
            this.selectElement.removeChild(optionToRemove);
        }
        return this;
    }

    public clearOptions() {
        while (this.selectElement.firstChild) {
            this.selectElement.removeChild(this.selectElement.firstChild);
        }
        return this
    }
}
