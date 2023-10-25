import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {FileStats} from "../../../models";
import {BehaviorSubject, filter, Subject, takeUntil} from "rxjs";

@Component({
    selector: 'file-downloading-dialog',
    templateUrl: './file-downloading-dialog.component.html',
    styleUrls: ['./file-downloading-dialog.component.scss'],
})
export class FileDownloadingDialogComponent implements OnInit, OnDestroy {

    private readonly _downloadProgress$: BehaviorSubject<{progress: number, error?: string}>;
    private _destroy$: Subject<boolean> = new Subject<boolean>();

    private readonly _fileStats: FileStats;

    public progress: number = 0;
    public error: string = null;

    get fileStats() {
        return this._fileStats;
    }

    constructor(public dialogRef: MatDialogRef<FileDownloadingDialogComponent>,
                @Inject(MAT_DIALOG_DATA) data: { fileStats: FileStats, downloadProgress$: BehaviorSubject<{progress: number, error?: string}>  }) {
        this._fileStats = data.fileStats;
        this._downloadProgress$ = data.downloadProgress$;
    }


    ngOnInit(): void {
        this._downloadProgress$.pipe(
            takeUntil(this._destroy$),
            filter(uploadEvent => uploadEvent != null)
        ).subscribe(({progress, error}) => {
            this.progress = progress;
            this.error = error;
        });
    }

    ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

}
