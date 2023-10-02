import { Component, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { BehaviorSubject, finalize, Subject, switchMap, takeUntil } from 'rxjs';
import { VisaFileSystemService } from '../../services';
import { DirectoryContent, LinkedPath } from '../../models';

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
    directoryContentLoading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    private _destroy$: Subject<boolean> = new Subject<boolean>();

    constructor(private _fileSystemService: VisaFileSystemService) {
    }

    ngOnInit(): void {
        this.path$.subscribe(path => {
            const currentPath = this.linkedPath$.getValue();
            if (currentPath.name !== path) {
                const linkedPath = new LinkedPath({name: path, previous: currentPath});
                currentPath.next = linkedPath;
                this.linkedPath$.next(linkedPath);
            }
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

    }

    ngOnDestroy(): void {
        this._destroy$.next(true);
        this._destroy$.unsubscribe();
    }
}
