import { FileStats } from './file-stats.model';

export class FileSystemEvent {
    fileStats?: FileStats;
    path?: string;
    type: 'CREATED' | 'MOVED';

    constructor(data?: Partial<FileSystemEvent>) {
        Object.assign(this, data);
    }
}
