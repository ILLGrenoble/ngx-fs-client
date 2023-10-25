import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {FileStats} from "../../../../models";

@Component({
    selector: 'download-file-dialog',
    templateUrl: './download-file-dialog.component.html',
    styleUrls: ['./download-file-dialog.component.scss'],
})
export class DownloadFileDialogComponent {

    private readonly _fileStats: FileStats;

    get fileStats() {
        return this._fileStats;
    }

    constructor(public dialogRef: MatDialogRef<DownloadFileDialogComponent>,
                @Inject(MAT_DIALOG_DATA) data: { fileStats: FileStats }) {
        this._fileStats = data.fileStats;
    }

}
