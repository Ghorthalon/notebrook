import { Container } from "./container";
import { UINode } from "./node";

export class UIWindow {
    public title: string;
    public width!: number;
    public height!: number;
    public position!: { x: number; y: number; };
    public container: Container;
    public visible: boolean;
    private element: HTMLDivElement;
    private rendered!: boolean;
    private keyDown: (e: KeyboardEvent) => void;

    public constructor(
        title: string,
        classname?: string,
        private setTitle: boolean = true
    ) {
        this.title = title;
        this.container = new Container(this.title);
        this.container._onConnect();
        this.element = document.createElement("div");
        if (classname) {
            this.element.className = classname;
        }
        this.keyDown = this.onKeyDown.bind(this);
        this.visible = false;
    }

    public add(node: UINode) {
        this.container.add(node);
        return this;
    }

    public remove(node: UINode) {
        if (this.container.children.includes(node)) this.container.remove(node);
        return this;
    }

    public show(): HTMLElement|undefined {
        if (this.visible) return;
        if (this.setTitle) document.title = this.title;
        if (this.rendered) return this.element;
        this.element.appendChild(this.container.render());
        this.element.addEventListener("keydown", this.keyDown);
        this.element.focus();
        this.visible = true;
        this.rendered = true;
        return this.element;
    }

    public hide() {
        if (!this.visible) return;
        this.visible = false;
        this.rendered = false;
        this.element.replaceChildren();
        this.element.removeEventListener("keydown", this.keyDown);
    }

    public onKeyDown(e: KeyboardEvent) {
        if (this.container._onKeydown(e.key, e.altKey, e.shiftKey, e.ctrlKey)) {
            e.preventDefault();
        }
    }

    public onConnect() {
        return;
    }

    public onDisconnect() {
        return;
    }

    public getElement(): HTMLElement {
        return this.element;
    }

    public getContainer(): Container {
        return this.container;
    }
}