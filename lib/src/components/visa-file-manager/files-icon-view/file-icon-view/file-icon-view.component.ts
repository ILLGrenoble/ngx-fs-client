import {Component, ElementRef, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import { FileStats } from '../../../../models';
import {BehaviorSubject, Subject, takeUntil} from 'rxjs';
import {MatMenuTrigger} from "@angular/material/menu";
import {VisaFileSystemService} from "../../../../services";

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
    selectedFile$: Subject<FileStats>;

    @Input()
    renameInProgress$: BehaviorSubject<FileStats>;

    private _selected: boolean = false;
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
        return this._selected;
    }

    get isFileNameEdit(): boolean {
        return this._isFileNameEdit;
    }

    constructor(private _fileSystemService: VisaFileSystemService) {
    }

    ngOnInit() {
        this.selectedFile$.pipe(
            takeUntil(this._destroy$)
        ).subscribe(fileStats => {
            this._selected = (fileStats !== null && fileStats.path === this.fileStats.path);
        });

        this._fileName = this.fileStats.name;

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
        if (!this.renameInProgress$.getValue()) {
            this.doubleClickedFile$.next(this.fileStats);
        }
    }

    onSelect(): void {
        if (!this.renameInProgress$.getValue()) {
            this.selectedFile$.next(this.fileStats);
        }
    }

    openMenu(event: Event, viewChild: MatMenuTrigger): void {
        this.onSelect();
        event.preventDefault();
        event.stopPropagation();
        viewChild.openMenu();
    }

    editFileName(): void {
        this.renameInProgress$.next(this.fileStats);
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
                    this._fileName = newFileStats.name;
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
        this._fileName = this.fileStats.name;
        this.renameInProgress$.next(null);
    }

    downloadFile(): void {
        this.downloadFile$.next(this.fileStats);
    }

    deleteFile(): void {
        this.deleteFile$.next(this.fileStats);
    }

}
