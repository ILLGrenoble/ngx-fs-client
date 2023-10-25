import { HttpClient, HttpEvent, HttpEventType, HttpHeaders, HttpRequest } from '@angular/common/http';
import {Inject, Injectable} from '@angular/core';
import {catchError, concatMap, EMPTY, map, Observable, of, throwError} from 'rxjs';
import {
    DirectoryContent, DownloadProgress,
    FileContent,
    FileStats,
    UploadData,
    UploadProgress,
} from '../models';
import { NgxFileSysConfiguration } from '../ngx-file-sys.configuration';

@Injectable({
    providedIn: 'root'
})
class NgxFileSystemHttpClient {

    private readonly _headers: HttpHeaders;

    constructor(@Inject('config') private _config: NgxFileSysConfiguration,
                private _http: HttpClient) {
        if (this._config.accessToken) {
            this._headers = new HttpHeaders().set('x-auth-token', this._config.accessToken);
        }
    }

    get<T>(path: string): Observable<T> {
        return this._http.get<T>(path, {headers: this._headers});
    }

    post<T>(path: string, body: any): Observable<T> {
        return this._http.post<T>(path, body, {headers: this._headers});
    }

    put<T>(path: string, body: any): Observable<T> {
        return this._http.put<T>(path, body, {headers: this._headers});
    }

    patch<T>(path: string, body: any): Observable<T> {
        return this._http.patch<T>(path, body, {headers: this._headers});
    }

    delete<T>(path: string): Observable<T> {
        return this._http.delete<T>(path, {headers: this._headers});
    }

    request<T>(req: HttpRequest<any>): Observable<HttpEvent<T>> {
        const request = new HttpRequest(req.method, req.url, req.body, {
            reportProgress: req.reportProgress,
            headers: this._headers
        })

        return this._http.request<T>(request);
    }
}

@Injectable({
    providedIn: 'root'
})
export class NgxFileSystemService {

    constructor(@Inject('config') private _config: NgxFileSysConfiguration,
                private _http: NgxFileSystemHttpClient) {
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

    public downloadFileWithProgress(path: string): Observable<DownloadProgress> {
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

    public moveFile(sourcePath: string, targetPath: string): Observable<FileStats> {
        const uriEncodedPath = encodeURI(sourcePath);
        const apiPath = `${this._config.basePath}/api/files${uriEncodedPath}`;

        const data = {
            path: targetPath
        }

        return this._http.patch<FileStats>(apiPath, data);
    }

    public deleteFileOrFolder(fileStats: FileStats): Observable<boolean> {
        const uriEncodedPath = encodeURI(fileStats.path);
        const apiPath = `${this._config.basePath}/api/files${uriEncodedPath}`;

        return this._http.delete(apiPath).pipe(
            map(() => true),
            catchError((error) => {
                console.log(error.error);
                return of(false);
            })
        );
    }

    public copyFile(sourcePath: string, targetPath: string): Observable<FileStats> {
        const uriEncodedPath = encodeURI(sourcePath);
        const apiPath = `${this._config.basePath}/api/files${uriEncodedPath}`;

        const data = {
            action: 'COPY_TO',
            path: targetPath,
        }

        return this._http.put<FileStats>(apiPath, data);
    }

    public newFile(path: string): Observable<FileStats> {
        const uriEncodedPath = encodeURI(path);
        const apiPath = `${this._config.basePath}/api/files${uriEncodedPath}`;

        const data = {
            action: 'NEW_FILE'
        }

        return this._http.put<FileStats>(apiPath, data);
    }

    public newFolder(path: string): Observable<FileStats> {
        const uriEncodedPath = encodeURI(path);
        const apiPath = `${this._config.basePath}/api/files${uriEncodedPath}`;

        const data = {
            action: 'NEW_FOLDER'
        }

        return this._http.put<FileStats>(apiPath, data);
    }

    public uploadFile(path: string, data: UploadData): Observable<FileStats> {
        const uriEncodedPath = encodeURI(path);
        const apiPath = `${this._config.basePath}/api/files${uriEncodedPath}`;

        return this._http.post<FileStats>(apiPath, data);
    }

    public uploadFileWithProgress(path: string, data: UploadData): Observable<UploadProgress> {
        const uriEncodedPath = encodeURI(path);
        const apiPath = `${this._config.basePath}/api/files/${uriEncodedPath}`;

        const req = new HttpRequest('POST', apiPath, data, {
            reportProgress: true
        });

        let currentProgress = 0;
        return this._http.request(req).pipe(
            concatMap(event => {
                if (event.type === HttpEventType.UploadProgress) {
                    currentProgress = Math.round(100 * event.loaded / event.total);
                    return of({progress: currentProgress})

                } else if (event.type === HttpEventType.Response) {
                    const data = event.body as FileStats;
                    return of({progress: 100, fileStats: data});

                } else {
                    return EMPTY;
                }
            })
        );
    }

}
