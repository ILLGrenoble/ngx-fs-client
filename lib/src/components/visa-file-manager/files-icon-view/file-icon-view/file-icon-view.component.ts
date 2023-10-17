import {Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import { FileStats, FileSystemAction } from '../../../../models';
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

    @Input()
    selectedFile: FileStats;

    @Output()
    selectedFileChange = new EventEmitter<FileStats>();

    @Input()
    renameInProgress$: BehaviorSubject<FileStats>;

    @Output()
    fileSystemAction = new EventEmitter<FileSystemAction>();

    private _selected: boolean = false;
    private _isSingleClick: Boolean = true;

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

        this.renameInProgress$.pipe(
            takeUntil(this._destroy$)
        ).subscribe(fileStats => {
            this.setFileNameEditActive(fileStats != null && fileStats.path === this.fileStats.path)
        })
    }

    ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    onDoubleClicked(): void {
        this._isSingleClick = false;

        if (!this.renameInProgress$.getValue()) {
            this.selectedFileChange.emit(this.fileStats);
            this.doubleClickedFile.emit(this.fileStats);
        }
    }

    onSelect(): void {
        this._isSingleClick = true;
        if (this.selectedFile != null && this.selectedFile === this.fileStats) {
            setTimeout(() => {
                if (this._isSingleClick) {
                    if (!this.renameInProgress$.getValue()) {
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
        viewChild.openMenu();
    }

    editFileName(): void {
        if (this.renameInProgress$.getValue() !== this.fileStats) {
            this.renameInProgress$.next(this.fileStats);
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

            this.renameInProgress$.next(null);
        } else {
            this.renameInProgress$.next(null);
        }
    }

    cancelFileNameChange(): void {
        this.fileName = this.fileStats.name;
        this.renameInProgress$.next(null);
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
}
