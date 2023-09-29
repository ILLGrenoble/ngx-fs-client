import { Component, Input, ViewEncapsulation } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Component({
    selector: 'path-bar',
    templateUrl: './path-bar.component.html',
    encapsulation: ViewEncapsulation.None,
})
export class PathBarComponent {

    @Input()
    path$: Observable<string>;
}
