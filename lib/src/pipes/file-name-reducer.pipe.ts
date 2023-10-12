import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'fileNameReducer'})
export class FileNameReducerPipe implements PipeTransform {

    public transform(fileName: string, maxLength: number): string {
        if (fileName.length > maxLength) {
            const len = fileName.length;
            const end = fileName.substring(len - 8);
            const start = fileName.substring(0, maxLength - 11);
            return  `${start}...${end}`;

        } else {
            return fileName;
        }
    }
}
