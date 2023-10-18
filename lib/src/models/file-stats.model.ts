export interface FileStats {
    created?: Date;
    last_modified?: Date;
    path: string;
    name: string;
    size?: number;
    type: 'file' | 'directory';
    writeable?: boolean;
}
