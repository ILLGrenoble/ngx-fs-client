import { Component, Input, ViewEncapsulation } from '@angular/core';
import { FileStats } from '../../../../models';
import { Subject } from 'rxjs';

@Component({
    selector: 'file-icon-view',
    templateUrl: './file-icon-view.component.html',
    styleUrls: ['./file-icon-view.component.scss'],
})
export class FileIconViewComponent {

    @Input()
    fileStats: FileStats;

    @Input()
    fileDoubleClickedListener$: Subject<FileStats>;

    onDoubleClicked(): void {
        this.fileDoubleClickedListener$.next(this.fileStats);
    }

}
