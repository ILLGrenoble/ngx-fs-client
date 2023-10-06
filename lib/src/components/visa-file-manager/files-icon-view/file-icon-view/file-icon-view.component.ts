import {Component, Input, OnInit, ViewEncapsulation} from '@angular/core';
import { FileStats } from '../../../../models';
import {filter, Subject} from 'rxjs';

@Component({
    selector: 'file-icon-view',
    templateUrl: './file-icon-view.component.html',
    styleUrls: ['./file-icon-view.component.scss'],
})
export class FileIconViewComponent implements OnInit {

    private _selected: boolean = false;

    @Input()
    fileStats: FileStats;

    @Input()
    doubleClickedFile$: Subject<FileStats>;

    @Input()
    selectedFile$: Subject<FileStats>;

    get selected(): boolean {
        return this._selected;
    }

    ngOnInit() {
        this.selectedFile$.subscribe(fileStats => {
            this._selected = (fileStats !== null && fileStats.path === this.fileStats.path);
        })
    }

    onDoubleClicked(): void {
        this.doubleClickedFile$.next(this.fileStats);
    }

    onSelect(): void {
        this.selectedFile$.next(this.fileStats);
    }

}
