import { API } from "../api";
import { ChunkProcessor } from "../chunk-processor";
import { ChannelDialog } from "../dialogs/channel-dialog";
import { CreateChannelDialog } from "../dialogs/create-channel";
import { MessageDialog } from "../dialogs/message";
import { RecordAudioDialog } from "../dialogs/record-audio";
import { SearchDialog } from "../dialogs/search";
import { SettingsDialog } from "../dialogs/settings";
import { TakePhotoDialog } from "../dialogs/take-photo";
import { MessageUpdated } from "../events/message-events";
import { Channel } from "../model/channel";
import { IMessage, Message } from "../model/message";
import { UnsentMessage } from "../model/unsent-message";
import { playSent, playSound, playWater } from "../sound";
import { showToast } from "../speech";
import { state } from "../state";
import { Button, List, ListItem, TextInput, UINode } from "../ui";
import { Dropdown } from "../ui/dropdown";
import { FileInput } from "../ui/file-input";
import { MultilineInput } from "../ui/multiline-input";
import { connectToWebsocket } from "../websockets";
import { AuthorizeView } from "./authorize";
import { View } from "./view";

export class MainView extends View {
    private settingsButton!: Button;
    private channelSwitcher!: Dropdown;
    private channelInfoButton!: Button;
    private searchButton!: Button;
    private fileInput!: FileInput;
    private messageInput!: MultilineInput;
    private imageInput!: Button;
    private voiceMessageInput!: Button;
    private messageList!: List;
    private updateInterval!: number;

    private messageElementMap: Map<number, UINode> = new Map();

    private hotkeyMap: Map<string, () => void> = new Map();

    public onActivate(): void {
        if (!state.currentChannel) {
            if (state.defaultChannelId) {
                this.switchChannel(state.defaultChannelId.toString());
            } else {
                if (state.channelList.channels.length > 0) this.switchChannel(state.channelList.channels[0].id.toString());
            }
        }
        this.renderInitialMessageList();
        this.checkAuthorization();
        this.syncChannels();
        this.updateChannelList();
        this.syncMessages();
        this.updateInterval = setInterval(() => {
            this.updateVisibleMessageShownTimestamps();
        }, 10000);
        setTimeout(() => this.attemptToSendUnsentMessages(), 2000);

        state.events.registerHandler<MessageUpdated>("message-updated", (message) => {
            const { data } = message;
            if (!data) return;
            const channel = state.currentChannel;
            if (!channel) return;
            const existing = channel.getMessage(parseInt(data!.id));
            if (!existing) {
                return;
            } else {
                existing.content = data.content;
                state.save();
                const renderedMessage = this.messageElementMap.get(existing.id);
                if (renderedMessage) {
                    (renderedMessage as ListItem).setText(`${existing.content}; ${this.convertIsoTimeStringToFriendly(existing.createdAt)}`);
                }
            }
        });

        document.addEventListener("keydown", (e) => this.handleHotkey(e));
    }

    public onDeactivate(): void {
        clearInterval(this.updateInterval);
        // unregister hotkey
        document.removeEventListener("keydown", (e) => this.handleHotkey(e));
    }

    public onCreate(): void {
        this.settingsButton = new Button("Settings")
            .setPosition(0, 0, 10, 10)
            .onClick(() => this.openSettingsDialog());
        this.channelSwitcher = new Dropdown("Channel", [])
            .setPosition(30, 10, 30, 10);
        this.channelInfoButton = new Button("Channel info")
            .setPosition(60, 10, 30, 10);
        this.searchButton = new Button("Search")
            .setPosition(90, 10, 10, 10)
            .onClick(async () => this.openSearchDialog());

        this.fileInput = new FileInput("Upload file")
            .setPosition(0, 90, 15, 10);
        this.imageInput = new Button("Image")
            .setPosition(15, 90, 15, 10);
        this.messageInput = new MultilineInput("New message")
            .setPosition(30, 90, 60, 10);
        this.messageInput.getElement().autofocus = true;
        this.voiceMessageInput = new Button("Voice message")
            .setPosition(70, 90, 30, 10);

        this.messageList = new List("Messages")
            .setPosition(30, 30, 60, 50);
        this.window.add(this.settingsButton)
            .add(this.channelSwitcher)
            .add(this.channelInfoButton)
            .add(this.searchButton)
            .add(this.messageList)
            .add(this.messageInput)
            .add(this.fileInput)
            .add(this.imageInput)
            .add(this.voiceMessageInput);
        this.channelSwitcher.getElement().addEventListener("change", (e) => this.handleChannelSwitcher(e));
        this.voiceMessageInput.onClick(async () => this.handleVoiceMessageButton());

        this.messageInput.onKeyDown((key: string, alt: boolean | undefined, shift: boolean | undefined, ctrl: boolean | undefined) => {
            if (key === "Enter") {
                if (!shift) {
                    console.log(key, alt, shift, ctrl);
                    this.sendMessage();
                }
            }
        });
        this.channelInfoButton.onClick(() => this.handleChannelInfoButton());
        this.imageInput.onClick(async () => this.handleImageButton());
        this.setHotkeys();
    }

    public onDestroy(): void {

    }

    private async syncChannels() {
        const channels = await API.getChannels();
        state.channelList.channels.forEach((chan) => {
            if (!channels.find((c) => c.id === chan.id)) {
                state.removeChannel(chan);
            }
        });
        channels.forEach((chan) => state.addChannel(new Channel(chan)));
        this.updateChannelList();
        if (!state.currentChannel) {
            if (state.defaultChannelId) {
                this.switchChannel(state.defaultChannelId.toString());
            } else {
                if (state.channelList.channels.length > 0) {
                    this.switchChannel(state.channelList.channels[0].id.toString());
                } else {
                    this.createNewChannel();
                }
            }
        }
        state.save();
    }

    private updateChannelList() {
        this.channelSwitcher.clearOptions();
        state.getChannels().forEach((chan) => {
            this.channelSwitcher.addOption(chan.id.toString(), chan.name);
        });
        this.channelSwitcher.addOption("__new__", "Add new channel");
    }

    private checkAuthorization() {
        if (!state.token || !state.apiUrl) {
            this.viewManager.push(new AuthorizeView(this.viewManager));
        } else {
            API.token = state.token;
            API.path = state.apiUrl;
            connectToWebsocket();
        }

        state.save();
    }

    private async syncMessages() {
        if (!state.currentChannel) return;
        if (!state.currentChannel.messages) state.currentChannel.messages = [];
        const channelId = state.currentChannel.id;
        if (channelId) {
            const messages = await API.getMessages(channelId.toString());
            // first, delete all local messages that are no longer on the remote using the chunk processor
            const proc = new ChunkProcessor<IMessage>(100);
            proc.processArray(state.currentChannel.messages, (chunk: IMessage[]) => {
                chunk.forEach((message: IMessage) => {
                    if (!messages.find((m) => m.id === message.id)) {
                        state.currentChannel!.removeMessage(message.id);
                        const elem = this.messageElementMap.get(message.id);
                        if (elem) {
                            this.messageList.remove(elem);
                            this.messageElementMap.delete(message.id);
                        }
                    }
                });
            });
            // only render new list items, or list items that have changed.
            proc.processArray(messages, (chunk: IMessage[]) => {
                chunk.forEach((message: IMessage) => {
                    // TODO: this could do with a lot of perf improvements. I'll get to it once this is an issue.
                    const existing = state.currentChannel!.getMessage(message.id);
                    if (!existing) {
                        state.currentChannel!.addMessage(new Message(message));
                        this.renderAndAddMessage(message);
                    } else {
                        // TODO: this is awful and needs to be updated, but it works for now.
                        if (existing.content !== message.content || existing.fileId !== message.fileId || existing.filePath !== message.filePath || existing.fileType !== message.fileType || existing.createdAt !== message.createdAt) {
                            existing.content = message.content;
                            existing.fileId = message.fileId;
                            existing.filePath = message.filePath;
                            existing.fileType = message.fileType;
                            existing.createdAt = message.createdAt;
                            existing.fileId = message.fileId;
                            existing.filePath = message.filePath;
                            existing.fileSize = message.fileSize;
                            const renderedMessage = this.messageElementMap.get(message.id);
                            if (renderedMessage) {
                                (renderedMessage as ListItem).setText(`${message.content}; ${this.convertIsoTimeStringToFriendly(message.createdAt)}`);
                            }
                        }
                    }
                });
            });
        }
        state.save();
    }

    public switchChannel(channelId: string) {
        if (this.messageList.children.length > 0) this.messageList.clear();
        const chan = state.getChannelById(parseInt(channelId));
        if (!chan) {
            throw new Error("Could not find channel " + channelId);
        }
        state.currentChannel = chan;
        state.save();
    }

    private renderMessage(message: IMessage): UINode {
        const itm = new ListItem(`${message.content}; ${this.convertIsoTimeStringToFriendly(message.createdAt)}`);
        itm.setUserData(message.id);
        itm.onClick(() => {
            this.openMessageDialog(message);
        })
        itm.onKeyDown(async (key: string, alt: boolean | undefined, shift: boolean | undefined, ctrl: boolean | undefined) => {
            if (key === "c") {
                navigator.clipboard.writeText(message.content.trim());
                playSound("copy");
            }

            if (key === "Delete") {
                await this.removeMessage(message.id);
                if (this.messageList.children.length === 0) {
                    this.messageInput.focus()
                } else {
                    this.messageList.focusSelectedMessage()
                }
            }
        });
        return itm;
    }

    private renderInitialMessageList(reset: boolean = false) {
        if (!state.currentChannel) return;
        if (!state.currentChannel.messages || state.currentChannel.messages.length < 1) return;
        if (this.messageList.children.length > 0 && !reset) {
            return;
        } else {
            this.messageList.clear();
            this.messageElementMap.clear();
        }
        state.currentChannel.messages.forEach((message) => {
            this.renderAndAddMessage(message);
        });
        this.messageList.scrollToBottom();
    }

    private async createNewChannel() {
        const name = await new CreateChannelDialog().open();
        if (name) {
            const chan = await API.createChannel(name);
            state.addChannel(new Channel(chan));
            this.updateChannelList();
            if (state.channelList.channels.length < 2) {
                state.defaultChannelId = chan.id;
            }
            state.save();
        }
    }

    private async sendMessage() {
        if (this.fileInput && this.fileInput.getFiles() && this.fileInput.getFiles()!.length > 0) {
            return this.uploadFile();
        }
        if (this.messageInput.getValue().length > 0) {
            const messageContent = this.messageInput.getValue();
            this.messageInput.setValue("");
            playWater();
            try {
                const message: IMessage = await API.createMessage(state.currentChannel!.id.toString(), messageContent);
                this.messageInput.setValue("");
                this.renderAndAddMessage(message);
                this.messageList.scrollToBottom();
                playSent();
                state.save();
            } catch (e) {
                showToast("Could not post message. Will retry later.", 3000);
                playSound("uploadFailed");
                const unsentId = Date.now();
                state.unsentMessages.push(new UnsentMessage({
                    channelId: state.currentChannel!.id,
                    content: messageContent,
                    createdAt: new Date().toISOString(),
                    id: unsentId
                }));
                const tmpMessage: IMessage = new Message({
                    id: unsentId,
                    content: messageContent,
                    createdAt: new Date().toISOString(),
                });
                state.currentChannel!.addMessage(tmpMessage);
                this.renderAndAddMessage(tmpMessage);
                state.save();
            }
        }
    }

    private async uploadVoiceMessage(blob: Blob) {
        playWater();
        const msgContent = this.messageInput.getValue() !== "" ? this.messageInput.getValue() : "Voice message";
        this.messageInput.setValue("");
        const msg = await API.createMessage(state.currentChannel!.id.toString(), msgContent);
        const id = msg.id;
        try {
            const response: any = await API.uploadFile(state.currentChannel!.id.toString(), id.toString(), blob);
            if (msg) {
                msg.fileId = response.fileId;
                msg.filePath = response.filePath;
                msg.fileType = response.fileType;
                state.currentChannel!.addMessage(new Message(msg));
                this.renderAndAddMessage(msg);
                playSent();
                state.save();
            } else {
                showToast("Something went wrong during message file upload.");
                playSound("uploadFailed");
                // TODO: Handle the case when no message is found
            }
        } catch (e) {
            playSound("uploadFailed");
            showToast("Unable to send message. Will retry later.", 3000);
            state.unsentMessages.push(new UnsentMessage({
                channelId: state.currentChannel!.id,
                content: msgContent,
                createdAt: new Date().toISOString(),
                blob: blob,
                id: Date.now()
            }));
            state.save();
        }
    }

    private async uploadFile() {
        if (!this.fileInput.getFiles()) return;
        if (this.fileInput!.getFiles()!.length < 1) return;
        const file = this.fileInput!.getFiles()![0];
        if (file) {
            playWater();
            const msgContent = this.messageInput.getValue() !== "" ? this.messageInput.getValue() : "File upload";
            this.messageInput.setValue("");
            try {
                const msg = await API.createMessage(state.currentChannel!.id.toString(), msgContent);
                const id = msg.id;
                const response: any = await API.uploadFile(state.currentChannel!.id.toString(), id.toString(), file);
                if (msg) {
                    msg.fileId = response.fileId;
                    msg.filePath = response.filePath;
                    msg.fileType = response.fileType;
                    state.currentChannel!.addMessage(new Message(msg));
                    this.renderAndAddMessage(msg);
                    playSent();
                    this.messageInput.setValue("");
                    // reset the file picker
                    (this.fileInput.getElement() as HTMLInputElement).value = "";
                    state.save();
                } else {
                    showToast("Error while uploading file.");
                    playSound("uploadFailed");
                    // TODO: Handle the case when no message is found
                }
            } catch (e) {
                showToast("Could not post message. Will retry later.", 3000);
                playSound("uploadFailed");
                state.unsentMessages.push(new UnsentMessage({
                    channelId: state.currentChannel!.id,
                    content: this.messageInput.getValue(),
                    createdAt: new Date().toISOString(),
                    blob: file,
                    id: Date.now()
                }));
                state.save();
            }
        }
    }

    private convertIsoTimeStringToRelative(isoTimeString: string): string {
        const date = new Date(isoTimeString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        if (diff < 1000 * 60) {
            return `${Math.floor(diff / 1000)} seconds ago`;
        } else if (diff < 1000 * 60 * 60) {
            // return both minutes and seconds
            return `${Math.floor(diff / (1000 * 60))} minutes   ${Math.floor((diff % (1000 * 60)) / 1000)} seconds ago`;
        } else if (diff < 1000 * 60 * 60 * 24) {
            // return hours, minutes, seconds ago
            return `${Math.floor(diff / (1000 * 60 * 60))} hours   ${Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))} minutes   ${Math.floor((diff % (1000 * 60)) / 1000)} seconds ago`;
        } else {
            return date.toLocaleString();
        }
    }

    private convertIsoTimeStringToFriendly(isoTimeString: string): string {
        const date = new Date(isoTimeString);
        const now = new Date();
        if (date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
            return date.toLocaleTimeString();
        } else {
            return date.toLocaleString();
        }
    }
    private updateVisibleMessageShownTimestamps() {
        const lowerIndex = Math.max(this.messageList.getFocus() - 10, 0);
        const upperIndex = Math.min(this.messageList.getFocus() + 10, this.messageList.children.length);
        for (let i = lowerIndex; i < upperIndex; i++) {
            const child = this.messageList.children[i];
            if (!child) break;
            const messageId = child.getUserData() as number;
            const message = state.currentChannel?.getMessage(messageId);
            if (message) {
                (child as ListItem).setText(`${message.content}; ${this.convertIsoTimeStringToFriendly(message.createdAt)}`);
            }
        }
    }

    private async attemptToSendUnsentMessages() {
        state.unsentMessages.forEach(async (msg) => {
            if (msg.blob) {
                const apiMsg = await API.createMessage(msg.channelId.toString(), msg.content);
                const id = apiMsg.id;
                const response: any = await API.uploadFile(msg.channelId.toString(), id.toString(), msg.blob);
                if (apiMsg) {
                    apiMsg.fileId = response.fileId;
                    apiMsg.filePath = response.filePath;
                    apiMsg.fileType = response.fileType;
                    state.currentChannel!.addMessage(new Message(apiMsg));
                    this.renderAndAddMessage(apiMsg);
                    playSent();
                    state.unsentMessages = state.unsentMessages.filter((m) => m !== msg);
                    this.removeSpecificMessageFromList(msg.id);
                    state.save();
                }
            } else {
                const apiMsg = await API.createMessage(msg.channelId.toString(), msg.content);
                state.currentChannel!.addMessage(new Message(apiMsg));
                this.renderAndAddMessage(apiMsg);
                state.unsentMessages = state.unsentMessages.filter((m) => m !== msg);
                playSent();
                this.removeSpecificMessageFromList(msg.id);
                state.save();
            }
        });
    }

    private clearUnsentMessageDisplay() {
        this.messageList.children.forEach((msg) => {
            const data = msg.getUserData() as IMessage;
            if (data.id === -1) {
                this.messageList.remove(msg);
            }
        })
    }

    private removeSpecificMessageFromList(id: number) {
        const elem = this.messageElementMap.get(id);
        if (elem) {
            this.messageList.remove(elem);
            this.messageElementMap.delete(id);
        }
    }

    private async uploadImage(blob: Blob) {
        playWater();
        try {
            const msg = await API.createMessage(state.currentChannel!.id.toString(), "Image");
            const id = msg.id;
            const response: any = await API.uploadFile(state.currentChannel!.id.toString(), id.toString(), blob);
            if (msg) {
                msg.fileId = response.fileId;
                msg.filePath = response.filePath;
                msg.fileType = response.fileType;
                state.currentChannel!.addMessage(new Message(msg));
                this.renderAndAddMessage(msg);
                playSent();
                state.save();
            } else {
                showToast("Error while uploading file.");
                playSound("uploadFailed");
                // TODO: Handle the case when no message is found
            }
        } catch (e) {
            showToast("Could not post message. Will retry later.", 3000);
            playSound("uploadFailed");
            state.unsentMessages.push(new UnsentMessage({
                channelId: state.currentChannel!.id,
                content: "Image",
                createdAt: new Date().toISOString(),
                blob: blob,
                id: Date.now()
            }));
            state.save();
        }
    }

    private renderAndAddMessage(message: IMessage) {
        const elem = this.renderMessage(message);
        this.messageList.add(elem);
        this.messageElementMap.set(message.id, elem);
    }

    private async openSettingsDialog() {
        const d = new SettingsDialog();
        d.open();
    }

    private async openSearchDialog() {
        const searchDialog = new SearchDialog();
        const res = await searchDialog.open();
        if (res) {
            if (res.channelId && res.messageId) {
                if (state.currentChannel?.id !== res.channelId) {
                    this.switchChannel(res.channelId.toString());
                    this.renderInitialMessageList();
                }
                const message = state.currentChannel!.getMessage(res.messageId);
                if (message) {
                    this.messageElementMap.get(message.id)?.focus();
                }
            }
        }
    }

    private handleChannelSwitcher(e: Event) {
        const target = e.target as HTMLSelectElement;
        if (target.value === "__new__") {
            this.createNewChannel();
        } else {
            this.switchChannel(target.value);
            this.renderInitialMessageList();
            this.syncMessages();
        }
    }

    private async handleVoiceMessageButton() {
        const blob = await new RecordAudioDialog().open();
        if (blob) {
            this.uploadVoiceMessage(blob);
        }
    }

    private async handleChannelInfoButton() {
        if (this.channelSwitcher.getSelectedValue() === "__new__") {
            this.createNewChannel();
            return;
        }
        const d = new ChannelDialog(state.currentChannel!);
        d.open().then((chan) => {
            if (!chan) {
                state.removeChannel(state.currentChannel!);
                state.currentChannel = null;
                this.updateChannelList();
                state.save();
                if (state.channelList.channels.length > 0) {
                    return this.switchChannel(state.channelList.channels[0].id.toString());
                } else {
                    return this.createNewChannel();
                }
            }
            if (chan.messages.length < 1) {
                this.renderInitialMessageList(true);
                this.syncMessages();
            }
            state.save();
            this.updateChannelList();
        });
    }

    private async handleImageButton() {
        const photo = await new TakePhotoDialog().open();
        this.uploadImage(photo);
    }

    private setHotkeys() {
        this.hotkeyMap.set("s", () => this.openSettingsDialog());
        this.hotkeyMap.set("c", () => this.channelSwitcher.focus());
        this.hotkeyMap.set("x", () => this.handleChannelInfoButton());
        this.hotkeyMap.set("f", () => this.openSearchDialog());
        this.hotkeyMap.set("v", () => this.handleVoiceMessageButton());
        this.hotkeyMap.set(" ", () => this.messageInput.focus());
    }

    private handleHotkey(e: KeyboardEvent) {
        let index = 10;
        if ((e.key.match(/[1-9]/) || e.key === '0') && e.altKey) {
            e.preventDefault();
            if (e.key === '0') index = 10;
            index = parseInt(e.key);
            const messages = state.currentChannel?.messages;
            if (messages && messages.length > 0) {
                const msg = messages[messages.length - index];
                if (msg) {
                    showToast(`${msg.content}; ${this.convertIsoTimeStringToFriendly(msg.createdAt)}`);
                } else {
                    showToast('No message is available in this position');
                }
            } else {
                showToast('There are no messages in this channel right now')
            }
        }

        if (e.ctrlKey && e.shiftKey) {
            const action = this.hotkeyMap.get(e.key.toLowerCase());
            if (action) {
                e.preventDefault();
                action();
            }
        }
    }

    private async openMessageDialog(message: IMessage) {
        const d = new MessageDialog(message);
        const msg = await d.open();
        if (!msg || msg === null) {
            state.currentChannel?.removeMessage(message.id);
            const node = this.messageElementMap.get(message.id);
            if (node) {
                this.messageList.remove(node);
                this.messageElementMap.delete(message.id);
            }
            state.save();
        }
    }

    private async removeMessage(id: number) {
        if (state.currentChannel) {
            await API.deleteMessage(state.currentChannel.id.toString(), id.toString());
            state.currentChannel.removeMessage(id);
            const node = this.messageElementMap.get(id);
            if (node) {
                this.messageList.remove(node);
                this.messageElementMap.delete(id);
                state.save();
            }
        }
    }
}