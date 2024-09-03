import { API } from "../api";
import { state } from "../state";
import { Button } from "../ui";
import { Camera } from "../ui/camera";
import { Dialog } from "../ui/dialog";

export class TakePhotoDialog extends Dialog<Blob> {
    private camera: Camera;
    private takePhotoButton: Button;
    private discardButton: Button;

    constructor() {
        super("Take photo", false);
        this.camera = new Camera("Photo camera");
        this.camera.setPosition(10, 15, 80, 75);
        this.camera.startCamera();
        this.takePhotoButton = new Button("Take photo");
        this.takePhotoButton.setPosition(10, 90, 80, 10);
        this.discardButton = new Button("Cancel");
        this.discardButton.setPosition(5, 5, 10, 10);
        this.discardButton.onClick(() => this.cancel());
        this.add(this.camera);
        this.add(this.takePhotoButton);
        this.add(this.discardButton);
        this.takePhotoButton.onClick(async () => {
            const photo = await this.camera.savePhotoToBlob();
            if (photo) this.choose(photo);
        });
    }
}