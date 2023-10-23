import {Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {CopyCutFileAction, FileStats, FileSystemAction} from '../../../../models';
import {BehaviorSubject, Subject, takeUntil} from 'rxjs';
import {MatMenuTrigger} from "@angular/material/menu";
import { DndDropEvent } from 'ngx-drag-drop';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
    selector: 'file-icon-view',
    templateUrl: './file-icon-view.component.html',
    styleUrls: ['./file-icon-view.component.scss'],
})
export class FileIconViewComponent implements OnInit, OnDestroy {

    @ViewChild('fileNameInput')
    fileNameInput: ElementRef;

    @Input()
    fileStats: FileStats;

    @Output()
    doubleClickedFile = new EventEmitter<FileStats>();

    get selectedFile(): FileStats {
        return this._selectedFile;
    }

    @Input()
    set selectedFile(fileStats: FileStats) {
        this._selectedFile = fileStats;
        if (fileStats == null || (this._isFileNameEdit && fileStats.path !== this.fileStats.path)) {
            this._isFileNameEdit = false;
            this.fileName = this.fileStats.name;
        }
    }

    @Output()
    selectedFileChange = new EventEmitter<FileStats>();

    get renameInProgress(): FileStats {
        return this._renameInProgress;
    }

    @Input()
    set renameInProgress(fileStats: FileStats) {
        this._renameInProgress = fileStats;
        this.setFileNameEditActive(fileStats != null && this.fileStats != null && fileStats.path === this.fileStats.path)
    }

    @Output()
    renameInProgressChange = new EventEmitter<FileStats>();

    @Output()
    fileSystemAction = new EventEmitter<FileSystemAction>();

    @Input()
    copyCutFileAction: CopyCutFileAction;

    @Output()
    copyCutFileActionChange = new EventEmitter<CopyCutFileAction>();

    private _isSingleClick: Boolean = true;

    private _selectedFile: FileStats;
    private _renameInProgress: FileStats;
    private _isFileNameEdit: boolean = false;
    private _fileName: string;
    private _destroy$: Subject<boolean> = new Subject<boolean>();

    get fileName(): string {
        return this._fileName;
    }

    set fileName(value: string) {
        this._fileName = value;
    }

    get selected(): boolean {
        return (this.selectedFile != null && this.selectedFile.path === this.fileStats.path)
    }

    get isFileNameEdit(): boolean {
        return this._isFileNameEdit;
    }

    constructor(private _sanitizer: DomSanitizer) {
    }

    ngOnInit() {
        this.fileName = this.fileStats.name;
    }

    ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    onDoubleClicked(): void {
        this._isSingleClick = false;

        if (!this.renameInProgress) {
            this.selectedFileChange.emit(this.fileStats);
            this.doubleClickedFile.emit(this.fileStats);
        }
    }

    onSelect(event: Event): void {
        event.preventDefault();
        event.stopPropagation();

        this._isSingleClick = true;
        if (this.selectedFile != null && this.selectedFile === this.fileStats) {
            setTimeout(() => {
                if (this._isSingleClick) {
                    if (!this._isFileNameEdit) {
                        this.editFileName();
                    }
                }
            }, 250)
        }
        this.selectedFileChange.emit(this.fileStats);
    }

    openMenu(event: Event, viewChild: MatMenuTrigger): void {
        if (this.selectedFile == null || this.selectedFile !== this.fileStats) {
            this.selectedFileChange.emit(this.fileStats);
        }
        event.preventDefault();
        event.stopPropagation();

        if (this.fileStats.name !== '..') {
            viewChild.openMenu();
        }
    }

    editFileName(): void {
        if (this.fileStats.name !== '..') {
            this.renameInProgressChange.emit(this.fileStats);
            this._isFileNameEdit = true;
        }
    }

    setFileNameEditActive(active: boolean) {
        this._isFileNameEdit = active;

        if (active) {
            setTimeout(() => {
                const inputElem = <HTMLInputElement>this.fileNameInput.nativeElement;
                inputElem.select();
            }, 10)
        }
    }

    updateFileName(): void {
        if (this.fileStats.name !== this.fileName) {
            const oldPath = this.fileStats.path;
            const newPath = `${oldPath.substring(0, oldPath.lastIndexOf('/'))}/${this.fileName}`;

            this.fileSystemAction.emit(new FileSystemAction({fileStats: this.fileStats, path: newPath, type: 'MOVE'}));

            this.renameInProgressChange.emit(null);

        } else {
            this.renameInProgressChange.emit(null);
        }
    }

    cancelFileNameChange(): void {
        this.fileName = this.fileStats.name;
        this.renameInProgressChange.emit(null);
    }

    downloadFile(): void {
        this.fileSystemAction.emit(new FileSystemAction({fileStats: this.fileStats, type: 'DOWNLOAD'}));
    }

    deleteFile(): void {
        this.fileSystemAction.emit(new FileSystemAction({fileStats: this.fileStats, type: 'DELETE'}));
    }

    onDragStart(): void {
        if (this.selectedFile == null || this.selectedFile !== this.fileStats) {
            this.selectedFileChange.emit(this.fileStats);
        }
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
    }

    onDrop(event: DndDropEvent): void{
        event.event.preventDefault();
        event.event.stopPropagation();

        if (event.isExternal) {
            this.fileSystemAction.emit(new FileSystemAction({path: this.fileStats.path, files: event.event.dataTransfer.files, type: 'UPLOAD'}));

        } else {
            const fileStats = event.data;
            this.fileSystemAction.emit(new FileSystemAction({fileStats, path: `${this.fileStats.path}/${fileStats.name}`, type: 'MOVE'}));
        }
    }

    cutFile(): void {
        this.copyCutFileActionChange.emit(new CopyCutFileAction({fileStats: this.fileStats, type: 'CUT'}));
    }

    copyFile(): void {
        if (this.fileStats.type === 'file') {
            this.copyCutFileActionChange.emit(new CopyCutFileAction({fileStats: this.fileStats, type: 'COPY'}));
        }
    }

    pasteFile(): void {
        if (this.copyCutFileAction != null && this.fileStats.type === 'directory') {
            this.copyCutFileActionChange.emit(new CopyCutFileAction({fileStats: this.fileStats, type: 'PASTE'}));
        }
    }
}
