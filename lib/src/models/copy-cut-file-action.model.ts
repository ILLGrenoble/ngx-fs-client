import { FileStats } from './file-stats.model';

export class CopyCutFileAction {
    fileStats: FileStats;
    type: 'COPY' | 'CUT' | 'PASTE';

    constructor(data?: Partial<CopyCutFileAction>) {
        Object.assign(this, data);
    }
}
