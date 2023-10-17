import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {FileUpload, UploadData} from "../../../../models";
import {
    catchError,
    concatMap,
    EMPTY,
    from,
    map,
    of,
    Subject,
    takeUntil,
} from 'rxjs';
import {VisaFileSystemService} from "../../../../services";

@Component({
    selector: 'file-upload-dialog',
    templateUrl: './file-upload-dialog.component.html',
    styleUrls: ['./file-upload-dialog.component.scss'],
})
export class FileUploadDialogComponent implements OnInit, OnDestroy {

    private readonly _files: FileList;
    private readonly _path: string;
    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _completed: boolean = false;
    private _cancelled: boolean = false;
    private _fileSystemService: VisaFileSystemService;

    private _fileUploads: FileUpload[] = [];

    get path(): string {
        return this._path;
    }

    get fileUploads(): FileUpload[] {
        return this._fileUploads;
    }

    get completed(): boolean {
        return this._completed;
    }

    get cancelled(): boolean {
        return this._cancelled;
    }

    constructor(public dialogRef: MatDialogRef<FileUploadDialogComponent>,
                @Inject(MAT_DIALOG_DATA) data: {
                    files: FileList,
                    path: string,
                    fileSystemService: VisaFileSystemService}) {
        this._files = data.files;
        this._path = data.path;
        this._fileSystemService = data.fileSystemService;
    }

    ngOnInit(): void {
        const fileUploads = [];
        for (let i = 0; i < this._files.length; i++) {
            const file = this._files[i];
            const fileUpload = new FileUpload({
                file: file,
                uploadPath: this._path
            });

            this._fileUploads.push(fileUpload);
            fileUploads.push(fileUpload)
        }
        from(fileUploads).pipe(
            concatMap(fileUpload => {
                const chunks = fileUpload.createChunks();
                return from(chunks).pipe(
                    concatMap(fileUploadChunk => {
                        return from(this._getFileContent(fileUploadChunk.blob)).pipe(
                            map(content => ({content, chunk: fileUploadChunk.chunkIndex, name: fileUploadChunk.fileName, format: 'base64', type: 'file'} as UploadData)),
                            map(uploadData => ({fileUploadChunk: fileUploadChunk, uploadData}))
                        )
                    }),
                    concatMap(({fileUploadChunk, uploadData}) => {
                        const path = fileUploadChunk.uploadPath;
                        if (fileUpload.error) {
                            return EMPTY;
                        }

                        return this._fileSystemService.uploadFileWithProgress(path, uploadData).pipe(
                            concatMap(uploadProgress => {
                                if (uploadProgress.fileStats) {
                                    fileUploadChunk.progress = 100;
                                    if (fileUpload.progress === 100) {
                                        return of({fileUpload, fileStats: uploadProgress.fileStats})

                                    } else {
                                        return EMPTY;
                                    }
                                } else {
                                    fileUploadChunk.progress = uploadProgress.progress;
                                    return EMPTY;
                                }
                            }),
                            catchError(error => {
                                fileUpload.progress = 100;
                                fileUpload.error = error.statusText;
                                return EMPTY;
                            })
                        );
                    }),
                    takeUntil(this._destroy$),
                );
            }),
            takeUntil(this._destroy$),

        ).subscribe(({fileUpload, fileStats}) => {
            this._completed = this._fileUploads.find(fileUpload => fileUpload.progress !== 100) == null;
        });
    }


    ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    private _getFileContent(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            fileReader.onerror = (error) => {
                fileReader.abort();
                reject(`Failed to read file content: ${error}`);
            }
            fileReader.onload = () => {
                resolve((fileReader.result as string).split(',')[1]);
            }

            fileReader.readAsDataURL(blob);
        })
    }

    public onCancel(): void {
        this._destroy$.next(true);
        this._cancelled = true;
    }
}
