import {Component, EventEmitter, Inject, OnDestroy, OnInit, Output, ViewEncapsulation} from '@angular/core';
import {BehaviorSubject, concatMap, filter, finalize, from, of, Subject, switchMap, takeUntil, tap} from 'rxjs';
import { VisaFileSystemService } from '../../services';
import {
    CopyCutFileAction,
    DirectoryContent,
    FileContent,
    FileStats,
    FileSystemAction,
    FileSystemEvent,
    LinkedPath, VisaFileSysConfiguration
} from '../../models';
import {MatDialog, MatDialogRef} from "@angular/material/dialog";
import {DeleteFileDialogComponent, FileDownloadingDialogComponent, FileUploadDialogComponent} from "./dialogs";

@Component({
    selector: 'visa-file-manager',
    templateUrl: './visa-file-manager.component.html',
    styleUrls: ['./visa-file-manager.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class VisaFileManagerComponent implements OnInit, OnDestroy {

    @Output()
    directoryContent: DirectoryContent = null;

    @Output()
    fileSystemEvent$: EventEmitter<FileSystemEvent> = new EventEmitter<FileSystemEvent>();

    @Output()
    directoryContentLoading = false;

    selectedFile: FileStats = null;
    renameInProgress: FileStats = null;

    private _linkedPath: LinkedPath = new LinkedPath({name: ''});
    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _uploadDialog: MatDialogRef<FileUploadDialogComponent> = null;
    private _showHidden = false;
    private _copyCutFileAction: CopyCutFileAction;

    get path(): string {
        let path = this._linkedPath.name;

        if (!path.startsWith('/')) {
            path = `/${path}`;
        }

        return path;
    }

    set path(path: string) {
        const currentPath = this.linkedPath;
        if (path != null && path != currentPath.name) {
            const linkedPath = new LinkedPath({name: path, previous: currentPath});
            currentPath.next = linkedPath;
            this.linkedPath = linkedPath;
        }
    }

    get linkedPath(): LinkedPath {
        return this._linkedPath;
    }

    set linkedPath(linkedPath: LinkedPath) {
        this._linkedPath = linkedPath;
        this._reloadDirectory();
    }

    get copyCutFileAction(): CopyCutFileAction {
        return this._copyCutFileAction;
    }

    set copyCutFileAction(action: CopyCutFileAction) {
        if (action === this._copyCutFileAction) {
            return;
        }
        if (action == null) {
            this._copyCutFileAction = null;

        } else if (action.type == 'PASTE') {
            if (this._copyCutFileAction.type === 'CUT') {
                const targetPath = `${action.fileStats.path}/${this._copyCutFileAction.fileStats.name}`
                this._moveFile(this._copyCutFileAction.fileStats.path, targetPath);

            } else {
                const fileToCopy = this._copyCutFileAction.fileStats;
                this._copyFile(fileToCopy.path, fileToCopy.name, action.fileStats.path);
            }

            this._copyCutFileAction = null;

        } else {
            this._copyCutFileAction = action;
        }
    }

    constructor(@Inject('config') private _config: VisaFileSysConfiguration,
                private _fileSystemService: VisaFileSystemService,
                private _dialog: MatDialog) {
    }

    ngOnInit(): void {
        this._reloadDirectory();
    }

    ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    onFileSystemAction(action: FileSystemAction) {
        if (action == null) {
            return;
        }

        if (action.type === 'DOWNLOAD') {
            this._downloadFile(action.fileStats)

        } else if (action.type === 'DELETE') {
            this._openDeleteFileDialog(action.fileStats)

        } else if (action.type === 'NEW_FILE') {
            this._createNewFile(action.path)

        } else if (action.type === 'NEW_FOLDER') {
            this._createNewFolder(action.path)

        } else if (action.type === 'MOVE') {
            this._moveFile(action.fileStats.path, action.path)

        } else if (action.type === 'UPLOAD') {
            this._handleUpload(action.files, action.path);
        }
    }

    private _reloadDirectory(): void {
        const path = this._linkedPath.name;

        this.directoryContentLoading = true;

        this._fileSystemService.getDirectoryContent(path).pipe(
            takeUntil(this._destroy$),
            finalize(() => {
                this.directoryContentLoading = false;
            })
        ).subscribe({
            next: (content) => {
                if (this._config.showParentFolder) {
                    const parentFileStats = this._createParentFileStats();
                }

                content.content = this._sortDirectoryContent(content.content);
                this.directoryContent = content;
            },
            error: (error) => {
                console.error(error);
                if (this._linkedPath.previous) {
                    this._linkedPath.previous.next = null;
                    this.linkedPath = this._linkedPath.previous;
                }
            }
        });
    }

    private _createParentFileStats(): FileStats {
        const pathElements = this._linkedPath.name.split('/');
        let basename = pathElements.pop();
        if (basename === ''){
            return null;
        }

        return {
            path: pathElements.join('/'),
            name: '..',
            type: 'directory',
        }
    }

    private _downloadFile(fileStats: FileStats): void {

        const downloadProgress$ = new BehaviorSubject<{progress: number, error?: string}>({progress: 0})
        const dialogRef = this._dialog.open(FileDownloadingDialogComponent, {data: {fileStats, downloadProgress$}});

        this._fileSystemService.downloadFileWithProgress(fileStats.path).pipe(
            tap(data => {
                downloadProgress$.next({progress: data.progress})
            }),
            filter(data => data.fileContent != null),
            concatMap(data => {
                const fileContent = data.fileContent;
                if (fileContent.format === 'base64') {
                    return from(this._blobFromBase64(fileContent)).pipe(
                        switchMap((blob) => of({name: fileContent.stats.name, blob}))
                    );

                } else {
                    const blob = new Blob([fileContent.content], {type: fileContent.mimetype});
                    return of({name: fileContent.stats.name, blob});
                }
            })).subscribe({
                next: ({name, blob}) => {
                    const link = window.document.createElement("a");
                    link.href = window.URL.createObjectURL(blob);
                    link.download = name;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(link.href);
                    downloadProgress$.next({progress: 100});
                },
                error: (error) => {
                    downloadProgress$.next({progress: 100, error: error.error});
                }
            });

    }

    private _openDeleteFileDialog(fileStats: FileStats) {
        const dialogRef = this._dialog.open(DeleteFileDialogComponent, {data: {fileStats}});
        dialogRef.afterClosed().subscribe(res => {
            if (res) {
                this._fileSystemService.deleteFileOrFolder(fileStats).subscribe(success => {
                    if (success) {
                        this._reloadDirectory();
                    }
                })
            }
        });
    }

    private _createNewFile(path: string): void {
        this._fileSystemService.newFile(path).subscribe(fileStats => {
            this._reloadDirectory();
            this.fileSystemEvent$.emit(new FileSystemEvent({fileStats, type: 'CREATED'}));
        })
    }

    private _createNewFolder(path: string): void {
        this._fileSystemService.newFolder(path).subscribe(fileStats => {
            this._reloadDirectory();
            this.fileSystemEvent$.emit(new FileSystemEvent({fileStats, type: 'CREATED'}));
        })
    }

    private _moveFile(sourcePath: string, targetPath: string): void {
        this._fileSystemService.moveFile(sourcePath, targetPath).subscribe({
            next: (newFileStats) => {
                this._reloadDirectory();

                this.fileSystemEvent$.emit(new FileSystemEvent({fileStats: newFileStats, type: 'MOVED'}));
            },
            error: (error) => {
                console.log(`Cannot move file: ${error.error}`);
            }
        })
    }

    private _copyFile(sourcePath: string, sourceFileName: string, targetFolder: string): void {
        this._fileSystemService.copyFile(sourcePath, `${targetFolder}/${sourceFileName}`).subscribe({
            next: (newFileStats) => {
                if (this.directoryContent.stats.path === targetFolder) {
                    this._reloadDirectory();
                    this.fileSystemEvent$.emit(new FileSystemEvent({fileStats: newFileStats, type: 'COPIED'}));
                }

            },
            error: (error) => {
                console.log(`Cannot copy file: ${error.error}`);
            }
        })
    }

    private _handleUpload(files: FileList, path: string): void {
        if (this._uploadDialog == null) {
            this._uploadDialog = this._dialog.open(FileUploadDialogComponent, {
                width: '800px',
                data: {files, path, fileSystemService: this._fileSystemService}
            });
            this._uploadDialog.afterClosed().subscribe(() => {
                this._uploadDialog = null;
                if (path === this.path) {
                    this._reloadDirectory();
                }
            });
        }
    }

    private _sortDirectoryContent(items: FileStats[]): FileStats[] {
        return items.filter((entry: FileStats) => {
                if (this._config.showParentFolder && entry.name === '..') {
                    return true;
                } else if (!this._config.showParentFolder && entry.name === '..') {
                    return false;
                } else {
                    return !entry.name.startsWith('.') || this._showHidden
                }
            })
            .sort((a: FileStats, b: FileStats) => a.name.localeCompare(b.name))
            .sort((a: FileStats, b: FileStats) => {
                return a.type === 'directory' && b.type === 'file' ? -1 :
                    a.type === 'file' && b.type === 'directory' ? 1 : 0;
            })
    }

    private async _blobFromBase64(fileContent: FileContent): Promise<Blob> {
        const fileUrl = `data:${fileContent.mimetype};base64,${fileContent.content}`;
        const response = await fetch(fileUrl);
        const blob = await response.blob();

        return blob;
    }
}
