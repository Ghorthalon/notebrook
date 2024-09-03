import { UIWindow } from "./window";
import { Button } from "./button";

export class Dialog<T> extends UIWindow {
    private resolvePromise!: (value: T | PromiseLike<T>) => void;
    private rejectPromise!: (reason?: any) => void;
    private promise: Promise<T>;
    private dialogElement!: HTMLDialogElement;
    protected okButton?: Button;
    protected cancelButton?: Button;

    private previouslyFocusedElement!: HTMLElement;

    public constructor(title: string, addButtons: boolean = true) {
        super(title, "dialog", false);
        this.dialogElement = document.createElement("dialog");
        this.promise = new Promise<T>((resolve, reject) => {
            this.resolvePromise = resolve;
            this.rejectPromise = reject;
        });

        // Automatically add OK and Cancel buttons
        if (addButtons) {
            this.okButton = new Button("OK");
            this.okButton.setPosition(70, 90, 10, 5);
            this.okButton.onClick(() => this.choose(undefined));

            this.cancelButton = new Button("Cancel");
            this.cancelButton.setPosition(20, 90, 10, 5);
            this.cancelButton.onClick(() => this.cancel());
        }
    }

    public setOkAction(action: () => T) {
        if (!this.okButton) return;
        this.okButton.onClick(() => {
            const result = action();
            this.choose(result);
        });
        return this;
    }

    public setCancelAction(action: () => void) {
        if (!this.cancelButton) return;
        this.cancelButton.onClick(() => {
            action();
            this.cancel();
        });
        return this;
    }

    public choose(item: T | undefined) {
        this.resolvePromise(item as T);
        document.body.removeChild(this.dialogElement);
        this.hide();
        this.previouslyFocusedElement.focus();
    }

    public cancel(reason?: any) {
        this.rejectPromise(reason);
        
        document.body.removeChild(this.dialogElement);
        this.hide();
        this.previouslyFocusedElement.focus();
    }

    public open(): Promise<T> {
        this.previouslyFocusedElement = document.activeElement as HTMLElement;
        this.dialogElement.appendChild(this.show()!);
        if (this.okButton) this.add(this.okButton);
        if (this.cancelButton) this.add(this.cancelButton);
        document.body.appendChild(this.dialogElement);
        this.dialogElement.showModal();
        this.container.focus();

        return this.promise;
    }
}
