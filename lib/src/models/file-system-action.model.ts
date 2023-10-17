import { FileStats } from './file-stats.model';

export class FileSystemAction {
    fileStats?: FileStats;
    path?: string;
    type: 'NEW_FILE' | 'NEW_FOLDER' | 'DELETE' | 'MOVE' | 'DOWNLOAD';

    constructor(data?: Partial<FileSystemAction>) {
        Object.assign(this, data);
    }
}
