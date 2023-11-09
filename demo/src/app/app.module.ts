import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { NgxFileSysModule } from 'lib';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'

@NgModule({
    declarations: [
        AppComponent,
    ],
    imports: [
        BrowserModule,
        NgxFileSysModule,
        BrowserAnimationsModule,
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
