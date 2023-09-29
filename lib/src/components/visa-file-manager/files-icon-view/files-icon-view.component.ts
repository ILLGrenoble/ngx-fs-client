import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { BehaviorSubject, filter } from 'rxjs';
import { DirectoryContent } from '../../../models';

@Component({
    selector: 'files-icon-view',
    templateUrl: './files-icon-view.component.html',
    encapsulation: ViewEncapsulation.None,
})
export class FilesIconViewComponent implements OnInit {

    @Input()
    directoryContent$: BehaviorSubject<DirectoryContent> = new BehaviorSubject<DirectoryContent>(null);

    ngOnInit() {
        this.directoryContent$.pipe(
            filter(content => content == null),
        ).subscribe(content => {

        });
    }

}
