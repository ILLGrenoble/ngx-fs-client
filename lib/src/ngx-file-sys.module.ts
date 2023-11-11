import { NgModule } from '@angular/core';
import { NgxFileSystemServiceFactory } from './services';
import {FileNameReducerPipe, FileSizePipe} from './pipes';
import {AsyncPipe, DatePipe, NgClass, NgForOf, NgIf} from '@angular/common';
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
    FilesIconViewComponent, FilesListViewComponent, FileUploadDialogComponent,
    NgxFileManagerComponent,
    PathBarComponent,
    ToolBarComponent
} from './components';
import {HttpClientModule} from "@angular/common/http";
import {MatTableModule} from "@angular/material/table";
import {MatSortModule} from "@angular/material/sort";

@NgModule({
    declarations: [
        NgxFileManagerComponent,
        ToolBarComponent,
        PathBarComponent,
        FilesIconViewComponent,
        FilesListViewComponent,
        FileIconViewComponent,
        DownloadFileDialogComponent,
        DeleteFileDialogComponent,
        FileDownloadingDialogComponent,
        FileUploadDialogComponent,
        FileNameReducerPipe,
        FileSizePipe,
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
        MatTableModule,
        MatSortModule,
        FormsModule,
        DndModule,
        DatePipe,
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
