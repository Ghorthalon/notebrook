import { Container } from "../ui/container";
import { UIWindow } from "../ui/window";
import { ViewManager } from "./view-manager";

export abstract class View {
    protected viewManager: ViewManager;
    protected window: Container;
    private active!: boolean;
    public constructor(viewManager: ViewManager) {
        this.viewManager = viewManager;
        this.window = new Container("Base view");
    }

    public show() {
        return this.window;
    }

    public abstract onActivate(): void;

    public abstract onDeactivate(): void;

    public abstract onCreate(): void;

    public abstract onDestroy(): void;

    public isActive() {
        return this.isActive;
    }

    public setActive(val: boolean) {
        this.active = val;
    }
}