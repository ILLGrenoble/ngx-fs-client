import { NgModule } from '@angular/core';
import { VisaFileManagerComponent } from './visa-file-manager.component';
import { ToolBarComponent } from './tool-bar';
import { PathBarComponent } from './path-bar';
import { FileIconViewComponent, FilesIconViewComponent } from './files-icon-view';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';

@NgModule({
    declarations: [
        VisaFileManagerComponent,
        ToolBarComponent,
        PathBarComponent,
        FilesIconViewComponent,
        FileIconViewComponent,
    ],
    imports: [
        AsyncPipe,
        NgForOf,
        NgIf,
        MatIconModule,
        MatProgressSpinnerModule,
        MatButtonModule,
    ],
    providers: [],
    exports: [
        VisaFileManagerComponent
    ]
})
export class VisaFileManagerModule {
}
