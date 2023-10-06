import {HttpClient, HttpEvent, HttpEventType, HttpRequest} from '@angular/common/http';
import {Inject, Injectable} from '@angular/core';
import {concatMap, EMPTY, filter, Observable, of, throwError} from 'rxjs';
import {DirectoryContent, FileContent, VisaFileSysConfiguration} from '../models';

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

    public downloadFileWithProgress(path: string): Observable<{progress: number, fileContent?: FileContent}> {
        const uriEncodedPath = encodeURI(path);
        const apiPath = `${this._config.basePath}/api/files/${uriEncodedPath}`;

        const req = new HttpRequest('GET', apiPath, null, {
            reportProgress: true
        });

        let currentProgress = 0;
        return this._http.request(req).pipe(
            concatMap(event => {
                if (event.type === HttpEventType.DownloadProgress) {
                    currentProgress = Math.round(100 * event.loaded / event.total);
                    return of({progress: currentProgress})

                } else if (event.type === HttpEventType.Response) {
                    const data = event.body as FileContent | DirectoryContent
                    if (data.stats.type !== 'file') {
                        return throwError(() => new Error(`Path is not a file`));
                    } else {
                        return of({progress: 100, fileContent: data as FileContent});
                    }

                } else {
                    return EMPTY;
                }
            })
        );
    }
}
