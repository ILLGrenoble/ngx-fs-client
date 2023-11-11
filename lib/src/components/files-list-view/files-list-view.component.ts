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

@Component({
    selector: 'files-list-view',
    templateUrl: './files-list-view.component.html',
    styleUrls: ['./files-list-view.component.scss'],
    encapsulation: ViewEncapsulation.None,
    host: { class: 'ngx-fs-files-list-view-component'},
})
export class FilesListViewComponent implements OnInit, AfterViewInit, OnDestroy {

    private _columns = [
        {field: 'type', resizable: false, width: 3.5, index: 0},
        {field: 'name', resizable: true, width: 50, index: 1},
        {field: 'lastModified', resizable: true, width: 30, index: 2},
        {field: 'size', resizable: true, width: 20, index: 3},
    ]

    public displayedColumns: string[] = [];

    private pressed = false;
    private currentResizeIndex: number;
    private startX: number;
    private startWidth: number;
    private isResizingRight: boolean;
    private resizableMousemove: () => void;
    private resizableMouseup: () => void;

    @ViewChild(MatMenuTrigger)
    private _contextMenu: MatMenuTrigger;

    @ViewChild(MatTable, { read: ElementRef })
    private matTableRef: ElementRef;

    public contextMenuPosition = { x: '0px', y: '0px' };

    private _directoryContent: DirectoryContent;

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
        return this.directoryContent ? this.directoryContent.content : [];
    }

    get acceptDrop(): boolean {
        return this._acceptDrop;
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
                this._renameInProgress = event.fileStats;

            } else if (event.type === 'MOVED') {
                this.selectedFile = event.fileStats;

            } else if (event.type === 'COPIED') {
                this.selectedFile = event.fileStats;
            }
        })
        this.setDisplayedColumns();
    }

    ngAfterViewInit() {
        this.setTableResize(this.matTableRef.nativeElement.clientWidth);
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

    setDisplayedColumns() {
        this._columns.forEach((column, index) => {
            column.index = index;
            this.displayedColumns[index] = column.field;
        });
    }

    onResizeColumn(event: any, index: number) {
        this.checkResizing(event, index);
        this.currentResizeIndex = index;
        this.pressed = true;
        this.startX = event.pageX;
        this.startWidth = event.target.parentElement.clientWidth;
        event.preventDefault();
        this.mouseMove(index);
    }

    private checkResizing(event: any, index: number) {
        const cellData = this.getCellData(index);
        if (
            index === 0 ||
            (Math.abs(event.pageX - cellData.right) < cellData.width / 2 &&
                index !== this._columns.length - 1)
        ) {
            this.isResizingRight = true;
        } else {
            this.isResizingRight = false;
        }
    }

    private getCellData(index: number) {
        const headerRow =
            this.matTableRef.nativeElement.children[0].querySelector('tr');
        const cell = headerRow.children[index];
        return cell.getBoundingClientRect();
    }

    mouseMove(index: number) {
        this.resizableMousemove = this.renderer.listen(
            'document',
            'mousemove',
            (event) => {
                if (this.pressed && event.buttons) {
                    const dx = this.isResizingRight ? event.pageX - this.startX : -event.pageX + this.startX;
                    const width = this.startWidth + dx;
                    if (this.currentResizeIndex === index && width > 50) {
                        this.setColumnWidthChanges(index, width);
                    }
                }
            }
        );

        this.resizableMouseup = this.renderer.listen(
            'document',
            'mouseup',
            (event) => {
                if (this.pressed) {
                    this.pressed = false;
                    this.currentResizeIndex = -1;
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
            const j = this.isResizingRight ? index + 1 : index - 1;
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

    onFileSystemAction(action: FileSystemAction) {
        this.fileSystemAction.emit(action);
    }

    onNewFile(): void {
        this.fileSystemAction.emit(new FileSystemAction({path: this.path, type: 'NEW_FILE'}));
    }

    onNewFolder(): void {
        this.fileSystemAction.emit(new FileSystemAction({path: this.path, type: 'NEW_FOLDER'}));
    }

    // onFileDoubleClick(fileStats: FileStats): void {
    //     if (fileStats.type === 'directory') {
    //         this.pathChange.emit(fileStats.path);
    //
    //     } else {
    //         this.openDownloadFileDialog(fileStats)
    //     }
    // }

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
