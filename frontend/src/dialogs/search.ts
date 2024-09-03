import { API } from "../api";
import { IMessage } from "../model/message";
import { Button, List, ListItem, TextInput } from "../ui";
import { Dialog } from "../ui/dialog";

export class SearchDialog extends Dialog<{channelId: number, messageId: number}> {
    private searchField: TextInput;
    private searchButton: Button;
    private resultsList: List;
    private closeButton: Button;

    public constructor() {
        super("Search for message", false);
        this.searchField = new TextInput("Search query");
        this.searchField.setPosition(5, 5, 80, 20);
        this.searchField.onKeyDown((key) => {
            if (key === "Enter") {
                this.searchButton.click();
            }
        });
        this.searchButton = new Button("Search");
        this.searchButton.setPosition(85, 5, 10, 20);
        this.searchButton.onClick(async () => {
            const messages = await API.search(this.searchField.getValue());
            console.log(messages);
            this.renderResults(messages);
        })
        this.resultsList = new List("Results");
        this.resultsList.setPosition(5, 20, 90, 70);
        this.closeButton = new Button("Close");
        this.closeButton.setPosition(5, 90, 90, 5);
        this.closeButton.onClick(() => this.cancel());
        this.add(this.searchField);
        this.add(this.searchButton);
        this.add(this.resultsList);
        this.add(this.closeButton);
    }

    private renderResults(messages: IMessage[]) {
        this.resultsList.clear();
        messages.forEach((message) => {
            const itm = new ListItem(`${message.content}; ${message.createdAt}`);
            itm.onClick(() => this.choose({ messageId: message.id, channelId: message.channelId! }));
            this.resultsList.add(itm);
        });
        this.resultsList.focus();
    }
}