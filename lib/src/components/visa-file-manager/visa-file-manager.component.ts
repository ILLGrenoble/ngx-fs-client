import { Component, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import {BehaviorSubject, concatMap, filter, finalize, from, of, Subject, switchMap, takeUntil} from 'rxjs';
import { VisaFileSystemService } from '../../services';
import {DirectoryContent, FileContent, LinkedPath} from '../../models';

@Component({
    selector: 'visa-file-manager',
    templateUrl: './visa-file-manager.component.html',
    styleUrls: ['./visa-file-manager.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class VisaFileManagerComponent implements OnInit, OnDestroy {

    @Output()
    path$: BehaviorSubject<string> = new BehaviorSubject<string>('');

    @Output()
    linkedPath$: BehaviorSubject<LinkedPath> = new BehaviorSubject<LinkedPath>(new LinkedPath({name: ''}));

    @Output()
    directoryContent$: BehaviorSubject<DirectoryContent> = new BehaviorSubject<DirectoryContent>(null);

    @Output()
    downloadFile$: BehaviorSubject<string> = new BehaviorSubject<string>(null);

    @Output()
    directoryContentLoading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    constructor(private _fileSystemService: VisaFileSystemService) {
    }

    ngOnInit(): void {
        this.path$.pipe(
            takeUntil(this._destroy$),
            filter(path => path != null),
            filter(path => {
                const currentPath = this.linkedPath$.getValue();
                return path != currentPath.name;
            })
        ).subscribe(path => {
            const currentPath = this.linkedPath$.getValue();
            const linkedPath = new LinkedPath({name: path, previous: currentPath});
            currentPath.next = linkedPath;
            this.linkedPath$.next(linkedPath);
        });

        this.linkedPath$.pipe(
            takeUntil(this._destroy$),
            switchMap(path => {
                this.directoryContentLoading$.next(true);
                this.path$.next(path.name);
                return this._fileSystemService.getDirectoryContent(path.name).pipe(
                    takeUntil(this._destroy$),
                    finalize(() => this.directoryContentLoading$.next(false))
                )
            })).subscribe({
            next: (content) => {
                this.directoryContent$.next(content);
            },
            error: (error) => {
                console.error(error);
            }
        });

        this.downloadFile$.pipe(
            takeUntil(this._destroy$),
            filter(filePath => filePath != null)
        ).subscribe(filePath => {
            this.downloadFile(filePath);
        })

    }

    ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }

    downloadFile(filePath: string): void {
        this._fileSystemService.downloadFile(filePath).pipe(
            concatMap(fileContent => {
                if (fileContent.format === 'base64') {
                    return from(this._blobFromBase64(fileContent)).pipe(
                        switchMap((blob) => {
                            return of({name: fileContent.stats.name, blob});
                        }
                    ));

                } else {
                    const blob = new Blob([fileContent.content], {type: fileContent.mimetype});
                    return of({name: fileContent.stats.name, blob});
                }
            })).subscribe(({name, blob}) => {
            const link = window.document.createElement("a");
            link.href = window.URL.createObjectURL(blob);
            link.download = name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(link.href);
        })

    }

    private async _blobFromBase64(fileContent: FileContent): Promise<Blob> {
        const fileUrl = `data:${fileContent.mimetype};base64,${fileContent.content}`;
        const response = await fetch(fileUrl);
        const blob = await response.blob();

        return blob;
    }
}
