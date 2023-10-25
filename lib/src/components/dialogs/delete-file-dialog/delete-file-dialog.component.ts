import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {FileStats} from "../../../models";

@Component({
    selector: 'delete-file-dialog',
    templateUrl: './delete-file-dialog.component.html',
    styleUrls: ['./delete-file-dialog.component.scss'],
})
export class DeleteFileDialogComponent {

    private readonly _fileStats: FileStats;

    get fileStats() {
        return this._fileStats;
    }

    constructor(public dialogRef: MatDialogRef<DeleteFileDialogComponent>,
                @Inject(MAT_DIALOG_DATA) data: { fileStats: FileStats }) {
        this._fileStats = data.fileStats;
    }

}
