import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import { FileStats } from '../../../../models';
import {BehaviorSubject, Subject} from 'rxjs';
import {MatMenuTrigger} from "@angular/material/menu";
import {VisaFileSystemService} from "../../../../services";

@Component({
    selector: 'file-icon-view',
    templateUrl: './file-icon-view.component.html',
    styleUrls: ['./file-icon-view.component.scss'],
})
export class FileIconViewComponent implements OnInit {

    @ViewChild('fileNameInput')
    fileNameInput: ElementRef;

    private _selected: boolean = false;
    private _isFileNameEdit: boolean = false;
    private _fileName: string;

    @Input()
    fileStats: FileStats;

    @Input()
    doubleClickedFile$: Subject<FileStats>;

    @Input()
    selectedFile$: Subject<FileStats>;

    @Input()
    renameInProgress$: BehaviorSubject<boolean>;


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
        this.selectedFile$.subscribe(fileStats => {
            this._selected = (fileStats !== null && fileStats.path === this.fileStats.path);
        });

        this._fileName = this.fileStats.name;
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
        event.preventDefault();
        viewChild.openMenu();
    }

    editFileName(active: boolean): void {
        this.renameInProgress$.next(active);
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
                    this.fileStats = newFileStats;
                    this._fileName = newFileStats.name;
                    this.editFileName(false);
                },
                error: (error) => {
                    console.log(`Cannot update filename: ${error.error}`);
                    this.editFileName(false);
                }
            })
        } else {
            this.editFileName(false);
        }
    }

    cancelFileNameChange(): void {
        this._fileName = this.fileStats.name;
        this.editFileName(false);
    }

}
