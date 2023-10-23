import {
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnInit,
    Output,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Component({
    selector: 'path-bar',
    templateUrl: './path-bar.component.html',
    styleUrls: ['./path-bar.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class PathBarComponent {

    private _isPathEdit: boolean = false;
    private _editPath: string;

    @ViewChild('pathInput')
    pathInput: ElementRef;

    @Input()
    path: string;

    @Output()
    pathChange = new EventEmitter<string>;


    get isPathEdit(): boolean {
        return this._isPathEdit;
    }

    get editPath(): string {
        return this._editPath;
    }

    set editPath(value: string) {
        this._editPath = value;
    }

    onClicked(): void {
        if (!this._isPathEdit) {
            this._isPathEdit = true;
            this.editPath = this.path;

            setTimeout(() => {

                const inputElem = <HTMLInputElement>this.pathInput.nativeElement;
                inputElem.select();
            }, 10);
        }
    }

    updatePath(): void {
        this._isPathEdit = false;
        if (!this._editPath.startsWith('/')) {
            this._editPath = `/${this._editPath}`;
        }
        this.pathChange.emit(this._editPath);
    }

    cancelPathChange(): void {
        this._isPathEdit = false;
    }

}
