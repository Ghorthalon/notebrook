export class ChunkProcessor<T> {
    private chunkSize: number;

    constructor(chunkSize: number = 1000) {
        this.chunkSize = chunkSize;
    }

    async processArray(array: T[], callback: (chunk: T[]) => void): Promise<void> {
        const totalChunks = Math.ceil(array.length / this.chunkSize);

        for (let i = 0; i < totalChunks; i++) {
            const chunk = array.slice(i * this.chunkSize, (i + 1) * this.chunkSize);
            await this.processChunk(chunk, callback);
        }
    }

    private async processChunk(chunk: T[], callback: (chunk: T[]) => void): Promise<void> {
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                callback(chunk);
                resolve();
            }, 0);
        });
    }
}
