import { API } from "../api";
import { showToast } from "../speech";
import { TextInput } from "../ui";
import { Dialog } from "../ui/dialog";

export class CreateChannelDialog extends Dialog<string> {
    private nameField: TextInput;

    public constructor() {
        super("Create new channel");
        this.nameField = new TextInput("Name of new channel");
        this.add(this.nameField);
        this.setOkAction(() => {
            return this.nameField.getValue();
        });
        this.nameField.onKeyDown((key) => {
            if (key === "Enter") {
                this.choose(this.nameField.getValue());
            }
        });
    }
}