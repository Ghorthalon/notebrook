import { Button } from "../ui";
import { Audio } from "../ui/audio";
import { AudioRecorder } from "../ui/audio-recorder";
import { Dialog } from "../ui/dialog";

export class RecordAudioDialog extends Dialog<Blob> {
    private audioRecorder: AudioRecorder;
    private recordButton: Button;
    private stopButton: Button;
    private playButton: Button;
    private saveButton: Button;
    private discardButton: Button;
    private audioBlob: Blob | undefined;
    private audioPlayer?: Audio;

    constructor() {
        super("Record audio", false);
        this.audioRecorder = new AudioRecorder("Record from microphone");
        this.audioRecorder.onRecordingComplete(() => {
            this.audioBlob = this.audioRecorder.getRecording();
            this.saveButton.setDisabled(false);
        });
        this.recordButton = new Button("Record");
        this.recordButton.setPosition(30, 30, 40, 30);
        this.recordButton.onClick(() => this.startRecording());
        this.stopButton = new Button("Stop");
        this.stopButton.setPosition(70, 40, 30, 30);
        this.stopButton.onClick(() => this.stopRecording());
        this.stopButton.setDisabled(true);
        this.saveButton = new Button("Save");
        this.saveButton.setPosition(10, 80, 50, 20);
        this.saveButton.onClick(() => this.saveRecording());
        this.saveButton.setDisabled(true);
        this.playButton = new Button("Play");
        this.playButton.setPosition(0, 40, 30, 30);
        this.playButton.onClick(() => {
            if (this.audioBlob) {
                this.audioPlayer = new Audio("Recorded audio");
                this.audioPlayer.setSource(URL.createObjectURL(this.audioBlob));
                this.audioPlayer.play();
            }
        });
        this.playButton.setDisabled(true);
        this.discardButton = new Button("Discard");
        this.discardButton.setPosition(50, 90, 50, 10);
        this.discardButton.onClick(() => this.cancel());
        this.add(this.recordButton);
        this.add(this.stopButton);
        this.add(this.playButton);
        this.add(this.saveButton);
        this.add(this.discardButton);
    }

    private startRecording() {
        this.audioRecorder.startRecording();
        this.stopButton.setDisabled(false);
        this.recordButton.setDisabled(true);
    }

    private stopRecording() {
        this.audioRecorder.stopRecording();
        this.recordButton.setDisabled(false);
        this.stopButton.setDisabled(true);
        this.playButton.setDisabled(false);
    }

    private saveRecording() {
        if (this.audioBlob) {
            this.choose(this.audioBlob);
        }
    }
}