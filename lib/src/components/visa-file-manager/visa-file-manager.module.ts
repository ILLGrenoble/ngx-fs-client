import { NgModule } from '@angular/core';
import { VisaFileManagerComponent } from './visa-file-manager.component';
import { ToolBarComponent } from './tool-bar';
import { PathBarComponent } from './path-bar';
import {
    DownloadFileDialogComponent,
    FileIconViewComponent,
    FilesIconViewComponent
} from './files-icon-view';
import {AsyncPipe, NgClass, NgForOf, NgIf} from '@angular/common';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatDialogModule} from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatMenuModule} from '@angular/material/menu';
import {DeleteFileDialogComponent, FileDownloadingDialogComponent} from "./dialogs";
import {FormsModule} from "@angular/forms";
import {DndModule} from 'ngx-drag-drop';

@NgModule({
    declarations: [
        VisaFileManagerComponent,
        ToolBarComponent,
        PathBarComponent,
        FilesIconViewComponent,
        FileIconViewComponent,
        DownloadFileDialogComponent,
        DeleteFileDialogComponent,
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
        MatMenuModule,
        FormsModule,
        DndModule,
    ],
    providers: [],
    exports: [
        VisaFileManagerComponent
    ]
})
export class VisaFileManagerModule {
}
