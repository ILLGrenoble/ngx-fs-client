import { Component, EventEmitter, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import {BehaviorSubject, concatMap, filter, finalize, from, of, Subject, switchMap, takeUntil, tap} from 'rxjs';
import { VisaFileSystemService } from '../../services';
import {
    DirectoryContent,
    FileContent,
    FileStats,
    FileSystemAction,
    FileSystemEvent,
    LinkedPath,
    UploadEvent
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
    path$: BehaviorSubject<string> = new BehaviorSubject<string>('');

    @Output()
    linkedPath$: BehaviorSubject<LinkedPath> = new BehaviorSubject<LinkedPath>(new LinkedPath({name: ''}));

    @Output()
    directoryContent$: BehaviorSubject<DirectoryContent> = new BehaviorSubject<DirectoryContent>(null);

    @Output()
    fileSystemAction$: BehaviorSubject<FileSystemAction> = new BehaviorSubject<FileSystemAction>(null);

    @Output()
    fileSystemEvent$: EventEmitter<FileSystemEvent> = new EventEmitter<FileSystemEvent>();

    @Output()
    directoryContentLoading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    @Output()
    uploadEvent$: BehaviorSubject<UploadEvent> = new BehaviorSubject<UploadEvent>(null);

    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _uploadDialog: MatDialogRef<FileUploadDialogComponent> = null;

    constructor(private _fileSystemService: VisaFileSystemService,
                private _dialog: MatDialog) {
    }

    ngOnInit(): void {
        this.path$.pipe(
            takeUntil(this._destroy$),
            filter(path => path != null),
            filter(path => {
                const currentPath = this.linkedPath$.getValue();
                return path != currentPath.name;
            })
        ).subscribe(path => {
            const currentPath = this.linkedPath$.getValue();
            const linkedPath = new LinkedPath({name: path, previous: currentPath});
            currentPath.next = linkedPath;
            this.linkedPath$.next(linkedPath);
        });

        this.linkedPath$.pipe(
            takeUntil(this._destroy$),
            switchMap(path => {
                this.directoryContentLoading$.next(true);
                this.path$.next(path.name);
                return this._fileSystemService.getDirectoryContent(path.name).pipe(
                    takeUntil(this._destroy$),
                    finalize(() => this.directoryContentLoading$.next(false))
                )
            })).subscribe({
                next: (content) => {
                    this.directoryContent$.next(content);
                },
                error: (error) => {
                    console.error(error);
                }
            });

        this.fileSystemAction$.pipe(
            takeUntil(this._destroy$),
            filter(fileSystemAction => fileSystemAction != null)
        ).subscribe(action => {
            if (action.type === 'DOWNLOAD') {
                this._downloadFile(action.fileStats)

            } else if (action.type === 'DELETE') {
                this._openDeleteFileDialog(action.fileStats)

            } else if (action.type === 'NEW_FILE') {
                this._createNewFile(action.path)

            } else if (action.type === 'NEW_FOLDER') {
                this._createNewFolder(action.path)

            } else if (action.type === 'MOVE') {
                this._moveFile(action.fileStats, action.path)
            }
        })

        this.uploadEvent$.pipe(
            takeUntil(this._destroy$),
            filter(uploadEvent => uploadEvent != null)
        ).subscribe(uploadEvent => {
            this._handleUpload(uploadEvent);
        })
    }

    ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
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
                        this.linkedPath$.next(this.linkedPath$.getValue());
                    }
                })
            }
        });
    }

    private _createNewFile(path: string): void {
        this._fileSystemService.newFile(path).subscribe(fileStats => {
            this.fileSystemEvent$.emit(new FileSystemEvent({fileStats, type: 'CREATED'}));
        })
    }

    private _createNewFolder(path: string): void {
        this._fileSystemService.newFolder(path).subscribe(fileStats => {
            this.fileSystemEvent$.emit(new FileSystemEvent({fileStats, type: 'CREATED'}));
        })
    }

    private _moveFile(fileStats: FileStats, newPath: string): void {
        this._fileSystemService.moveFile(fileStats, newPath).subscribe({
            next: (newFileStats) => {
                this.linkedPath$.next(this.linkedPath$.getValue());

                this.fileSystemEvent$.emit(new FileSystemEvent({fileStats: newFileStats, type: 'MOVED'}));
            },
            error: (error) => {
                console.log(`Cannot move file: ${error.error}`);
            }
        })
    }

    private _handleUpload(uploadEvent: UploadEvent): void {
        if (this._uploadDialog == null) {
            this._uploadDialog = this._dialog.open(FileUploadDialogComponent, {
                width: '800px',
                data: {uploadEvent$: this.uploadEvent$, fileSystemService: this._fileSystemService}
            });
            this._uploadDialog.afterClosed().subscribe(() => {
                this._uploadDialog = null;
                if (uploadEvent.path === this.path$.getValue()) {
                    this.linkedPath$.next(this.linkedPath$.getValue());
                }
            });
        }
    }

    private async _blobFromBase64(fileContent: FileContent): Promise<Blob> {
        const fileUrl = `data:${fileContent.mimetype};base64,${fileContent.content}`;
        const response = await fetch(fileUrl);
        const blob = await response.blob();

        return blob;
    }
}
