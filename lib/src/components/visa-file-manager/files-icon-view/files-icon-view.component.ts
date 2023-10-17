import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { BehaviorSubject, filter, Observable, Subject, takeUntil } from 'rxjs';
import {
    DirectoryContent,
    FileStats,
    FileSystemAction,
    FileSystemEvent,
    UploadEvent
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

    @Input()
    fileSystemAction$: Subject<FileSystemAction>;

    @Input()
    fileSystemEvent$: Observable<FileSystemEvent>;

    @Input()
    uploadEvent$: BehaviorSubject<UploadEvent>;

    @Output()
    selectedFile$: BehaviorSubject<FileStats> = new BehaviorSubject<FileStats>(null);

    @Output()
    doubleClickedFile$: BehaviorSubject<FileStats> = new BehaviorSubject<FileStats>(null);

    @Output()
    renameInProgress$: BehaviorSubject<FileStats> = new BehaviorSubject<FileStats>(null);

    @Output()
    dndTargetFolder$: BehaviorSubject<FileStats> = new BehaviorSubject<FileStats>(null);

    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _acceptDrop = false;

    get items(): FileStats[] {
        return this.directoryContent.content;
    }

    get acceptDrop(): boolean {
        return this._acceptDrop;
    }

    constructor(private _dialog: MatDialog) {
    }

    ngOnInit() {
        this.doubleClickedFile$.pipe(
            takeUntil(this._destroy$),
            filter(fileStats => fileStats != null)
        ).subscribe(fileStats => {
            if (fileStats.type === 'directory') {
                this.pathChange.emit(fileStats.path);

            } else {
                this.openDownloadFileDialog(fileStats)
            }
        });

        this.fileSystemEvent$.pipe(
            takeUntil(this._destroy$),
            filter(data => data != null)
        ).subscribe(event => {
            if (event.type === 'CREATED') {
                this.selectedFile$.next(event.fileStats);
                this.renameInProgress$.next(event.fileStats);

            } else if (event.type === 'MOVED') {
                this.selectedFile$.next(event.fileStats);
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
                this.fileSystemAction$.next(new FileSystemAction({fileStats, type: 'DOWNLOAD'}));
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

    onNewFile(): void {
        this.fileSystemAction$.next(new FileSystemAction({path: this.path, type: 'NEW_FILE'}));
    }

    onNewFolder(): void {
        this.fileSystemAction$.next(new FileSystemAction({path: this.path, type: 'NEW_FOLDER'}));
    }

    onDrop(event: DndDropEvent): void {
        if (event.isExternal && this._acceptDrop) {
            const uploadEvent = new UploadEvent({path: this.path, files: event.event.dataTransfer.files});
            this.uploadEvent$.next(uploadEvent);
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

}
