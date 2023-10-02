import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';

@Component({
    selector: 'tool-bar',
    templateUrl: './tool-bar.component.html',
    styleUrls: ['./tool-bar.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class ToolBarComponent implements OnInit {

    @Input()
    path$: Observable<string>;

    private _basename$: BehaviorSubject<string> = new BehaviorSubject<string>('');

    get basename$(): BehaviorSubject<string> {
        return this._basename$;
    }

    ngOnInit() {
        this.path$.subscribe(path => {
            let basename = path.split('/').pop();
            if (basename === ''){
                basename = 'Home';
            }
            this._basename$.next(basename);
        });
    }

}
