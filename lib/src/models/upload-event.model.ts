
export class UploadEvent {
    files: FileList;
    path: string;

    constructor(data?: Partial<UploadEvent>) {
        Object.assign(this, data);
    }
}
