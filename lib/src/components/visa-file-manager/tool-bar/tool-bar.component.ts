import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { CopyCutFileAction, FileStats, FileSystemAction, LinkedPath } from '../../../models';

export interface PathMenuItem {
    name: string;
    path: string;
}

@Component({
    selector: 'tool-bar',
    templateUrl: './tool-bar.component.html',
    styleUrls: ['./tool-bar.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class ToolBarComponent {

    private _linkedPath: LinkedPath;
    private _basename = '';
    private _pathMenuItems: PathMenuItem[] = [];

    @Input()
    path: string;

    @Output()
    pathChange = new EventEmitter<string>;

    get linkedPath(): LinkedPath {
        return this._linkedPath;
    }

    @Input()
    set linkedPath(linkedPath: LinkedPath) {
        this._linkedPath = linkedPath;
        const path = linkedPath.name;

        let elementName: string;
        this._pathMenuItems = [];

        let pathElements = path.split('/');
        let basename = pathElements.pop();
        if (basename === ''){
            basename = 'Home';

        } else {
            do {
                const elementPath = pathElements.join('/');
                pathElements = elementPath.split('/');
                elementName = pathElements.pop();
                this._pathMenuItems.push({name: elementName == '' ? 'Home' : elementName, path: elementPath === '' ? '/' : elementPath});
            } while (elementName !== '');

        }
        this._basename = basename;
    }

    @Output()
    linkedPathChange = new EventEmitter<LinkedPath>();

    @Input()
    fileStats: FileStats;

    @Input()
    copyCutFileAction: CopyCutFileAction;

    @Output()
    copyCutFileActionChange = new EventEmitter<CopyCutFileAction>();

    @Input()
    selectedFile: FileStats;

    @Input()
    renameInProgress: FileStats;

    @Output()
    renameInProgressChange = new EventEmitter<FileStats>();

    @Output()
    fileSystemAction = new EventEmitter<FileSystemAction>();

    get basename(): string {
        return this._basename;
    }

    get pathMenuItems(): PathMenuItem[] {
        return this._pathMenuItems;
    }

    onBackClick(): void {
        if (this._linkedPath.previous) {
            this.linkedPathChange.emit(this.linkedPath.previous);
        }
    }

    onForwardClick(): void {
        if (this._linkedPath.next) {
            this.linkedPathChange.emit(this.linkedPath.next);
        }
    }

    onNewFile(): void {
        this.fileSystemAction.emit(new FileSystemAction({path: this.fileStats.path, type: 'NEW_FILE'}));
    }

    onNewFolder(): void {
        this.fileSystemAction.emit(new FileSystemAction({path: this.fileStats.path, type: 'NEW_FOLDER'}));
    }

    downloadFile(): void {
        this.fileSystemAction.emit(new FileSystemAction({fileStats: this.selectedFile, type: 'DOWNLOAD'}));
    }

    renameFile(): void {
        this.renameInProgressChange.emit(this.selectedFile);
    }

    deleteFile(): void {
        this.fileSystemAction.emit(new FileSystemAction({fileStats: this.selectedFile, type: 'DELETE'}));
    }

    cutFile(): void {
        this.copyCutFileActionChange.emit(new CopyCutFileAction({fileStats: this.selectedFile, type: 'CUT'}));
    }

    copyFile(): void {
        if (this.selectedFile.type === 'file') {
            this.copyCutFileActionChange.emit(new CopyCutFileAction({fileStats: this.selectedFile, type: 'COPY'}));
        }
    }

    pasteFile(): void {
        if (this.copyCutFileAction != null) {
            this.copyCutFileActionChange.emit(new CopyCutFileAction({fileStats: this.fileStats, type: 'PASTE'}));
        }
    }

    onPathMenuItemClick(pathMenuItem: PathMenuItem) {
        this.pathChange.emit(pathMenuItem.path);
    }

}
