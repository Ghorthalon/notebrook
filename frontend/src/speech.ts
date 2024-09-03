import { Toast } from "./toast";

export function speak(text: string, interrupt: boolean = false) {
    const utterance = new SpeechSynthesisUtterance(text);
    if (interrupt) {
        speechSynthesis.cancel();
    }
    speechSynthesis.speak(utterance);
}

export function showToast(message: string, timeout: number = 5000) {
    const toast = new Toast(timeout);
    toast.show(message);
}