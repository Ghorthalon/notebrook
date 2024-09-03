import { UINode } from "./node";
import { TabBar } from "./tab-bar";
import { Container } from "./container";


export class TabbedView extends UINode {
    private bar: TabBar;
    private containers: Container[];
    private containerElement: HTMLDivElement;
    private barAtTop: boolean;
    private currentView?: Container;
    public constructor(title: string, barAtTop: boolean = true) {
        super(title);
        this.bar = new TabBar();
        this.bar._onConnect();
        this.bar.onTabChange((index: number) => this.onTabChanged(index));
        this.containers = [];
        this.containerElement = document.createElement("div");
        this.element.appendChild(this.bar.render());
        this.element.appendChild(this.containerElement);
        this.element.setAttribute("tabindex", "-1");
        this.barAtTop = barAtTop;
    }

    public add(name: string, container: Container) {
        this.bar.add(name);
        container.setRole("tabpanel");
        this.containers.push(container);
        return this;
    }

    private onTabChanged(idx: number) {
        if (this.currentView) {
            this.containerElement.removeChild(this.currentView.render());
        }
        this.currentView = this.containers[idx];
        this.containerElement.appendChild(this.currentView.render());
    }

    public getElement(): HTMLElement {
        return this.containerElement;
    }

    protected calculateStyle(): void {
        if (this.barAtTop) {
            this.bar.setPosition(0, 0, 100, 5);
        } else {
            this.bar.setPosition(0, 90, 100, 5);
        }
    }
}