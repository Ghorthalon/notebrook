import { UIWindow } from "../ui/window";
import { View } from "./view";

export class ViewManager {
    private currentView: View | undefined | null;
    private views: View[];
    private window: UIWindow;
    public constructor() {
        this.views = [];
        this.window = new UIWindow("Notebrook");
        this.currentView = null;
    }

    public add(view: View) {
        this.views.push(view);
        view.onCreate();
    }

    public remove(view: View) {
        this.views.splice(this.views.indexOf(view), 1);
        view.onDestroy();
        if (view === this.currentView) this.window.remove(this.currentView.show());
        if (this.currentView) this.currentView.setActive(false);
        this.currentView = null;
    }

    public switchTo(view: View) {
        if (!this.views.includes(view)) {
            throw new Error("View not initialized");
        }
        if (this.currentView) {
            this.currentView.onDeactivate();
            this.currentView.setActive(false);
            this.window.remove(this.currentView.show());
        }
        this.currentView = view;
        this.currentView.setActive(true);
        this.currentView.onActivate();
        this.window.add(this.currentView.show());
    }

    public render(): HTMLElement|undefined {
        return this.window.show();
    }

    public push(view: View) {
        if (this.currentView) {
            this.currentView.onDeactivate();
            this.currentView.setActive(false);
            this.window.remove(this.currentView.show());
        }
        
        this.views.unshift(view);
        this.currentView = view;
        this.currentView.onCreate();
        this.currentView.setActive(true);
        this.currentView.onActivate();
        this.window.add(this.currentView.show());
    }

    public pop() {
        if (this.currentView) {
            this.currentView.onDeactivate();
            this.currentView.setActive(false);
            this.window.remove(this.currentView.show());
            this.currentView.onDestroy();
        }
        this.views.splice(0, 1);
        this.currentView = this.views[0];
        this.currentView.setActive(true);
        this.currentView.onActivate();
        this.window.add(this.currentView.show());
    }
}
