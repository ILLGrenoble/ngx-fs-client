import { FileStats } from './file-stats.model';

export interface UploadProgress {
    progress: number;
    fileStats?: FileStats;
}
