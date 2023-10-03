import {HttpClient, HttpParams} from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { concatMap, map, Observable, of, throwError } from 'rxjs';
import { DirectoryContent, FileContent, VisaFileSysConfiguration } from '../models';

@Injectable({
    providedIn: 'root'
})
export class VisaFileSystemService {

    constructor(@Inject('config') private _config: VisaFileSysConfiguration,
                private _http: HttpClient) {
    }

    public getDirectoryContent(path: string): Observable<DirectoryContent> {
        const uriEncodedPath = encodeURI(path);
        const apiPath = `${this._config.basePath}/api/files/${uriEncodedPath}`;
        return this._http.get<FileContent | DirectoryContent>(apiPath).pipe(
            concatMap(data => {
                if (data.stats.type === 'file') {
                    return throwError(() => new Error(`Path is not a directory`));
                } else {
                    return of(data as DirectoryContent);
                }
            })
        );
    }

    public downloadFile(path: string): Observable<FileContent> {
        const uriEncodedPath = encodeURI(path);
        const apiPath = `${this._config.basePath}/api/files/${uriEncodedPath}`;
        return this._http.get<FileContent | DirectoryContent>(apiPath).pipe(
            concatMap(data => {
                if (data.stats.type !== 'file') {
                    return throwError(() => new Error(`Path is not a file`));
                } else {
                    return of(data as FileContent);
                }
            })
        );
    }
}
