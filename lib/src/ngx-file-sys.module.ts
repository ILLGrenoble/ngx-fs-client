import { NgModule } from '@angular/core';
import { NgxFileSystemServiceFactory } from './services';
import { FileNameReducerPipe } from './pipes';
import { AsyncPipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { DndModule } from 'ngx-drag-drop';
import {
    DeleteFileDialogComponent,
    DownloadFileDialogComponent, FileDownloadingDialogComponent,
    FileIconViewComponent,
    FilesIconViewComponent, FileUploadDialogComponent,
    NgxFileManagerComponent,
    PathBarComponent,
    ToolBarComponent
} from './components';
import {HttpClientModule} from "@angular/common/http";

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
        HttpClientModule,
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
    exports: [
        NgxFileManagerComponent,
    ],
    providers: [
        NgxFileSystemServiceFactory
    ]
})
export class NgxFileSysModule {
}
