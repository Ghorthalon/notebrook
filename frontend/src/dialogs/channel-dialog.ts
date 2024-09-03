import { IChannel } from "../model/channel";
import { showToast } from "../speech";
import { state } from "../state";
import { Button, TextInput } from "../ui";
import { Dialog } from "../ui/dialog";
import { MergeDialog } from "./merge-dialog";
import { RemoveDialog } from "./remove-dialog";

export class ChannelDialog extends Dialog<IChannel | null> {
    private channel: IChannel;
    private nameField: TextInput;
    private makeDefault: Button;
    private mergeButton: Button;
    private deleteButton: Button;

    public constructor(channel: IChannel) {
        super("Channel info for " + channel.name);
        this.channel = channel;
        this.nameField = new TextInput("Channel name");
        this.nameField.setPosition(25, 10, 50, 10);
        this.nameField.setValue(channel.name);
        this.makeDefault = new Button("Make default");
        this.makeDefault.setPosition(20, 70, 10, 10);
        this.makeDefault.onClick(() => {
            state.defaultChannelId = this.channel.id;
            showToast(`${channel.name} is now the default channel.`);
        });
        this.mergeButton = new Button("Merge");
        this.mergeButton.setPosition(40, 70, 10, 10);
        this.mergeButton.onClick(() => {
            this.mergeChannel();
        });
        if (state.channelList.channels.length === 1) {
            this.mergeButton.setDisabled(true);
        }
        this.deleteButton = new Button("Delete");
        this.deleteButton.setPosition(60, 70, 10, 10);
        this.deleteButton.onClick(() => {
            this.deleteChannel();
        });
        this.add(this.nameField);
        this.add(this.makeDefault);
        this.add(this.mergeButton);
        this.add(this.deleteButton);
        this.setOkAction(() => {
            this.channel.name = this.nameField.getValue();
            return this.channel;
        });
    }

    private async mergeChannel() {
        const res = await new MergeDialog().open();
        if (res) {
            this.choose(this.channel);
        } else {
            return;
        }
    }

    private async deleteChannel() {
        const res = await new RemoveDialog(this.channel.id.toString()).open();
        if (res) {
            this.choose(null);
        } else {
            return;
        }
    }
}