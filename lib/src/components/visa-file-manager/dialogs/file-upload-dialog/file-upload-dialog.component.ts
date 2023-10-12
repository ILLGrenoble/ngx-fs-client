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
        // this._uploadEvent$.pipe(
        //     takeUntil(this._destroy$),
        //     filter(uploadEvent => uploadEvent != null)
        // ).subscribe(uploadEvent => {
        //     for (let i = 0; i < uploadEvent.files.length; i++) {
        //         const file = uploadEvent.files[i];
        //         this._fileUploads.push(new FileUpload({file: file, name: file.name, size: file.size, uploadPath: uploadEvent.path}))
        //     }
        //
        //     // Start an upload if not one already in progress
        //     if (this._fileUpload$.getValue() == null) {
        //         this._fileUpload$.next(this._fileUploads[this._currentUploadIndex]);
        //     }
        // });
        //
        // this._fileUpload$.pipe(
        //     takeUntil(this._destroy$),
        //     filter(fileUpload => fileUpload != null)
        // ).subscribe(async (fileUpload) => {
        //     console.log(`uploading ${fileUpload.name}`);
        //
        //     if (fileUpload.chunks) {
        //         for (const chunk of fileUpload.chunks) {
        //             const chunkContents = await this._getFileContent(fileUpload.file.slice(chunk.start, chunk.end));
        //
        //         }
        //
        //     } else {
        //         const contents = await this._getFileContent(fileUpload.file);
        //
        //     }
        //
        //
        //     // Finished, do next
        //     this._currentUploadIndex++;
        //     if (this._fileUploads.length > this._currentUploadIndex) {
        //         this._fileUpload$.next(this._fileUploads[this._currentUploadIndex]);
        //     }
        // })

        this._uploadEvent$.pipe(
            takeUntil(this._destroy$),
            filter(uploadEvent => uploadEvent != null),
            concatMap(uploadEvent => {
                const fileUploads = [];
                for (let i = 0; i < uploadEvent.files.length; i++) {
                    const file = uploadEvent.files[i];
                    fileUploads.push(new FileUpload({
                        file: file,
                        uploadPath: uploadEvent.path
                    }))
                }
                return from(fileUploads);
            }),
            concatMap(fileUpload => {
                console.log(`uploading ${fileUpload.file.name}`);
                this._fileUploads.push(fileUpload);
                const chunks = fileUpload.createChunks();
                return from(chunks);
            }),
            concatMap(fileUploadChunk => {
                return from(this._getFileContent(fileUploadChunk.blob)).pipe(
                    map(content => ({content, chunk: fileUploadChunk.chunkIndex, name: fileUploadChunk.fileName, format: 'base64', type: 'file'} as UploadData)),
                    map(uploadData => ({fileUploadChunk: fileUploadChunk, uploadData}))
                )
            }),
            concatMap(({fileUploadChunk, uploadData}) => {
                console.log(`uploading chunk ${uploadData.chunk} of ${uploadData.name}`);
                const path = fileUploadChunk.uploadPath;
                const fileUpload = fileUploadChunk.fileUpload;
                return this._fileSystemService.uploadFileWithProgress(path, uploadData).pipe(
                    concatMap(uploadProgress => {
                        if (uploadProgress.fileStats) {
                            fileUploadChunk.progress = 100;
                            return of(uploadProgress.fileStats)
                        } else {
                            console.log(`Chunk progress = ${uploadProgress.progress}`);
                            fileUploadChunk.progress = uploadProgress.progress;
                            return EMPTY;
                        }
                    }),
                    catchError(error => {
                        fileUploadChunk.progress = 100;
                        fileUpload.error = error;
                        return throwError(error);
                    })
                );
            })
        ).subscribe(fileStats => {
            console.log(`Chunk completed for ${fileStats.path}, size = ${fileStats.size}`);
            console.log(fileStats.name);
        })
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
