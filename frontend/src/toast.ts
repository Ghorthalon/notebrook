export class Toast {
    private container: HTMLElement;
    private timeout: number;

    constructor(timeout: number = 3000) {
        this.container = document.querySelector('.toast-container') as HTMLElement;
        this.timeout = timeout;
    }

    public show(message: string): void {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;

        this.container.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        setTimeout(() => {
            this.hide(toast);
        }, this.timeout);
    }

    private hide(toast: HTMLElement): void {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => {
            toast.remove();
        });
    }
}
