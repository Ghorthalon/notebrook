import { UINode } from "./node";

export class Video extends UINode {
    private videoElement: HTMLVideoElement;

    public constructor(title: string, src: string | MediaStream = "") {
        super(title);
        this.videoElement = document.createElement("video");
        if (typeof src === "string") {
            this.videoElement.src = src;  // Set src if it's a string URL
        } else if (src instanceof MediaStream) {
            this.videoElement.srcObject = src;  // Set srcObject if it's a MediaStream
        }
        this.videoElement.setAttribute("aria-label", title);
        this.element.appendChild(this.videoElement);
        this.setRole("video");
    }

    public getElement(): HTMLElement {
        return this.videoElement;
    }

    public setSource(src: string | MediaStream) {
        if (typeof src === "string") {
            this.videoElement.src = src;
        } else if (src instanceof MediaStream) {
            this.videoElement.srcObject = src;
        }
        return this;
    }

    public play() {
        this.videoElement.play();
        return this;
    }

    public pause() {
        this.videoElement.pause();
        return this;
    }

    public setControls(show: boolean) {
        this.videoElement.controls = show;
        return this;
    }

    public setLoop(loop: boolean) {
        this.videoElement.loop = loop;
        return this;
    }

    public setMuted(muted: boolean) {
        this.videoElement.muted = muted;
        return this;
    }

    public setAutoplay(autoplay: boolean) {
        this.videoElement.autoplay = autoplay;
        return this;
    }
}
