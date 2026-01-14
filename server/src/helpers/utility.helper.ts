export class UtilityHelper {
  static copy(item) {
    return JSON.parse(JSON.stringify(item));
  }

  static hash(array) {
    const object = {};
    array.forEach((item, i) => {
      object[item.id] = item;
    });
    return object;
  }

  static normalize = (text: string | null): string => {
    if (text) {
      return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    } else {
      return '';
    }
  };

  static unique<T>(array: T[]): T[] {
    return array.filter((value, index, self) => {
      return self.indexOf(value) === index;
    });
  }
}
