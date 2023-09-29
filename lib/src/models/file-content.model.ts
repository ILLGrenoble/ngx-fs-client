import { FileStats } from "./file-stats.model";

export interface FileContent {
    content: string;
    stats: FileStats;
    format: 'base64' | 'utf-8' ;
    mimetype: string;
}