import { UINode } from "./node";

export class AudioRecorder extends UINode {
    private audioElement: HTMLAudioElement;
    private mediaRecorder: MediaRecorder | null;
    private audioChunks: Blob[];
    private stream: MediaStream | null;
    private recording?: Blob;

    public constructor(title: string) {
        super(title);
        this.audioElement = document.createElement("audio");
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.stream = null;

        this.audioElement.setAttribute("controls", "true");
        this.audioElement.setAttribute("aria-label", title);
        this.element.appendChild(this.audioElement);

        this.setRole("audio-recorder");
    }

    public async startRecording() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: { autoGainControl: true, channelCount: 2, echoCancellation: false, noiseSuppression: false } });
            this.mediaRecorder = new MediaRecorder(this.stream);
            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };
            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                this.recording = audioBlob;
                this.audioChunks = [];
                const audioUrl = URL.createObjectURL(audioBlob);
                this.audioElement.src = audioUrl;
                this.triggerRecordingComplete(audioUrl);
            };
            this.mediaRecorder.start();
        } catch (error) {
            console.error("Error accessing microphone:", error);
        }
    }

    public stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
            this.mediaRecorder.stop();
        }
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }

    public getElement(): HTMLElement {
        return this.element;
    }

    public onRecordingComplete(callback: (audioUrl: string) => void) {
        this.element.addEventListener("recording-complete", (event: Event) => {
            const customEvent = event as CustomEvent;
            callback(customEvent.detail.audioUrl);
        });
        return this;
    }

    protected triggerRecordingComplete(audioUrl: string) {
        const event = new CustomEvent("recording-complete", { detail: { audioUrl } });
        this.element.dispatchEvent(event);
        return this;
    }

    public getRecording() {
        return this.recording;
    }
}
