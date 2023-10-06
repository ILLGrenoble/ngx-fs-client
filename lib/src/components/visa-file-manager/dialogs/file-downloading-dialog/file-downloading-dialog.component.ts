import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {FileStats} from "../../../../models";
import {BehaviorSubject} from "rxjs";

@Component({
    selector: 'file-downloading-dialog',
    templateUrl: './file-downloading-dialog.component.html',
    styleUrls: ['./file-downloading-dialog.component.scss'],
})
export class FileDownloadingDialogComponent {

    private readonly _fileStats: FileStats;

    public progress: number = 0;
    public error: string = null;

    get fileStats() {
        return this._fileStats;
    }


    constructor(public dialogRef: MatDialogRef<FileDownloadingDialogComponent>,
                @Inject(MAT_DIALOG_DATA) data: { fileStats: FileStats, downloadProgress$: BehaviorSubject<{progress: number, error?: string}>  }) {
        this._fileStats = data.fileStats;
        data.downloadProgress$.subscribe(({progress, error}) => {
            console.log(`got progress of ${progress}`);
            this.progress = progress;
            this.error = error;
        })
    }

}
