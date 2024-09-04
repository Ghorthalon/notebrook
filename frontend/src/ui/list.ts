import { UINode } from "./node";


export class List extends UINode {
    public children: UINode[];
    protected listElement: HTMLUListElement;
    private focused: number;
    protected selectCallback?: (id: number) => void;
    public constructor(title: string) {
        super(title);
        this.children = [];
        this.listElement = document.createElement("ul");
        this.listElement.setAttribute("role", "listbox");
        this.listElement.style.listStyle = "none";
        this.element.appendChild(this.listElement);
        this.element.setAttribute("aria-label", this.title);
        this.focused = 0;
    }

    public add(node: UINode) {
        this.children.push(node);
        node._onConnect();
        this.listElement.appendChild(node.render());
        if (this.children.length === 1) this.calculateTabIndex();
        node.onFocus(() => this.calculateFocused(node));
        return this;
    }

    public addNodeAtIndex(node: UINode, index: number) {
        index = Math.max(0, Math.min(index, this.children.length));
        this.children.splice(index, 0, node);
        node._onConnect();
        this.listElement.insertBefore(node.render(), this.listElement.children[index]);
        if (this.children.length === 1) this.calculateTabIndex();
        node.onFocus(() => this.calculateFocused(node));
        return this;
    }

    public remove(node: UINode) {
        const idx = this.children.indexOf(node);
        this.children.splice(idx, 1);
        node._onDisconnect();
        this.listElement.removeChild(node.render());
        if (idx === this.focused) {
            if (this.focused > 0) this.focused--;
            this.calculateTabIndex();
        }
        return this;
    }

    public _onFocus() {
        super._onFocus();
        this.focusSelectedMessage();
        return this;
    }

    public _onClick() {
        // this.children[this.focused]._onClick();
    }

    public _onSelect(id: number) {
        if (this.selectCallback) this.selectCallback(id);
    }

    protected calculateStyle(): void {
        super.calculateStyle();
        this.element.style.overflowY = "scroll";
        this.listElement.style.overflowY = "scroll";
    }

    public _onKeydown(key: string, alt: boolean = false, shift: boolean = false, ctrl: boolean = false): boolean {
        switch (key) {
            case "ArrowUp":
                this.children[this.focused].setTabbable(false);
                this.focused = Math.max(0, this.focused - 1);
                this.children[this.focused].setTabbable(true);
                this.focusSelectedMessage();
                return true;
                break;
            case "ArrowDown":
                this.children[this.focused].setTabbable(false);
                this.focused = Math.min(this.children.length - 1, this.focused + 1);
                this.children[this.focused].setTabbable(true);
                this.focusSelectedMessage();
                return true;
                break;
            case "Enter":
                this.children[this.focused].click();
                return true;
                break;
            case "Home":
                this.children[this.focused].setTabbable(false);
                this.focused = 0;
                this.children[this.focused].setTabbable(true);
                this.focusSelectedMessage();
                return true;
                break;
            case "End":
                this.children[this.focused].setTabbable(false);
                this.focused = this.children.length - 1;
                this.children[this.focused].setTabbable(true);
                this.focusSelectedMessage();
                return true;
                break;
            default:
                return this.children[this.focused]._onKeydown(key);
                break;
        }
        return false;
    }

    protected renderAsListItem(node: UINode) {
        let li = document.createElement("li");
        li.appendChild(node.render());
        return li;
    }

    public getElement(): HTMLElement {
        return this.listElement;
    }

    public isItemFocused(): boolean {
        const has = this.children.find((child) => child.isFocused);
        if (has) {
            return true;
        }
        return false;
    }

    private calculateTabIndex() {
        if (this.children.length < 1) return;
        this.children[this.focused].setTabbable(true);
    }

    public clear() {
        this.children.forEach((child) => this.remove(child));
        this.children = [];
        this.listElement.innerHTML = '';
        this.focused = 0;
        return this;
    }

    public getFocusedChild() {
        return this.children[this.focused];
    }

    public getFocus() {
        return this.focused;
    }

    public onSelect(f: (id: number) => void) {
        this.selectCallback = f;
        return this;
    }

    protected calculateFocused(node: UINode) {
        const idx = this.children.indexOf(node);
        this._onSelect(idx);
        this.focused = idx;
    }

    public scrollToBottom() {
        this.children.forEach((child) => child.setTabbable(false));
        const node = this.children[this.children.length - 1];
        node.getElement().scrollIntoView();
        // set the focused element for tab index without focusing directly.
        this.focused = this.children.length - 1;
        this.children[this.focused].setTabbable(true);
        return this;
    }

    public focusSelectedMessage() {
        this.children[this.focused].focus()
    }
}