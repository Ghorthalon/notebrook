import { UITab } from "./tab";

export class UINode {
    protected title: string;
    protected element: HTMLDivElement;
    protected position!: {x: number, y: number, width: number, height: number};
    protected positionType: string = "fixed";
    protected calculateOwnStyle: boolean = true;
    protected keyDownCallback!: (key: string, alt?: boolean, shift?: boolean, ctrl?: boolean) => void | undefined;
    protected focusCallback?: () => void;
    protected blurCallback?: () => void;
    protected clickCallback?: () => void;
    protected globalKeydown: boolean = false;
    protected visible: boolean;
    public isFocused: boolean;
    private userdata: any;

    public constructor(title: string) {
        this.title = title;
        this.element = document.createElement("div");
        this.element.setAttribute("tabindex", "-1");
        this.visible = false;
        this.isFocused = false;
    }

    public focus() {
        this.element.focus();
    }

    public click() {
        this.element.click();
    }

    public _onConnect() {
        this.calculateStyle();
        this.addListeners();
        return;
    }

    public _onDisconnect() {
        return;
    }

    public _onFocus() {
        if (this.focusCallback) this.focusCallback();
        this.isFocused = true;
        return;
    }

    public _onBlur() {
        if (this.blurCallback) this.blurCallback();
        this.isFocused = false;
        return;
    }

    public _onClick() {
        if (this.clickCallback) this.clickCallback();
        return;
    }

    public _onKeydown(key: string, alt: boolean = false, shift: boolean = false, ctrl: boolean = false): boolean {
        if (this.keyDownCallback) {
            if (this.globalKeydown || (!this.globalKeydown && document.activeElement === this.getElement())) {
                this.keyDownCallback(key, alt, shift, ctrl);
                return true;
            }
        }
        return false;
    }

    public render(): HTMLElement {
        this.visible = true;
        return this.element;
    }

    protected addListeners() {
        const elem = this.element;
        this.getElement().addEventListener("focus", (e) => this._onFocus());
        elem.addEventListener("blur", (e) => this._onBlur());
        elem.addEventListener("click", (e) => this._onClick());
        elem.addEventListener("keydown", e => this._onKeydown(e.key, e.altKey, e.shiftKey, e.ctrlKey));
    }

    protected calculateStyle() {
        if (!this.calculateOwnStyle || !this.position) return;
        this.element.style.position = this.positionType;
        this.element.style.left = `${this.position.x}%`;
        this.element.style.top = `${this.position.y}%`;
        this.element.style.width = `${this.position.width}%`;
        this.element.style.height = `${this.position.height}%`;
    }

    public setPosition(x: number, y: number, width: number, height: number, type: string = "fixed") {
        this.position = {
            x: x,
            y: y,
            width: width,
            height: height,
        };
        this.positionType = type;
        this.calculateOwnStyle = true;
        this.calculateStyle();
        return this;
    }

    public onClick(f: () => void) {
        this.clickCallback = f;
        return this;
    }

    public onFocus(f: () => void) {
        this.focusCallback = f;
        return this;
    }

    public onKeyDown(f: (key: string, alt?: boolean, shift?: boolean, ctrl?: boolean) => void, global: boolean = false) {
        this.keyDownCallback = f;
        this.globalKeydown = global;
        return this;
    }

    public onBlur(f: () => void) {
        this.blurCallback = f;
        return this;
    }

    public getElement(): HTMLElement {
        return this.element;
    }

    public setTabbable(val: boolean) {
        this.getElement().setAttribute("tabindex", 
        (val === true) ? "0" :
        "-1");
        return this;
    }

    public setAriaLabel(text: string) {
        this.element.setAttribute("aria-label", text);
        return this;
    }

    public setRole(role: string) {
        this.getElement().setAttribute("role", role);
        return this;
    }

    public getUserData(): any {
        return this.userdata;
    }

    public setUserData(obj: any) {
        this.userdata = obj;
        return this;
    }

    public setAccessKey(key: string) {
        this.getElement().accessKey = key;
        return this;
    }
}