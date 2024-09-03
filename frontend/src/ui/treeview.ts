import { UINode } from "./node";
import { TreeviewItem } from "./treeview-item";

export class Treeview extends UINode {
    public children: TreeviewItem[];
    protected listElement: HTMLUListElement;
    private focused: number;
    protected selectCallback?: (id: number) => void;
    public constructor(title: string) {
        super(title);
        this.children = [];
        this.listElement = document.createElement("ul");
        this.listElement.setAttribute("role", "tree");
        this.listElement.style.listStyle = "none";
        this.element.appendChild(this.listElement);
        this.element.setAttribute("aria-label", this.title);
        this.focused = 0;
    }

    public add(node: TreeviewItem) {
        this.children.push(node);
        node._onConnect();
        this.listElement.appendChild(node.render());
        if (this.children.length === 1) this.calculateTabIndex();
        node.onFocus(() => this.calculateFocused(node));
    }

    public remove(node: TreeviewItem) {
        const idx = this.children.indexOf(node);
        this.children.splice(idx, 1);
        node._onDisconnect();
        this.listElement.removeChild(node.render());
        if (idx === this.focused) {
            if (this.focused > 0) this.focused--;
            this.calculateTabIndex();
        }
    }

    public _onFocus() {
        super._onFocus();
        this.children[this.focused].focus();
    }

    public _onClick() {
        this.children[this.focused]._onClick();
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
                return this.focusPrevious();
                break;
            case "ArrowDown":
                return this.focusNext();
                break;
            case "Enter":
                this.children[this.focused].click();
                return true;
                break;
            case "ArrowLeft":
                // this.children[this.focused].collapse();
                return true;
                break;
            case "ArrowRight":
                this.children[this.focused].expand();
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
        this.children[this.focused].setTabbable(true);
    }

    public clear() {
        this.children.forEach((child) => this.remove(child));
        this.children = [];
        this.listElement.innerHTML = '';
        this.focused = 0;
    }

    public getFocusedChild() {
        return this.children[this.focused];
    }

    public getFocus() {
        return this.focused;
    }

    public onSelect(f: (id: number) => void) {
        this.selectCallback = f;
    }

    protected calculateFocused(node: TreeviewItem) {
        const idx = this.children.indexOf(node);
        this._onSelect(idx);
    }

    public focusPrevious() {
        if (this.children[this.focused].isExpanded()) {
            // return this.children[this.focused].focusPrevious();
        } else {
            this.focused = Math.max(0, this.focused - 1);
            this.children[this.focused].focus();
        }
        return true;
    }

    public focusNext() {
        if (this.children[this.focused].isExpanded()) {
            // return this.children[this.focused].focusNext();
        } else {
            this.focused = Math.min(this.children.length - 1, this.focused + 1);
            this.children[this.focused].focus();
        }

        return true;
    }
}