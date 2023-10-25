import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { BehaviorSubject, filter, Observable, Subject, takeUntil } from 'rxjs';
import {
    CopyCutFileAction,
    DirectoryContent,
    FileStats,
    FileSystemAction,
    FileSystemEvent,
} from '../../../models';
import {MatDialog} from "@angular/material/dialog";
import {DownloadFileDialogComponent} from "./dialogs";
import {MatMenuTrigger} from "@angular/material/menu";
import { DndDropEvent } from 'ngx-drag-drop';

@Component({
    selector: 'files-icon-view',
    templateUrl: './files-icon-view.component.html',
    styleUrls: ['./files-icon-view.component.scss'],
    encapsulation: ViewEncapsulation.None,
    host: { class: 'visa-fs-files-icon-view-component'},
})
export class FilesIconViewComponent implements OnInit, OnDestroy {

    @ViewChild(MatMenuTrigger)
    private _contextMenu: MatMenuTrigger;

    public contextMenuPosition = { x: '0px', y: '0px' };

    @Input()
    path: string;

    @Output()
    pathChange = new EventEmitter<string>;

    @Input()
    directoryContent: DirectoryContent;

    @Input()
    directoryContentLoading: boolean;

    @Output()
    fileSystemAction = new EventEmitter<FileSystemAction>();

    @Input()
    fileSystemEvent$: Observable<FileSystemEvent>;

    get selectedFile(): FileStats {
        return this._selectedFile;
    }

    @Input()
    set selectedFile(fileStats: FileStats) {
        if (this._selectedFile != fileStats) {
            this._selectedFile = fileStats;
            this.selectedFileChange.emit(fileStats);
        }
    }

    @Output()
    selectedFileChange = new EventEmitter<FileStats>();

    get copyCutFileAction(): CopyCutFileAction {
        return this._copyCutFileAction;
    }

    @Input()
    set copyCutFileAction(value: CopyCutFileAction) {
        this._copyCutFileAction = value
        this.copyCutFileActionChange.emit(value);
    }

    @Output()
    copyCutFileActionChange = new EventEmitter<CopyCutFileAction>();


    get renameInProgress(): FileStats {
        return this._renameInProgress;
    }

    @Input()
    set renameInProgress(fileStats: FileStats) {
        if (this._renameInProgress != fileStats) {
            this._renameInProgress = fileStats;
            this.renameInProgressChange.emit(fileStats);
        }
    }

    @Output()
    renameInProgressChange = new EventEmitter<FileStats>();

    private _selectedFile: FileStats;
    private _renameInProgress: FileStats;
    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _acceptDrop = false;
    private _copyCutFileAction: CopyCutFileAction;

    get items(): FileStats[] {
        return this.directoryContent.content;
    }

    get acceptDrop(): boolean {
        return this._acceptDrop;
    }

    constructor(private _dialog: MatDialog) {
    }

    ngOnInit() {
        this.fileSystemEvent$.pipe(
            takeUntil(this._destroy$),
            filter(data => data != null)
        ).subscribe(event => {
            if (event.type === 'CREATED') {
                this.selectedFile = event.fileStats;
                this._renameInProgress = event.fileStats;

            } else if (event.type === 'MOVED') {
                this.selectedFile = event.fileStats;

            } else if (event.type === 'COPIED') {
                this.selectedFile = event.fileStats;
            }
        })
    }

    ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    openDownloadFileDialog(fileStats: FileStats) {
        const dialogRef = this._dialog.open(DownloadFileDialogComponent, {data: {fileStats}});
        dialogRef.afterClosed().subscribe(res => {
            if (res) {
                this.fileSystemAction.emit(new FileSystemAction({fileStats, type: 'DOWNLOAD'}));
            }
        });
    }

    openMenu(event: MouseEvent, viewChild: MatMenuTrigger): void {
        event.preventDefault();
        event.stopPropagation();
        viewChild.openMenu();

        this.contextMenuPosition.x = event.clientX + 'px';
        this.contextMenuPosition.y = event.clientY + 'px';
        this._contextMenu.menu.focusFirstItem('mouse');
        this._contextMenu.openMenu();
    }

    onFileSystemAction(action: FileSystemAction) {
        this.fileSystemAction.emit(action);
    }

    onNewFile(): void {
        this.fileSystemAction.emit(new FileSystemAction({path: this.path, type: 'NEW_FILE'}));
    }

    onNewFolder(): void {
        this.fileSystemAction.emit(new FileSystemAction({path: this.path, type: 'NEW_FOLDER'}));
    }

    onFileDoubleClick(fileStats: FileStats): void {
        if (fileStats.type === 'directory') {
            this.pathChange.emit(fileStats.path);

        } else {
            this.openDownloadFileDialog(fileStats)
        }
    }

    onClick(): void {
        this.selectedFile = null;
        this._renameInProgress = null;
    }

    onDrop(event: DndDropEvent): void {
        if (event.isExternal && this._acceptDrop) {
            this.fileSystemAction.emit(new FileSystemAction({path: this.path, files: event.event.dataTransfer.files, type: 'UPLOAD'}));
            this._acceptDrop = false;
        }
    }

    onDragOver(event: DragEvent): void {
        if (event.dataTransfer.types.length === 1 && event.dataTransfer.types[0] === 'Files') {
            this._acceptDrop = true;
        } else {
            this._acceptDrop = false;
        }
    }

    onDragLeave(event: DragEvent): void {
        this._acceptDrop = false;
    }

    pasteFile(): void {
        if (this.copyCutFileAction != null) {
            this.copyCutFileActionChange.emit(new CopyCutFileAction({fileStats: this.directoryContent.stats, type: 'PASTE'}));
        }
    }
}
