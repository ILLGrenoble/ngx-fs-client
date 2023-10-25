export class NgxFileSysContext {
    basePath: string = '';
    accessToken?: string;

    constructor(data: Partial<NgxFileSysContext>) {
        Object.assign(this, data);
    }
}
