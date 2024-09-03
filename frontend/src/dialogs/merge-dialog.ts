import { Button } from "../ui";
import { Dialog } from "../ui/dialog";
import { API } from "../api";
import { Dropdown } from "../ui/dropdown";
import { state } from "../state";
import { showToast } from "../speech";

export class MergeDialog extends Dialog<boolean> {
    private channelList: Dropdown;
    private mergeButton: Button;
    protected cancelButton: Button;

    public constructor() {
        super("Merge channels", false);
        this.channelList = new Dropdown("Target channel", []);
        this.channelList.setPosition(10, 10, 80, 20);
        this.mergeButton = new Button("Merge");
        this.mergeButton.setPosition(30, 30, 40, 30);
        this.mergeButton.onClick(() => this.merge());
        this.cancelButton = new Button("Cancel");
        this.cancelButton.setPosition(30, 70, 40, 30);
        this.cancelButton.onClick(() => this.cancel());
        this.add(this.channelList);
        this.add(this.mergeButton);
        this.add(this.cancelButton);
        this.setupChannelList();
    }

    private setupChannelList() {
        this.channelList.clearOptions();
        state.channelList.getChannels().forEach((channel) => {
            if (channel.id !== state.currentChannel!.id) this.channelList.addOption(channel.id.toString(), channel.name);
        })
    }
    private async merge() {
        const currentChannel = state.currentChannel;
        const target = this.channelList.getSelectedValue();
        const targetChannel = state.getChannelById(parseInt(target));
        console.log(currentChannel, targetChannel);
        if (!targetChannel || !currentChannel) this.cancel();
        try {
            const res = await API.mergeChannels(currentChannel!.id.toString(), target);
            currentChannel!.messages = [];
            showToast("Channels were merged.");
            this.choose(true);
        } catch (e) {
            showToast("Failed to merge channels: " + e);
            this.choose(false);
        }
    }
}