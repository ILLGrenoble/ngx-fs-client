import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Component({
    selector: 'path-bar',
    templateUrl: './path-bar.component.html',
    styleUrls: ['./path-bar.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class PathBarComponent implements OnInit {

    @Input()
    path$: Observable<string>;

    private _path: string;

    get path(): string {
        return this._path;
    }

    ngOnInit() {
        this.path$.subscribe(path => {
            if (!path.startsWith('/')) {
                path = `/${path}`;
            }
            this._path = path;
        });
    }
}
