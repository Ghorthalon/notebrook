import { UINode } from "./node";

export class Canvas extends UINode {
    private canvasElement: HTMLCanvasElement;
    public constructor(title: string) {
        super(title);
        this.canvasElement = document.createElement("canvas");
        
        this.canvasElement.setAttribute("tabindex", "-1");
        this.element.appendChild(this.canvasElement);
    }

    public focus() {
        this.canvasElement.focus();
        return this;
    }

    public click() {
        this.canvasElement.click();
        return this;
    }

    public getElement(): HTMLElement {
        return this.canvasElement;
    }
}