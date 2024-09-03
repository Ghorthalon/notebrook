import { UINode } from "./node";
import { UITab } from "./tab";

export class TabBar extends UINode {
    private tabs: UITab[];
    private tabBarContainer: HTMLDivElement;
    private onTabChangeCallback?: (index: number) => void;
    private focused: number;

    public constructor(title: string = "tab bar") {
        super(title);
        this.tabs = [];
        this.tabBarContainer = document.createElement("div");
        this.tabBarContainer.setAttribute("role", "tablist");
        this.tabBarContainer.style.display = "flex";
        this.tabBarContainer.style.alignItems = "center";
        // this.tabBarContainer.style.justifyContent = "space-between";
        this.tabBarContainer.style.overflow = "hidden";
        
        this.element.appendChild(this.tabBarContainer);
        this.focused = 0;
    }

    public _onFocus() {
        this.tabs[this.focused].focus();
        return this;
    }

    public focus() {
        this.tabs[this.focused].focus();
        return this;
    }

    public add(title: string) {
        const idx = this.tabs.length;
        const elem = new UITab(title);
        elem.onClick(() => {
            this.selectTab(idx);
        });
        this.tabs.push(elem);
        this.tabBarContainer.appendChild(elem.render());
        elem._onConnect();
        if (this.tabs.length === 1) this.calculateTabIndex();
        return this;
    }

    public onTabChange(f: (index: number) => void) {
        this.onTabChangeCallback = f;
        return this;
    }

    private selectTab(idx: number) {
        if (idx !== this.focused) {
            this.tabs[this.focused].setTabbable(false);
            this.focused = idx;
        }
        if (!this.onTabChangeCallback) return;
        this.onTabChangeCallback(idx);
        this.tabs[idx].setTabbable(true);
        this.tabs[idx].focus();
        this.updateView();
    }

    public _onKeydown(key: string): boolean {
        switch (key) {
            case "ArrowLeft":
                this.tabs[this.focused].setTabbable(false);
                this.focused = Math.max(0, this.focused - 1);
                this.tabs[this.focused].setTabbable(true);
                this.selectTab(this.focused);
                return true;
                break;
            case "ArrowRight":
                this.tabs[this.focused].setTabbable(false);
                this.focused = Math.min(this.tabs.length - 1, this.focused + 1);
                this.tabs[this.focused].setTabbable(true);
                this.selectTab(this.focused);
                return true;
                break;
            default:
                return false;
                break;
        }
        return false;
    }

    private updateView() {
        for (let i = 0; i < this.tabs.length; i++) {
            this.tabs[i].setSelected(i === this.focused);
        }
    }

    public getElement(): HTMLElement {
        return this.element;
    }

    
    public calculateTabIndex() {
        this.tabs[this.focused].setTabbable(true);
        return this;
    }
}