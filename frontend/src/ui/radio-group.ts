import { UINode } from "./node";

export class RadioGroup extends UINode {
    private id: string;
    private titleElement: HTMLLegendElement;
    private containerElement: HTMLFieldSetElement;
    private radioElements: Map<string, HTMLInputElement>;
    private radioLabels: Map<string, HTMLLabelElement>;

    public constructor(title: string, options: { key: string; value: string }[]) {
        super(title);
        this.id = Math.random().toString();
        this.titleElement = document.createElement("legend");
        this.titleElement.innerText = title;
        this.titleElement.id = `rdgrp_title_${this.id}`;
        this.containerElement = document.createElement("fieldset");
        this.containerElement.appendChild(this.titleElement);
        this.element.appendChild(this.containerElement);

        this.radioElements = new Map();
        this.radioLabels = new Map();

        options.forEach((option) => {
            const radioId = `rd_${this.id}_${option.key}`;
            const radioElement = document.createElement("input");
            radioElement.id = radioId;
            radioElement.type = "radio";
            radioElement.name = `rdgrp_${this.id}`;
            radioElement.value = option.key;
            radioElement.setAttribute("aria-labeledby", `${radioId}_label`);

            const radioLabel = document.createElement("label");
            radioLabel.innerText = option.value;
            radioLabel.id = `${radioId}_label`;
            radioLabel.setAttribute("for", radioId);

            this.radioElements.set(option.key, radioElement);
            this.radioLabels.set(option.key, radioLabel);

            this.containerElement.appendChild(radioElement);
            this.containerElement.appendChild(radioLabel);
        });
    }

    public focus() {
        const firstRadioElement = this.radioElements.values().next().value;
        if (firstRadioElement) {
            firstRadioElement.focus();
        }
        return this;
    }

    public getElement(): HTMLElement {
        return this.containerElement;
    }

    public setText(text: string) {
        this.title = text;
        this.titleElement.innerText = text;
        return this;
    }

    public getSelectedValue(): string | null {
        for (const [key, radioElement] of this.radioElements.entries()) {
            if (radioElement.checked) {
                return key;
            }
        }
        return null;
    }

    public setSelectedValue(value: string) {
        const radioElement = this.radioElements.get(value);
        if (radioElement) {
            radioElement.checked = true;
        }
        return this;
    }
}