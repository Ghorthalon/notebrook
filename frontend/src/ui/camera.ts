import { UINode } from "./node";

export class Camera extends UINode {
    private videoElement: HTMLVideoElement;
    private canvasElement: HTMLCanvasElement;
    private stream: MediaStream | null;

    public constructor(title: string) {
        super(title);
        this.videoElement = document.createElement("video");
        this.canvasElement = document.createElement("canvas");
        this.stream = null;

        this.videoElement.setAttribute("aria-label", title);
        this.element.appendChild(this.videoElement);
        this.element.appendChild(this.canvasElement);

        this.setRole("camera");
    }

    public async startCamera() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
            this.videoElement.srcObject = this.stream;
            this.videoElement.play();
        } catch (error) {
            console.error("Error accessing camera:", error);
        }
    }

    public stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        this.videoElement.pause();
        this.videoElement.srcObject = null;
    }

    public takePhoto(): HTMLCanvasElement | null {
        if (this.stream) {
            const context = this.canvasElement.getContext("2d");
            if (context) {
                this.canvasElement.width = this.videoElement.videoWidth;
                this.canvasElement.height = this.videoElement.videoHeight;
                context.drawImage(this.videoElement, 0, 0, this.canvasElement.width, this.canvasElement.height);
                return this.canvasElement;
            }
        }
        return null;
    }

    public savePhoto(): string | null {
        const photoCanvas = this.takePhoto();
        if (photoCanvas) {
            return photoCanvas.toDataURL("image/png");
        }
        return null;
    }

    public savePhotoToBlob(): Promise<Blob | null> {
        return new Promise((resolve) => {
            const photoCanvas = this.takePhoto();
            if (photoCanvas) {
                photoCanvas.toBlob((blob) => {
                    resolve(blob);
                });
            } else {
                resolve(null);
            }
        });
    }
    
    public getElement(): HTMLElement {
        return this.element;
    }
}
