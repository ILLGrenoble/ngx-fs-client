import { NgModule } from '@angular/core';
import { NgxFileManagerComponent } from './ngx-file-manager.component';
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
import {DeleteFileDialogComponent, FileDownloadingDialogComponent, FileUploadDialogComponent} from "./dialogs";
import {FormsModule} from "@angular/forms";
import {DndModule} from 'ngx-drag-drop';
import { FileNameReducerPipe } from '../../pipes';

@NgModule({
    declarations: [
        NgxFileManagerComponent,
        ToolBarComponent,
        PathBarComponent,
        FilesIconViewComponent,
        FileIconViewComponent,
        DownloadFileDialogComponent,
        DeleteFileDialogComponent,
        FileDownloadingDialogComponent,
        FileUploadDialogComponent,
        FileNameReducerPipe,
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
        NgxFileManagerComponent
    ]
})
export class NgxFileManagerModule {
}