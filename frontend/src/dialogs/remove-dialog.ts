import { Button } from "../ui";
import { Dialog } from "../ui/dialog";
import { Text } from "../ui";
import { API } from "../api";
import { state } from "../state";
import { showToast } from "../speech";

export class RemoveDialog extends Dialog<boolean> {
    private content: Text;
    private confirmButton: Button;
    protected cancelButton: Button;

    public constructor(channelId: string) {
        super("Remove channel", false);
        this.content = new Text("Are you sure you want to remove this channel?");
        this.confirmButton = new Button("Remove");
        this.confirmButton.setPosition(30, 30, 40, 30);
        this.confirmButton.onClick(() => this.doRemove());
        this.cancelButton = new Button("Cancel");
        this.cancelButton.setPosition(30, 70, 40, 30);
        this.cancelButton.onClick(() => this.cancel());
        this.add(this.content);
        this.add(this.confirmButton);
        this.add(this.cancelButton);
    }

    private async doRemove() {
        try {
            const res = await API.deleteChannel(state.currentChannel!.id.toString());
            state.removeChannel(state.currentChannel!);
            showToast("Channel was removed.");
            this.choose(true);
        } catch (e) {
            showToast("Failed to remove channel: " + e);
            
            this.choose(false);
        }
    }
}