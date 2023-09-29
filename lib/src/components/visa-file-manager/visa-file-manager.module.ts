import { NgModule } from '@angular/core';
import { VisaFileManagerComponent } from './visa-file-manager.component';
import { ToolBarComponent } from './tool-bar';
import { PathBarComponent } from './path-bar';
import { FilesIconViewComponent } from './files-icon-view';
import { AsyncPipe } from '@angular/common';


@NgModule({
    declarations: [
        VisaFileManagerComponent,
        ToolBarComponent,
        PathBarComponent,
        FilesIconViewComponent
    ],
    imports: [
        AsyncPipe
    ],
    providers: [],
    exports: [
        VisaFileManagerComponent
    ]
})
export class VisaFileManagerModule {
}
