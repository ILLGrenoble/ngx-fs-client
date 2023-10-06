import {Component, Input, OnInit, Output, ViewEncapsulation} from '@angular/core';
import { BehaviorSubject, filter } from 'rxjs';
import { DirectoryContent, FileStats } from '../../../models';
import {MatDialog} from "@angular/material/dialog";
import {DownloadFileDialogComponent} from "./dialogs";
import {VisaFileSystemService} from "../../../services";

@Component({
    selector: 'files-icon-view',
    templateUrl: './files-icon-view.component.html',
    styleUrls: ['./files-icon-view.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class FilesIconViewComponent implements OnInit {

    private _showHidden = false;

    @Input()
    path$: BehaviorSubject<string>;

    @Input()
    directoryContent$: BehaviorSubject<DirectoryContent>;

    @Input()
    directoryContentLoading$: BehaviorSubject<boolean>;

    @Input()
    downloadFile$: BehaviorSubject<FileStats>;

    @Input()
    deleteFile$: BehaviorSubject<FileStats> = new BehaviorSubject<FileStats>(null);

    @Output()
    selectedFile$: BehaviorSubject<FileStats> = new BehaviorSubject<FileStats>(null);

    @Output()
    doubleClickedFile$: BehaviorSubject<FileStats> = new BehaviorSubject<FileStats>(null);

    @Output()
    renameInProgress$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(null);

    private _items: FileStats[] = [];

    get items(): FileStats[] {
        return this._items;
    }

    constructor(private _dialog: MatDialog,
                private _fileSystemService: VisaFileSystemService) {
    }

    ngOnInit() {
        this.directoryContent$.pipe(
            filter(directoryContent => directoryContent != null),
        ).subscribe(directoryContent => {
            this._items = directoryContent.content
                .filter((entry: FileStats) => !entry.name.startsWith('.') || this._showHidden)
                .sort((a: FileStats, b: FileStats) => a.name.localeCompare(b.name))
                .sort((a: FileStats, b: FileStats) => {
                    return a.type === 'directory' && b.type === 'file' ? -1 :
                        a.type === 'file' && b.type === 'directory' ? 1 : 0;
                })
        });

        this.doubleClickedFile$.pipe(
            filter(fileStats => fileStats != null)
        ).subscribe(fileStats => {
            if (fileStats.type === 'directory') {
                this.path$.next(fileStats.path);

            } else {
                this.openDownloadFileDialog(fileStats)
            }
        });
    }

    openDownloadFileDialog(fileStats: FileStats) {
        const dialogRef = this._dialog.open(DownloadFileDialogComponent, {data: {fileStats}});
        dialogRef.afterClosed().subscribe(res => {
            if (res) {
                this.downloadFile$.next(fileStats)
            }
        });
    }

}
