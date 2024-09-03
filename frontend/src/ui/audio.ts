import { UINode } from "./node";

export class Audio extends UINode {
    private audioElement: HTMLAudioElement;

    public constructor(title: string, src: string | MediaStream = "") {
        super(title);
        this.audioElement = document.createElement("audio");
        if (typeof src === "string") {
            this.audioElement.src = src;  // Set src if it's a string URL
        } else if (src instanceof MediaStream) {
            this.audioElement.srcObject = src;  // Set srcObject if it's a MediaStream
        }
        this.audioElement.setAttribute("aria-label", title);
        this.element.appendChild(this.audioElement);
        this.setRole("audio");
    }

    public getElement(): HTMLElement {
        return this.audioElement;
    }

    public setSource(src: string | MediaStream) {
        if (typeof src === "string") {
            this.audioElement.src = src;
        } else if (src instanceof MediaStream) {
            this.audioElement.srcObject = src;
        }
        return this;
    }

    public play() {
        this.audioElement.play();
        return this;
    }

    public pause() {
        this.audioElement.pause();
        return this;
    }

    public setControls(show: boolean) {
        this.audioElement.controls = show;
        return this;
    }

    public setLoop(loop: boolean) {
        this.audioElement.loop = loop;
        return this;
    }

    public setMuted(muted: boolean) {
        this.audioElement.muted = muted;
        return this;
    }

    public setAutoplay(autoplay: boolean) {
        this.audioElement.autoplay = autoplay;
        return this;
    }

    public setVolume(volume: number) {
        this.audioElement.volume = volume;
        return this;
    }
}
