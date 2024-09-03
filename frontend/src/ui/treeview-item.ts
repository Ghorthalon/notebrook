import { UINode } from "./node";
import { Treeview } from "./treeview";

export class TreeviewItem extends UINode {
    private listElement: HTMLLIElement;
    private childContainer!: HTMLUListElement;

    public children: TreeviewItem[];

    private expanded!: boolean;

    private focused: number;

    private parent?: TreeviewItem;

    private root!: Treeview;

    private previousItem?: TreeviewItem;
    private nextItem?: TreeviewItem;

    public constructor(title: string) {
        super(title);
        this.listElement = document.createElement("li");
        this.listElement.innerText = this.title;
        this.listElement.setAttribute("tabindex", "-1");
        this.listElement.setAttribute("role", "treeitem");
        this.element.appendChild(this.listElement);
        this.listElement.setAttribute("aria-label", this.title);
        this.children = [];
        this.focused = 0;
    }

    public focus() {
        this.listElement.focus();
    }

    public click() {
        this.listElement.click();
    }

    public getElement(): HTMLElement {
        return this.listElement;
    }

    public setText(text: string) {
        this.title = text;
        this.listElement.innerText = text;
        this.element.setAttribute("aria-label", this.title);
        this.listElement.setAttribute("aria-label", this.title);
    }

    public add(node: TreeviewItem) {
        this.children.push(node);
        node.setParent(this);
        this.setExpanded(false);
        if (this.children.length > 0) {
            this.previousItem = this.children[this.children.length - 1];
            this.previousItem.setNextItem(node);
        }
    }

    public remove(node: TreeviewItem) {
        const idx = this.children.indexOf(node);
        if (idx > -1) {
            this.children.splice(idx, 1);
            this.updateShownItems();
        }
    }

    public expand() {
        if (!this.isExpandable()) return;
        if (this.isExpandable() && this.isExpanded() && this.children[this.focused].isExpandable()) {
            this.children[this.focused].expand();
            return;
        }
        this.setExpanded(true);
        this.updateShownItems();
        this.children[this.focused].focus();
    }

    public collapse(ignoreFocus: boolean = false) {
        if (!this.isExpandable()) {
            if (this.getElement() !== document.activeElement && ignoreFocus) return;
            this.parent?.collapse(true);
            return;
        }
        this.setExpanded(false);
        this.updateShownItems();
        setTimeout(() => this.focus(), 0);
    }

    public isExpandable(): boolean {
        return this.children.length > 0;
    }

    public isExpanded() {
        return this.expanded;
    }

    private setExpanded(val: boolean) {
        this.expanded = val;
        if (this.expanded) {
            this.listElement.setAttribute("aria-expanded", "true");
            return;
        }
        this.listElement.setAttribute("aria-expanded", "false");
    }

    private updateShownItems() {
        if (this.expanded) {
            if (!this.childContainer) {
                this.childContainer = document.createElement("ul");
                this.childContainer.setAttribute("role", "group");
                this.children.forEach((child) => this.childContainer.appendChild(child.render()));
                this.listElement.appendChild(this.childContainer);
            } else {
                this.childContainer.hidden = false;
            }
        } else {
            this.childContainer.hidden = true;
            // this.listElement.removeChild(this.childContainer);
        }
    }

    public focusNext(): boolean {
        if (this.isExpandable() && this.isExpanded() && this.children[this.focused].isExpandable()) {
            return this.children[this.focused].focusNext();
        }
        this.children[this.focused].setTabbable(false);
        this.focused = Math.min(this.children.length - 1, this.focused + 1);
        this.children[this.focused].setTabbable(true);
        this.children[this.focused].focus();
        return true;
    }

    public focusPrevious(): boolean {
        if (this.isExpandable() && this.isExpanded() && this.children[this.focused].isExpandable()) {
            return this.children[this.focused].focusPrevious();
        }
        this.children[this.focused].setTabbable(false);
        this.focused = Math.max(0, this.focused - 1);
        this.children[this.focused].setTabbable(true);
        this.children[this.focused].focus();
        return true;
    }

    public setParent(item: TreeviewItem) {
        this.parent = this.parent;
    }

    public getParent(): TreeviewItem|undefined {
        return this.parent;
    }

    public setPrevious(node: TreeviewItem) {
        this.previousItem = node;
    }

    public setNextItem(node: TreeviewItem) {
        this.nextItem = node;
    }

    public getPrevious(): TreeviewItem|undefined {
        return this.previousItem;
    }

    public getNext(): TreeviewItem|undefined {
        return this.nextItem;
    }

    public _onKeydown(key: string, alt?: boolean, shift?: boolean, ctrl?: boolean): boolean {
        switch (key) {
            case "ArrowUp":
                this.focusPrevious();
                return true;
                break;
            case "ArrowDown":
                this.focusNext();
                return true;
            case "ArrowLeft":
                this.collapse();
                return true;
            case "ArrowRight":
                if (this.children[this.focused].isExpandable() && !this.children[this.focused].isExpanded()) {
                    this.children[this.focused].expand();
                    return true;
                }
                break;
            default:
                return false;
        }
        return false;
    }

    public focusOnItem() {
        this.children[this.focused].focus();
    }
}