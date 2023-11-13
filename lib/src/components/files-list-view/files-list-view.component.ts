import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output, Renderer2,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import { filter, Observable, Subject, takeUntil } from 'rxjs';
import {
    CopyCutFileAction,
    DirectoryContent,
    FileStats,
    FileSystemAction,
    FileSystemEvent,
} from '../../models';
import {MatDialog} from "@angular/material/dialog";
import {MatMenuTrigger} from "@angular/material/menu";
import { DndDropEvent } from 'ngx-drag-drop';
import {MatTable} from "@angular/material/table";
import {DownloadFileDialogComponent} from "../dialogs";

@Component({
    selector: 'files-list-view',
    templateUrl: './files-list-view.component.html',
    styleUrls: ['./files-list-view.component.scss'],
    encapsulation: ViewEncapsulation.None,
    host: { class: 'ngx-fs-files-list-view-component'},
})
export class FilesListViewComponent implements OnInit, OnDestroy {

    private _columns = [
        {field: 'name', width: 50},
        {field: 'lastModified', width: 30},
        {field: 'size', width: 20},
    ]

    public displayedColumns = this._columns.map(column => column.field);

    private _resizeInProgress = false;
    private _currentResizeIndex: number;
    private _resizeStartX: number;
    private _resizeStartWidth: number;
    private resizableMousemove: () => void;
    private resizableMouseup: () => void;

    @ViewChild(MatMenuTrigger)
    private _contextMenu: MatMenuTrigger;

    @ViewChild(MatTable, { read: ElementRef })
    private matTableRef: ElementRef;

    public contextMenuPosition = { x: '0px', y: '0px' };

    private _directoryContent: DirectoryContent;

    private _selectedFile: FileStats;
    private _renameInProgress: FileStats;
    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _acceptDrop = false;
    private _copyCutFileAction: CopyCutFileAction;

    private _isSingleClick: Boolean = true;
    private _fileNameEdit: string = null;

    @Input()
    path: string;

    @Output()
    pathChange = new EventEmitter<string>;

    get directoryContent(): DirectoryContent {
        return this._directoryContent;
    }

    @Input()
    set directoryContent(content: DirectoryContent) {
        this._directoryContent = content;
        setTimeout(() => this.setTableResize(this.matTableRef.nativeElement.clientWidth), 20)
    }

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
            if (fileStats != null) {
                this.editFileName(fileStats);
            }
            this.renameInProgressChange.emit(fileStats);
        }
    }

    @Output()
    renameInProgressChange = new EventEmitter<FileStats>();

    get items(): FileStats[] {
        return this.directoryContent ? this.directoryContent.content : [];
    }

    get acceptDrop(): boolean {
        return this._acceptDrop;
    }

    get fileNameEdit(): string {
        return this._fileNameEdit;
    }

    set fileNameEdit(value: string) {
        this._fileNameEdit = value;
    }

    constructor(private _dialog: MatDialog,
                private renderer: Renderer2) {
    }

    ngOnInit() {
        this.fileSystemEvent$.pipe(
            takeUntil(this._destroy$),
            filter(data => data != null)
        ).subscribe(event => {
            if (event.type === 'CREATED') {
                this.selectedFile = event.fileStats;
                this.renameInProgress = event.fileStats;

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

    setTableResize(tableWidth: number) {
        let totalWidth = this._columns.reduce((sum, column) => {
            return sum + column.width;
        }, 0);
        const scale = (tableWidth - 5) / totalWidth;
        this._columns.forEach((column) => {
            column.width *= scale;
            this.setColumnWidth(column);
        });
    }

    onResizeColumn(event: any, index: number) {
        this._currentResizeIndex = index;
        this._resizeInProgress = true;
        this._resizeStartX = event.pageX;
        this._resizeStartWidth = event.target.parentElement.clientWidth;
        event.preventDefault();
        this.mouseMove(index);
    }

    mouseMove(index: number) {
        this.resizableMousemove = this.renderer.listen(
            'document',
            'mousemove',
            (event) => {
                if (this._resizeInProgress && event.buttons) {
                    const dx = event.pageX - this._resizeStartX;
                    const width = this._resizeStartWidth + dx;
                    if (this._currentResizeIndex === index && width > 50) {
                        this.setColumnWidthChanges(index, width);
                    }
                }
            }
        );

        this.resizableMouseup = this.renderer.listen(
            'document',
            'mouseup',
            (event) => {
                if (this._resizeInProgress) {
                    this._resizeInProgress = false;
                    this._currentResizeIndex = -1;
                    this.resizableMousemove();
                    this.resizableMouseup();
                }
            }
        );
    }

    setColumnWidthChanges(index: number, width: number) {
        const orgWidth = this._columns[index].width;
        const dx = width - orgWidth;
        if (dx !== 0) {
            const j = index + 1;
            const newWidth = this._columns[j].width - dx;
            if (newWidth > 50) {
                this._columns[index].width = width;
                this.setColumnWidth(this._columns[index]);
                this._columns[j].width = newWidth;
                this.setColumnWidth(this._columns[j]);
            }
        }
    }

    setColumnWidth(column: any) {
        const columnEls = Array.from(
            document.getElementsByClassName('mat-column-' + column.field)
        );
        columnEls.forEach((el: Element) => {
            (el as HTMLDivElement).style.width = column.width + 'px';
            (el as HTMLDivElement).style.maxWidth = column.width + 'px';
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

    openDownloadFileDialog(fileStats: FileStats) {
        const dialogRef = this._dialog.open(DownloadFileDialogComponent, {data: {fileStats}});
        dialogRef.afterClosed().subscribe(res => {
            if (res) {
                this.fileSystemAction.emit(new FileSystemAction({fileStats, type: 'DOWNLOAD'}));
            }
        });
    }

    onNewFile(): void {
        this.fileSystemAction.emit(new FileSystemAction({path: this.path, type: 'NEW_FILE'}));
    }

    onNewFolder(): void {
        this.fileSystemAction.emit(new FileSystemAction({path: this.path, type: 'NEW_FOLDER'}));
    }

    onClick(): void {
        this.selectedFile = null;
        this.renameInProgress = null;
    }

    onDoubleClickFile(event: Event, fileStats: FileStats): void {
        event.preventDefault();
        event.stopPropagation();

        this._isSingleClick = false;

        if (!this.renameInProgress) {
            this.selectedFileChange.emit(fileStats);
            if (fileStats.type === 'directory') {
                this.pathChange.emit(fileStats.path);

            } else {
                this.openDownloadFileDialog(fileStats)
            }
        }
    }

    onClickFile(event: Event, fileStats: FileStats): void {
        event.preventDefault();
        event.stopPropagation();

        this._isSingleClick = true;
        if (this.selectedFile != null && this.selectedFile === fileStats) {
            setTimeout(() => {
                if (this._isSingleClick) {
                    if (this._renameInProgress !== fileStats) {
                        this.editFileName(fileStats);
                    }
                }
            }, 250)
        }

        if (this._renameInProgress && this._renameInProgress !== fileStats) {
            this.cancelFileNameChange();
        }

        this.selectedFileChange.emit(fileStats);
    }

    onRightClickFile(event: Event, fileStats: FileStats): void {
        this.selectedFileChange.emit(fileStats);
    }

    isSelectedFile(fileStats: FileStats): boolean {
        return this.selectedFile === fileStats;
    }

    editFileName(fileStats: FileStats): void {
        if (fileStats.name !== '..') {
            this._fileNameEdit = fileStats.name;
            this.renameInProgressChange.emit(fileStats);
        }
    }

    updateFileName(): void {
        if (this._renameInProgress.name !== this._fileNameEdit) {
            const oldPath = this._renameInProgress.path;
            const newPath = `${oldPath.substring(0, oldPath.lastIndexOf('/'))}/${this._fileNameEdit}`;

            this.fileSystemAction.emit(new FileSystemAction({fileStats: this._renameInProgress, path: newPath, type: 'MOVE'}));

            this.renameInProgressChange.emit(null);

        } else {
            this.renameInProgressChange.emit(null);
        }
    }

    cancelFileNameChange(): void {
        this._fileNameEdit = null;
        this.renameInProgressChange.emit(null);
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

    onDropOverFolder(event: DndDropEvent, folder: FileStats): void {
        event.event.preventDefault();
        event.event.stopPropagation();

        if (event.isExternal) {
            this.fileSystemAction.emit(new FileSystemAction({path: folder.path, files: event.event.dataTransfer.files, type: 'UPLOAD'}));

        } else {
            const fileStats = event.data;
            this.fileSystemAction.emit(new FileSystemAction({fileStats, path: `${folder.path}/${fileStats.name}`, type: 'MOVE'}));
        }

    }

    onDragOverFolder(event: DragEvent, folder: FileStats): void {
        event.preventDefault();
        event.stopPropagation();

        console.log('dragOver ' + folder.name);
    }

    onDragStart(event: DragEvent, fileStats: FileStats): void {
        if (this.selectedFile == null || this.selectedFile !== fileStats) {
            setTimeout(() => this.selectedFileChange.emit(fileStats), 20);
        }
    }

    onDragLeave(event: DragEvent): void {
        this._acceptDrop = false;
    }

    downloadFile(): void {

    }

    deleteFile(): void {
        this.fileSystemAction.emit(new FileSystemAction({fileStats: this.selectedFile, type: 'DELETE'}));
    }

    cutFile(): void {
        this.copyCutFileActionChange.emit(new CopyCutFileAction({fileStats: this.selectedFile, type: 'CUT'}));
    }

    copyFile(): void {
        if (this.selectedFile.type === 'file') {
            this.copyCutFileActionChange.emit(new CopyCutFileAction({fileStats: this.selectedFile, type: 'COPY'}));
        }
    }

    pasteFile(): void {
        if (this.copyCutFileAction != null) {
            this.copyCutFileActionChange.emit(new CopyCutFileAction({fileStats: this.directoryContent.stats, type: 'PASTE'}));
        }
    }
}
