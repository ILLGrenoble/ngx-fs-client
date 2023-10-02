export class LinkedPath {
    name: string;
    previous?: LinkedPath;
    next?: LinkedPath;

    constructor(data?: Partial<LinkedPath>) {
        Object.assign(this, data);
    }
}
