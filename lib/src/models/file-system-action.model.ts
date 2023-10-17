import { FileStats } from './file-stats.model';

export class FileSystemAction {
    fileStats?: FileStats;
    path?: string;
    files?: FileList;
    type: 'NEW_FILE' | 'NEW_FOLDER' | 'DELETE' | 'MOVE' | 'DOWNLOAD' | 'UPLOAD';

    constructor(data?: Partial<FileSystemAction>) {
        Object.assign(this, data);
    }
}
