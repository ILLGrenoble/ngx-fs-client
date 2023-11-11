import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'fileSize'})
export class FileSizePipe implements PipeTransform {

    private units = [
        'bytes',
        'KB',
        'MB',
        'GB',
        'TB',
        'PB',
    ];

    public transform(bytes: number = 0, precision: number = 2): string {
        if (isNaN(parseFloat(String(bytes))) || !isFinite(bytes)) {
            return '?';
        }

        let unit = 0;

        if (bytes === 0) {
            return '0 bytes';
        } else if (bytes === 1) {
            return '1 byte';
        } else {
            while (bytes >= 1024) {
                bytes /= 1024;
                unit++;
            }
            let result = bytes.toFixed(+precision);
            if (result.endsWith('.0')) {
                result = result.substring(0, result.length -2);
            }
            return result + ' ' + this.units[unit];
        }
    }
}
