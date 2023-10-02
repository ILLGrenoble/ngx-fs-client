import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LinkedPath } from '../../../models/linked-path.model';

@Component({
    selector: 'tool-bar',
    templateUrl: './tool-bar.component.html',
    styleUrls: ['./tool-bar.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class ToolBarComponent implements OnInit {

    @Input()
    linkedPath$: BehaviorSubject<LinkedPath>;

    private _basename$: BehaviorSubject<string> = new BehaviorSubject<string>('');

    get basename$(): BehaviorSubject<string> {
        return this._basename$;
    }

    ngOnInit() {
        this.linkedPath$.subscribe(linkedPath => {
            const path = linkedPath.name;
            let basename = path.split('/').pop();
            if (basename === ''){
                basename = 'Home';
            }
            this._basename$.next(basename);
        });
    }

    onBackClick(): void {
        if (this.linkedPath$.getValue().previous) {
            this.linkedPath$.next(this.linkedPath$.getValue().previous)
        }
    }

    onForwardClick(): void {
        if (this.linkedPath$.getValue().next) {
            this.linkedPath$.next(this.linkedPath$.getValue().next)
        }
    }

}
