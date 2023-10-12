import { FileContent } from './file-content.model';

export interface DownloadProgress {
    progress: number;
    fileContent?: FileContent;
}
