import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { BehaviorSubject, filter } from 'rxjs';
import { DirectoryContent, FileStats } from '../../../models';

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
    downloadFile$: BehaviorSubject<string>;

    fileDoubleClickedListener$: BehaviorSubject<FileStats> = new BehaviorSubject<FileStats>(null);

    private _items: FileStats[] = [];

    get items(): FileStats[] {
        return this._items;
    }

    constructor() {
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

        this.fileDoubleClickedListener$.pipe(
            filter(fileStats => fileStats != null)
        ).subscribe(fileStats => {
            if (fileStats.type === 'directory') {
                this.path$.next(fileStats.path);

            } else {
                this.downloadFile$.next(fileStats.path)
            }
        })
    }

}
