import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {FileStats, FileUpload, UploadData, UploadEvent} from "../../../../models";
import {
    BehaviorSubject,
    catchError,
    concatMap,
    EMPTY,
    filter,
    from,
    map,
    of,
    Subject,
    takeUntil,
    throwError
} from 'rxjs';
import {VisaFileSystemService} from "../../../../services";

@Component({
    selector: 'file-upload-dialog',
    templateUrl: './file-upload-dialog.component.html',
    styleUrls: ['./file-upload-dialog.component.scss'],
})
export class FileUploadDialogComponent implements OnInit, OnDestroy {

    private readonly _uploadEvent$: BehaviorSubject<UploadEvent>;
    private _destroy$: Subject<boolean> = new Subject<boolean>();
    private _progress: number = 0;
    private _fileSystemService: VisaFileSystemService;

    private _fileUploads: FileUpload[] = [];
    private _currentUploadIndex = 0;

    private _fileUpload$: BehaviorSubject<FileUpload> = new BehaviorSubject<FileUpload>(null);

    get fileUploads(): FileUpload[] {
        return this._fileUploads;
    }

    constructor(public dialogRef: MatDialogRef<FileUploadDialogComponent>,
                @Inject(MAT_DIALOG_DATA) data: {
                    uploadEvent$: BehaviorSubject<UploadEvent>,
                    fileSystemService: VisaFileSystemService}) {
        this._uploadEvent$ = data.uploadEvent$;
        this._fileSystemService = data.fileSystemService;
    }

    ngOnInit(): void {
        this._uploadEvent$.pipe(
            takeUntil(this._destroy$),
            filter(uploadEvent => uploadEvent != null),
            concatMap(uploadEvent => {
                const fileUploads = [];
                for (let i = 0; i < uploadEvent.files.length; i++) {
                    const file = uploadEvent.files[i];
                    const fileUpload = new FileUpload({
                        file: file,
                        uploadPath: uploadEvent.path
                    });

                    this._fileUploads.push(fileUpload);
                    fileUploads.push(fileUpload)
                }
                return from(fileUploads);
            }),
            concatMap(fileUpload => {
                console.log(`Uploading ${fileUpload.file.name}`);
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
                    })
                );
            })
        ).subscribe(({fileUpload, fileStats}) => {
            console.log(`FileUpload completed for ${fileStats.path}, size = ${fileStats.size}`);
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
}
