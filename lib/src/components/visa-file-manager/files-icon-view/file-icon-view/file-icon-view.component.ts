import { Component, ElementRef, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import {FileStats, MovedFile, UploadEvent} from '../../../../models';
import {BehaviorSubject, Subject, takeUntil} from 'rxjs';
import {MatMenuTrigger} from "@angular/material/menu";
import {VisaFileSystemService} from "../../../../services";
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

    @Input()
    downloadFile$: Subject<FileStats>;

    @Input()
    deleteFile$: Subject<FileStats>;

    @Input()
    doubleClickedFile$: Subject<FileStats>;

    @Input()
    selectedFile$: BehaviorSubject<FileStats>;

    @Input()
    renameInProgress$: BehaviorSubject<FileStats>;

    @Input()
    movedFile$: BehaviorSubject<MovedFile>;

    @Input()
    uploadEvent$: BehaviorSubject<UploadEvent>;

    private _selected: boolean = false;
    private _isSingleClick: Boolean = true;

    private _isFileNameEdit: boolean = false;
    private _displayFileName: string;
    private _fileName: string;
    private _destroy$: Subject<boolean> = new Subject<boolean>();

    get displayFileName(): string {
        return this._displayFileName;
    }

    get fileName(): string {
        return this._fileName;
    }

    set fileName(value: string) {
        this._fileName = value;
        const maxLength = 32;
        if (this.fileStats.name.length > maxLength) {
            const len = this.fileStats.name.length;
            const end = this.fileStats.name.substring(len - 8);
            const start = this.fileStats.name.substring(0, maxLength - 11);
            this._displayFileName = `${start}...${end}`;

        } else {
            this._displayFileName = this.fileStats.name;
        }

    }

    get selected(): boolean {
        return this._selected;
    }

    get isFileNameEdit(): boolean {
        return this._isFileNameEdit;
    }

    constructor(private _fileSystemService: VisaFileSystemService,
                private _sanitizer: DomSanitizer) {
    }

    ngOnInit() {
        this.selectedFile$.pipe(
            takeUntil(this._destroy$)
        ).subscribe(fileStats => {
            this._selected = (fileStats !== null && fileStats.path === this.fileStats.path);
        });

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
            this.selectedFile$.next(this.fileStats);
            this.doubleClickedFile$.next(this.fileStats);
        }
    }

    onSelect(): void {
        this._isSingleClick = true;
        setTimeout(() => {
            if(this._isSingleClick){
                if (!this.renameInProgress$.getValue()) {
                    if (this.selectedFile$.getValue() != null && this.selectedFile$.getValue() === this.fileStats) {
                        this.editFileName();

                    } else {
                        this.selectedFile$.next(this.fileStats);
                    }
                }
            }
        }, 250)
    }

    openMenu(event: Event, viewChild: MatMenuTrigger): void {
        if (this.selectedFile$.getValue() == null || this.selectedFile$.getValue() !== this.fileStats) {
            this.selectedFile$.next(this.fileStats);
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
            this._fileSystemService.moveFile(this.fileStats, newPath).subscribe({
                next: (newFileStats) => {
                    this.fileStats.name = newFileStats.name;
                    this.fileStats.path = newFileStats.path;
                    this.fileStats.last_modified = newFileStats.last_modified;
                    this.fileName = newFileStats.name;
                    this.renameInProgress$.next(null);
                },
                error: (error) => {
                    console.log(`Cannot update filename: ${error.error}`);
                    this.renameInProgress$.next(null);
                }
            })
        } else {
            this.renameInProgress$.next(null);
        }
    }

    cancelFileNameChange(): void {
        this.fileName = this.fileStats.name;
        this.renameInProgress$.next(null);
    }

    downloadFile(): void {
        this.downloadFile$.next(this.fileStats);
    }

    deleteFile(): void {
        this.deleteFile$.next(this.fileStats);
    }

    onDragStart(): void {
        if (this.selectedFile$.getValue() == null || this.selectedFile$.getValue() !== this.fileStats) {
            this.selectedFile$.next(this.fileStats);
        }
    }

    async onDrop(event: DndDropEvent): Promise<void> {
        if (event.isExternal) {
            const uploadEvent = new UploadEvent({path: this.fileStats.path, files: event.event.dataTransfer.files});
            this.uploadEvent$.next(uploadEvent);

        } else {
            const fileStats = event.data;
            this.movedFile$.next({file: fileStats, newPath: `${this.fileStats.path}/${fileStats.name}`});
        }
    }
}
