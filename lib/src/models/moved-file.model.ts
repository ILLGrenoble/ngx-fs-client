import { FileStats } from './file-stats.model';

export interface MovedFile {
    file: FileStats;
    newPath: string;
}
