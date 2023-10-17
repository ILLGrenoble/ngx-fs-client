import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LinkedPath } from '../../../models/linked-path.model';

@Component({
    selector: 'tool-bar',
    templateUrl: './tool-bar.component.html',
    styleUrls: ['./tool-bar.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class ToolBarComponent {

    get linkedPath(): LinkedPath {
        return this._linkedPath;
    }

    @Input()
    set linkedPath(linkedPath: LinkedPath) {
        this._linkedPath = linkedPath;
        const path = linkedPath.name;
        let basename = path.split('/').pop();
        if (basename === ''){
            basename = 'Home';
        }
        this._basename = basename;
    }

    @Output()
    linkedPathChange = new EventEmitter<LinkedPath>();

    private _linkedPath: LinkedPath;
    private _basename = '';

    get basename(): string {
        return this._basename;
    }

    onBackClick(): void {
        if (this._linkedPath.previous) {
            this.linkedPathChange.emit(this.linkedPath.previous);
        }
    }

    onForwardClick(): void {
        if (this._linkedPath.next) {
            this.linkedPathChange.emit(this.linkedPath.next);
        }
    }

}
