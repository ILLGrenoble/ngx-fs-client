import {Component, Input, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation} from '@angular/core';
import {BehaviorSubject, filter, Subject, takeLast, takeUntil} from 'rxjs';
import { DirectoryContent, FileStats, MovedFile } from '../../../models';
import {MatDialog} from "@angular/material/dialog";
import {DownloadFileDialogComponent} from "./dialogs";
import {VisaFileSystemService} from "../../../services";
import {MatMenuTrigger} from "@angular/material/menu";

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
    renameInProgress$: BehaviorSubject<FileStats> = new BehaviorSubject<FileStats>(null);

    @Output()
    movedFile$: BehaviorSubject<MovedFile> = new BehaviorSubject<MovedFile>(null);

    private _items: FileStats[] = [];
    private _destroy$: Subject<boolean> = new Subject<boolean>();

    get items(): FileStats[] {
        return this._items;
    }

    constructor(private _dialog: MatDialog,
                private _fileSystemService: VisaFileSystemService) {
    }

    ngOnInit() {
        this.directoryContent$.pipe(
            takeUntil(this._destroy$),
            filter(directoryContent => directoryContent != null),
        ).subscribe(directoryContent => {
            this._items = this._sortDirectoryContent(directoryContent.content);
        });

        this.doubleClickedFile$.pipe(
            takeUntil(this._destroy$),
            filter(fileStats => fileStats != null)
        ).subscribe(fileStats => {
            if (fileStats.type === 'directory') {
                this.path$.next(fileStats.path);

            } else {
                this.openDownloadFileDialog(fileStats)
            }
        });

        this.renameInProgress$.pipe(
            takeUntil(this._destroy$),
            filter(fileStats => fileStats != null)
        ).subscribe(() => {
            this._items = this._sortDirectoryContent(this._items);
        });

        this.movedFile$.pipe(
            takeUntil(this._destroy$),
            filter(data => data != null)
        ).subscribe(movedFile => {
            this._moveFile(movedFile.file, movedFile.newPath);
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
                this.downloadFile$.next(fileStats)
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
        this._fileSystemService.newFile(this.path$.getValue()).subscribe(fileStats => {
            this._items = this._sortDirectoryContent([...this._items, fileStats]);
            this.renameInProgress$.next(fileStats);
        })
    }

    onNewFolder(): void {
        this._fileSystemService.newFolder(this.path$.getValue()).subscribe(fileStats => {
            this._items = this._sortDirectoryContent([...this._items, fileStats]);
            this.renameInProgress$.next(fileStats);
        })
    }

    private _moveFile(fileStats: FileStats, newPath: string): void {
        this._fileSystemService.moveFile(fileStats, newPath).subscribe({
            next: () => {
                this._items = this._items.filter(item => item.path != fileStats.path);
            },
            error: (error) => {
                console.log(`Cannot move file: ${error.error}`);
            }
        })
    }

    private _sortDirectoryContent(items: FileStats[]): FileStats[] {
        return items.filter((entry: FileStats) => !entry.name.startsWith('.') || this._showHidden)
            .sort((a: FileStats, b: FileStats) => a.name.localeCompare(b.name))
            .sort((a: FileStats, b: FileStats) => {
                return a.type === 'directory' && b.type === 'file' ? -1 :
                    a.type === 'file' && b.type === 'directory' ? 1 : 0;
            })
    }
}
