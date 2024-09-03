import { API } from "../api";
import { IMessage } from "../model/message";
import { Button, Container, TextInput} from "../ui";
import { Dialog } from "../ui/dialog";
import { Text } from "../ui";
import { MultilineInput } from "../ui/multiline-input";
import { state } from "../state";
export class MessageDialog extends Dialog<IMessage | null> {
    private message: IMessage;
    private messageText: MultilineInput;
    private deleteButton: Button;
    private fileInfoContainer?: Container;

    public constructor(message: IMessage) {
        super("Message");
        this.message = message;
        this.messageText = new MultilineInput("Message");
        this.messageText.setValue(message.content);
        this.messageText.setPosition(10, 10, 80, 20);
        
        this.deleteButton = new Button("Delete");
        this.deleteButton.setPosition(10, 90, 80, 10);
        this.deleteButton.onClick(async () => {
            await API.deleteMessage(state.currentChannel!.id.toString(), this.message.id.toString());
            this.choose(null);
        });
        this.add(this.messageText);
        this.add(this.deleteButton);
        if (this.message.fileId !== null) {
            this.fileInfoContainer = new Container("File info");
            this.fileInfoContainer.setPosition(10, 50, 30, 80);
            this.add(this.fileInfoContainer);
            this.handleMessage();
        }
    }

    private handleMessage() {
        if (this.message?.fileType?.toLowerCase().includes("audio")) {
            const audio = new Audio(`${API.path}/${this.message.filePath}`);
            audio.autoplay = true;
        }

        // display info about files, or the image if it is an image. Also display all metadata.
        this.fileInfoContainer?.add(new Text(`File type: ${this.message.fileType}`));
        this.fileInfoContainer?.add(new Text(`File path: ${this.message.filePath}`));
        this.fileInfoContainer?.add(new Text(`File ID: ${this.message.fileId}`));
        this.fileInfoContainer?.add(new Text(`File size: ${this.message.fileSize}`));
        this.fileInfoContainer?.add(new Text(`Original name: ${this.message.originalName}`));
    }
}