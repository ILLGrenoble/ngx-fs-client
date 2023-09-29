import { Component, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { BehaviorSubject, Subject, switchMap, takeUntil } from 'rxjs';
import { VisaFileSystemService } from '../../services';
import { DirectoryContent } from '../../models';

@Component({
    selector: 'visa-file-manager',
    templateUrl: './visa-file-manager.component.html',
    styleUrls: ['./visa-file-manager.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class VisaFileManagerComponent implements OnInit, OnDestroy {

    @Output()
    path$: BehaviorSubject<string> = new BehaviorSubject<string>('Desktop/test2');

    @Output()
    directoryContent$: BehaviorSubject<DirectoryContent> = new BehaviorSubject<DirectoryContent>(null);

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    constructor(private _fileSystemService: VisaFileSystemService) {
    }

    ngOnInit(): void {
        this.path$.pipe(
            takeUntil(this._destroy$),
            switchMap(path => {
                return this._fileSystemService.getDirectoryContent(path).pipe(
                    takeUntil(this._destroy$)
                )
            })).subscribe({
                next: (content) => {
                    this.directoryContent$.next(content);
                    console.log(JSON.stringify(content))
                },
                error: (error) => {
                    console.error(error);
                }
            });

    }

    ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }
}
