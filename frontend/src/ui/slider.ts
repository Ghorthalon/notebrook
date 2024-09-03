import { UINode } from "./node";

export class Slider extends UINode {
    private id: string;
    private titleElement: HTMLLabelElement;
    private sliderElement: HTMLInputElement;
    public constructor(title: string, min: number, max: number, step: number = 1) {
        super(title);
        this.id = Math.random().toString();
        this.titleElement = document.createElement("label");
        this.titleElement.innerText = title;
        this.titleElement.id = `sldr_title_${this.id}`;
        this.sliderElement = document.createElement("input");
        this.sliderElement.id = `sldr_${this.id}`;
        this.sliderElement.type = "range";
        this.sliderElement.min = min.toString();
        this.sliderElement.max = max.toString();
        this.sliderElement.step = step.toString();
        this.titleElement.appendChild(this.sliderElement);
        this.element.appendChild(this.titleElement);
    }

    public focus() {
        this.sliderElement.focus();
        return this;
    }

    public click() {
        this.sliderElement.click();
        return this;
    }

    public getElement(): HTMLElement {
        return this.sliderElement;
    }

    public setText(text: string) {
        this.title = text;
        this.titleElement.innerText = text;
        return this;
    }

    public getValue(): number {
        return parseInt(this.sliderElement.value);
    }

    public setValue(value: number) {
        this.sliderElement.value = value.toString();
        return this;
    }
}