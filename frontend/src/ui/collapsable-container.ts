import { Container } from "./container";

export class CollapsableContainer extends Container {
    private detailsElement: HTMLDetailsElement;
    private summaryElement: HTMLElement;
    private wrapperElement: HTMLDivElement;

    public constructor(title: string) {
        super(title);
        this.wrapperElement = document.createElement("div");
        this.detailsElement = document.createElement("details");
        this.summaryElement = document.createElement("summary");

        this.summaryElement.innerText = title;
        this.detailsElement.appendChild(this.summaryElement);
        this.detailsElement.appendChild(this.containerElement);
        this.wrapperElement.appendChild(this.detailsElement);
    }

    public render() {
        return this.wrapperElement;
    }

    public setTitle(text: string) {
        this.title = text;
        this.summaryElement.innerText = text;
        return this;
    }

    public isCollapsed(): boolean {
        return this.detailsElement.hasAttribute("open");
    }

    public expand(val: boolean) {
        if (val) {
            this.detailsElement.setAttribute("open", "true");
        } else {
            this.detailsElement.removeAttribute("open");
        }
        return this;
    }
}
