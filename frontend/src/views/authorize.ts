import { showToast } from "../speech";
import { Button, Text, TextInput } from "../ui";
import { View } from "./view";
import { state } from "../state";
import { API } from "../api";
import { MainView } from "./main";
import { playSound } from "../sound";

export class AuthorizeView extends View {
    private welcomeText!: Text;
    private apiURLInput!: TextInput;
    private tokenInput!: TextInput;
    private loginButton!: Button;

    public onActivate(): void {
        playSound("intro");
    }
    public onDeactivate(): void {
    }
    public onCreate(): void {
        this.welcomeText = new Text("Welcome to Notebrook!");
        this.welcomeText.setPosition(25, 10, 75, 20);
        this.apiURLInput = new TextInput("API URL");
        this.apiURLInput.setPosition(40, 40, 20, 20);
        this.tokenInput = new TextInput("Token");
        this.tokenInput.setPosition(40, 60, 20, 10);
        this.loginButton = new Button("Login");
        this.loginButton.setPosition(40, 70, 20, 10);
        this.window.add(this.welcomeText);
        this.window.add(this.apiURLInput);
        this.window.add(this.tokenInput);
        this.window.add(this.loginButton);

        this.loginButton.onClick(async () => {
            const token = this.tokenInput.getValue();
            const apiUrl = this.apiURLInput.getValue();
            API.path = apiUrl;
            API.token = token;
            try {
                await API.checkToken();
                state.token = token;
                state.apiUrl = apiUrl;
                state.save();
                showToast(`Welcome!`, 2000);
                playSound("login");
                this.viewManager.push(new MainView(this.viewManager));
            } catch (e) {
                showToast(`Invalid API URL or token provided.`);
                playSound("uploadFailed");
            }
        });
    }
    
    public onDestroy(): void {
    }
}