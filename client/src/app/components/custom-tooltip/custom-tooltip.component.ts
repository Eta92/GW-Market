import { ChangeDetectorRef, Component, ElementRef, Input } from '@angular/core';
import { PositionHelper } from '@core/helpers/position.helper';

/* Usage: when the component is declare he must have a fixed position (<app-custom-tooltip class="fixed">) and his visibility must be
   handle in the component where is called
   Default values: text color white, background dark grey background, tooltip 10rem wide and the cross center on the right */
@Component({
  selector: 'app-custom-tooltip',
  templateUrl: './custom-tooltip.component.html',
  styleUrls: ['./custom-tooltip.component.scss']
})
export class CustomeTooltipComponent {
  @Input() text: string;
  @Input() texts: Array<string>;
  @Input() textSize: string;
  @Input() textColor: string;

  @Input() backgroundColor: string;

  @Input() width?: number; // in rem

  // vertical is not yet implemented
  @Input() popout: 'horizontal' | 'vertical';

  public containerStyle = {
    top: 'unset',
    bottom: 'unset',
    left: 'unset',
    right: 'unset',
    rotation: '0deg'
  };

  public arrowStyle = {
    top: 'unset',
    bottom: 'unset',
    left: 'unset',
    right: 'unset',
    rotation: '0deg'
  };

  constructor(
    private hostRef: ElementRef,
    private cdr: ChangeDetectorRef
  ) {
    setTimeout(() => {
      const position = PositionHelper.getScreenPosition(this.hostRef.nativeElement.parentElement);
      if (this.popout === 'horizontal') {
        if (position.left + position.width / 2 > window.innerWidth / 2) {
          this.containerStyle.right = '6px';
          this.arrowStyle.right = '-10px';
          this.arrowStyle.rotation = '-90deg';
        } else {
          this.containerStyle.left = position.width + 6 + 'px';
          this.arrowStyle.left = '-10px';
          this.arrowStyle.rotation = '90deg';
        }
        this.containerStyle.top = (position.height - this.ownHeight()) / 2 + 'px';
        this.arrowStyle.top = 'calc(50% - 5px)';
      }
      if (this.popout === 'vertical') {
        if (position.top + position.height / 2 > window.innerHeight / 2) {
          this.containerStyle.bottom = '6px';
          this.arrowStyle.bottom = '-10px';
          this.arrowStyle.rotation = '0deg';
        } else {
          this.containerStyle.top = position.height + 6 + 'px';
          this.arrowStyle.top = '-10px';
          this.arrowStyle.rotation = '180deg';
        }
        // TODO reporduce max for each sides
        this.containerStyle.left =
          Math.min((position.width - this.ownWidth()) / 2, window.innerWidth - position.left - this.ownWidth()) + 'px';
        // TODO adjust arrow in case of max use
        this.arrowStyle.left = 'calc(50% - 5px)';
      }
      this.cdr.detectChanges();
    }, 500);
  }

  private ownWidth(): number {
    return this.hostRef.nativeElement.firstChild.firstChild.offsetWidth;
  }

  private ownHeight(): number {
    return this.hostRef.nativeElement.firstChild.firstChild.offsetHeight;
  }
}
