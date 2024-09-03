import { UINode } from "./node";

export class ProgressBar extends UINode {
    private progressElement: HTMLProgressElement;
    public constructor(title: string, max: number) {
        super(title);
        this.progressElement = document.createElement("progress");
        this.progressElement.max = max;
        this.element.appendChild(this.progressElement);
        this.element.setAttribute("aria-label", title);
    }

    public getElement(): HTMLElement {
        return this.progressElement;
    }

    public setText(text: string) {
        this.title = text;
        this.element.setAttribute("aria-label", text);
        return this;
    }

    public getValue(): number {
        return this.progressElement.value;
    }

    public setValue(value: number) {
        this.progressElement.value = value;
        return this;
    }

    public getMax(): number {
        return this.progressElement.max;
    }

    public setMax(max: number) {
        this.progressElement.max = max;
        return this;
    }
}