import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Component({
    selector: 'path-bar',
    templateUrl: './path-bar.component.html',
    styleUrls: ['./path-bar.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class PathBarComponent {

    @Input()
    path: string;

}
