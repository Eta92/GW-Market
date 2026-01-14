export class SelectHelper {
  private static translate = /translate3d\((?<x>.*?)px, (?<y>.*?)px, (?<z>.*?)px/;

  public static getDefaultPosition(): SelectPosition {
    return {
      top: 0,
      left: 0,
      height: 0,
      width: 0
    };
  }

  public static getScreenPosition(element: HTMLElement): SelectPosition {
    // missing horizontal scroll but almost never needed
    if (element) {
      return {
        top: this.getTotalTop(element) - this.getTotalScroll(element),
        left: this.getTotalLeft(element),
        height: element.offsetHeight,
        width: element.offsetWidth
      };
    } else {
      return this.getDefaultPosition();
    }
  }

  public static getSelectPosition(element: HTMLElement, maxSize: number): SelectPosition {
    const position = {
      top: 0,
      left: 0,
      height: 0,
      width: 0
    };
    // top height
    const scroll = this.getTotalScroll(element);
    const top = this.getTotalTop(element);
    const defaultTop = element.offsetHeight + top - scroll;
    // switch between top and bottom
    if (defaultTop / window.innerHeight < 1 / 2 || true) {
      // hotfix consider alway at the top
      const availableSpace = window.innerHeight - defaultTop;
      if (availableSpace > maxSize) {
        position.top = defaultTop;
        position.height = maxSize;
      } else {
        position.top = defaultTop;
        position.height = availableSpace;
      }
    } else {
      const availableSpace = top - scroll;
      if (availableSpace > maxSize) {
        position.top = availableSpace - maxSize;
        position.height = maxSize;
      } else {
        position.top = 0;
        position.height = availableSpace;
      }
    }
    // left width
    position.left = this.getTotalLeft(element);
    position.width = element.offsetWidth;
    return position;
  }

  private static getTotalScroll(element: HTMLElement): number {
    let div = element;
    let scroll = 0;
    do {
      scroll += div.scrollTop;
      div = div.parentElement as HTMLElement;
    } while (div?.parentElement);
    return scroll;
  }

  private static getTotalLeft(element: HTMLElement): number {
    let div = element;
    let left = 0;
    do {
      left += div.offsetLeft + div.clientLeft;
      if (div.style.transform) {
        const exec = this.translate.exec(div.style.transform);
        left += +exec.groups.x;
      }
      div = div.offsetParent as HTMLElement;
    } while (div?.offsetParent);
    return left + (window.innerWidth - div.clientWidth) / 2;
  }

  private static getTotalTop(element: HTMLElement): number {
    let div = element;
    let top = 0;
    do {
      top += div.offsetTop + div.clientTop;
      if (div.style.transform) {
        const exec = this.translate.exec(div.style.transform);
        top += +exec.groups.y;
      }
      div = div.offsetParent as HTMLElement;
    } while (div?.offsetParent);
    return top + (window.innerHeight - div.clientHeight) / 2;
  }
}

export class SelectPosition {
  top: number;
  left: number;
  height: number;
  width: number;
  offset?: number;
}
