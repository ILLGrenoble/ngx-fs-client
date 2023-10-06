import { NgModule } from '@angular/core';
import { VisaFileManagerComponent } from './visa-file-manager.component';
import { ToolBarComponent } from './tool-bar';
import { PathBarComponent } from './path-bar';
import {DownloadFileDialogComponent, FileIconViewComponent, FilesIconViewComponent} from './files-icon-view';
import {AsyncPipe, NgClass, NgForOf, NgIf} from '@angular/common';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {FileDownloadingDialogComponent} from "./dialogs";

@NgModule({
    declarations: [
        VisaFileManagerComponent,
        ToolBarComponent,
        PathBarComponent,
        FilesIconViewComponent,
        FileIconViewComponent,
        DownloadFileDialogComponent,
        FileDownloadingDialogComponent,
    ],
    imports: [
        AsyncPipe,
        NgForOf,
        NgIf,
        NgClass,
        MatIconModule,
        MatProgressSpinnerModule,
        MatButtonModule,
        MatDialogModule,
        MatInputModule,
        MatProgressBarModule,
    ],
    providers: [],
    exports: [
        VisaFileManagerComponent
    ]
})
export class VisaFileManagerModule {
}
