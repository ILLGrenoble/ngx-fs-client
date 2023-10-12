export class FileUploadChunk {
    fileUpload: FileUpload;
    chunkIndex?: number;
    chunkCount: number;
    start?: number;
    end?: number;
    fileName: string;
    uploadPath: string;
    blob: Blob;

    private _progress: number = 0;

    get progress(): number {
        return this._progress;
    }

    set progress(progress: number) {
        this._progress = progress;
        this.fileUpload.onChunkProgress(this.chunkIndex, this.chunkCount, progress);
    }

    constructor(data?: Partial<FileUploadChunk>) {
        Object.assign(this, data);
    }

}

export class FileUpload {
    static MAX_UPLOAD_SIZE = 1024 * 1024;

    file: File;
    uploadPath: string;
    progress: number = 0;
    error?: string;

    constructor(data?: Partial<FileUpload>) {
        Object.assign(this, data);
    }

    createChunks(): FileUploadChunk[] {
        const chunks = [];
        if (this.file.size > FileUpload.MAX_UPLOAD_SIZE) {
            const chunkCount = Math.ceil(this.file.size / FileUpload.MAX_UPLOAD_SIZE);
            let start = 0;
            let end = Math.min(this.file.size, FileUpload.MAX_UPLOAD_SIZE);
            let index = 1;
            while (start < this.file.size) {
                chunks.push(new FileUploadChunk({fileUpload: this, chunkIndex: index, chunkCount, start, end, fileName: this.file.name, uploadPath: this.uploadPath, blob: this.file.slice(start, end)}));
                index++;
                start = end;
                end = Math.min(this.file.size, end + FileUpload.MAX_UPLOAD_SIZE);
            }

        } else {
            chunks.push(new FileUploadChunk({fileUpload: this, chunkCount: 1, fileName: this.file.name, uploadPath: this.uploadPath, blob: this.file}));
        }

        return chunks;
    }

    onChunkProgress(chunkIndex: number, chunkCount: number, chunkProgress: number) {
        if (chunkIndex != null) {
            if (chunkIndex === chunkCount && chunkProgress === 100) {
                this.progress = 100;
            } else {
                const chunkProgressFactor = 1 / chunkCount;
                this.progress = 100.0 * ((chunkIndex - 1) / chunkCount) + chunkProgress * chunkProgressFactor;
            }
        } else {
            this.progress = chunkProgress;
        }
    }
}
