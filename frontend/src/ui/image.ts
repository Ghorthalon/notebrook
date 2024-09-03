import { UINode } from "./node";

export class Image extends UINode {
    private imgElement: HTMLImageElement;
    public constructor(title: string, src: string, altText: string = "") {
        super(title);
        this.imgElement = document.createElement("img");
        this.imgElement.src = src;
        this.imgElement.alt = altText;
        this.element.appendChild(this.imgElement);
        this.element.setAttribute("aria-label", title);
    }

    public getElement(): HTMLElement {
        return this.imgElement;
    }

    public setText(text: string) {
        this.title = text;
        this.element.setAttribute("aria-label", text);
        return this;
    }

    public setSource(src: string) {
        this.imgElement.src = src;
        return this;
    }

    public setAltText(altText: string) {
        this.imgElement.alt = altText;
        return this;
    }
}