import { ModuleWithProviders, NgModule } from '@angular/core';
import { NgxFileSystemService } from './services';
import { NgxFileManagerModule } from './components';
import { NgxFileSysConfiguration } from './ngx-file-sys.configuration';

@NgModule({
    declarations: [],
    imports: [
        NgxFileManagerModule,
    ],
    exports: [
        NgxFileManagerModule
    ]
})
export class NgxFileSysModule {

    static forRoot(configuration: NgxFileSysConfiguration): ModuleWithProviders<NgxFileSysModule> {
        return {
            ngModule: NgxFileSysModule,
            providers: [NgxFileSystemService, {provide: 'config', useValue: configuration}],
        };
    }
}
