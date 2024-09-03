import { Button } from "../ui";
import { Dialog } from "../ui/dialog";
import { state } from "../state";

export class SettingsDialog extends Dialog<void> {
    private resetButton: Button;

    public constructor() {
        super("Settings");
        this.resetButton = new Button("Reset frontend");
        this.resetButton.setPosition(30, 20, 30, 30);
        this.resetButton.onClick(() => {
            this.reset();
        });
        this.add(this.resetButton);
    }

    private reset() {
        state.clear().then(() => {
            window.location.reload();
        });       
    }
}