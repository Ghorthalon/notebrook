import { UINode } from "./node";

export class Container extends UINode {
    public children: UINode[];
    protected containerElement: HTMLDivElement;
    private focused: number = 0;

    public constructor(title: string) {
        super(title);
        this.children = [];
        this.containerElement = document.createElement("div");
        this.containerElement.setAttribute("tabindex", "-1");
        this.focused = 0;
    }

    public focus() {
        this.containerElement.focus();
        return this;
    }

    public _onFocus() {
        this.children[this.focused].focus();
    }

    public add(node: UINode) {
        this.children.push(node);
        node._onConnect();
        this.containerElement.appendChild(node.render());
        return this;
    }

    public remove(node: UINode) {
        this.children.splice(this.children.indexOf(node), 1);
        node._onDisconnect();
        this.containerElement.removeChild(node.render());
        return this;
    }

    public render() {
        return this.containerElement;
    }

    public getChildren(): UINode[] {
        return this.children;
    }

    public getElement() {
        return this.containerElement;
    }

    public setAriaLabel(text: string) {
        this.containerElement.setAttribute("aria-label", text);
        return this;
    }
}