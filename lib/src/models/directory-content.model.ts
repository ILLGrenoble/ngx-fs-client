import { FileStats } from "./file-stats.model";

export interface DirectoryContent {
    content: FileStats[];
    stats: FileStats;
}