import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'datePipe'
})
export class DatePipe implements PipeTransform {
  transform(timestamp: number): string {
    const date = new Date(timestamp).toISOString();
    return date.substring(0, 10).split('-').reverse().join('/');
  }
}

@Pipe({
  name: 'timePipe'
})
export class TimePipe implements PipeTransform {
  transform(timestamp: number): string {
    const date = new Date(timestamp).toISOString();
    return date.substring(11, 19);
  }
}

@Pipe({
  name: 'enumToArray'
})
export class EnumToArrayPipe implements PipeTransform {
  transform(data: object): Array<string> {
    if (!data) {
      return null;
    }
    const array = [];
    const keys = Object.keys(data);
    for (let k = 0; k < keys.length; k++) {
      array.push(data[keys[k]]);
    }
    return array;
  }
}

@Pipe({
  name: 'enumToKeyValue'
})
export class EnumToKeyValuePipe implements PipeTransform {
  transform(data: object): Array<string> {
    if (!data) {
      return null;
    }
    const array = [];
    const keys = Object.keys(data);
    for (const key of keys) {
      array.push({ key: key, value: data[key] });
    }
    return array;
  }
}
