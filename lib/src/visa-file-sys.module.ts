import { ModuleWithProviders, NgModule } from '@angular/core';
import { VisaFileSystemService } from './services';
import { VisaFileManagerModule } from './components';
import { VisaFileSysConfiguration } from './models';


@NgModule({
    declarations: [],
    imports: [
        VisaFileManagerModule,
    ],
    exports: [
        VisaFileManagerModule
    ]
})
export class VisaFileSysModule {

    static forRoot(configuration: VisaFileSysConfiguration): ModuleWithProviders<VisaFileSysModule> {
        return {
            ngModule: VisaFileSysModule,
            providers: [VisaFileSystemService, {provide: 'config', useValue: configuration}],
        };
    }
}
