import { AfterViewInit, Directive, ElementRef, HostBinding, Input, NgZone, Renderer2 } from '@angular/core';

@Directive({
  selector: '[gwtTooltip]',
})
export class GwtTooltipDirective implements AfterViewInit {
  @Input() gwtTooltip: string | null = null;
  /** Delay in ms before showing tooltip */
  @Input() gwtTooltipDelay: number = 200;
  /** Tooltip position: 'top' | 'bottom' | 'left' | 'right' */
  @Input() gwtTooltipPosition: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
  /** Show tooltip on click instead of hover (default: false) */
  @Input() gwtTooltipToggle: boolean = false;
  /** Disable the tooltip */
  @Input() set gwtTooltipDisabled(value: boolean) {
    this._disabled = value;
    if (value && GwtTooltipService.instance?.activeElement === this.host) {
      GwtTooltipService.instance.hide();
    }
  }

  private _disabled = false;

  /** CSS class applied when this element is actively showing a tooltip */
  @HostBinding('class.gwt-tooltip-active') get isActive(): boolean {
    return GwtTooltipService.instance?.activeElement === this.host;
  }

  private showTimer: ReturnType<typeof setTimeout> | null = null;
  private _mouseEnterHandler: (() => void) | null = null;
  private _mouseLeaveHandler: (() => void) | null = null;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    zone: NgZone
  ) {
    // The service is not created by Angular, so it gets the zone from the first directive
    GwtTooltipService.instance.zone ??= zone;
    // Create bound handlers once in constructor so removeEventListener works
    this._mouseEnterHandler = () => this.handleMouseEnter();
    this._mouseLeaveHandler = () => this.handleMouseLeave();
  }

  /** Exposed for the global service to access the host element */
  get host(): Element {
    return this.el.nativeElement;
  }

  ngAfterViewInit(): void {
    const host = this.host;
    // Direct event listeners - simple and reliable
    host.addEventListener('mouseenter', this._mouseEnterHandler!);
    host.addEventListener('mouseleave', this._mouseLeaveHandler!);
    host.addEventListener('click', (e: Event) => this.handleClick(e));
  }

  ngOnDestroy(): void {
    clearTimeout(this.showTimer);
    const host = this.host;
    host.removeEventListener('mouseenter', this._mouseEnterHandler!);
    host.removeEventListener('mouseleave', this._mouseLeaveHandler!);
  }

  /** Called by the global service when mouse enters this element */
  handleMouseEnter(): void {
    if (this._disabled) return; // Don't show if disabled
    if (this.gwtTooltipToggle) return; // click-only mode handled separately
    this.scheduleShow();
  }

  /** Called by the global service when mouse leaves this element */
  handleMouseLeave(): void {
    const service = GwtTooltipService.instance!;
    if (service.toggledElement === this.host) return;
    this.cancelAndHide();
  }

  handleClick(event: Event): void {
    event.stopPropagation();
    if (!this.gwtTooltipToggle) return;
    const service = GwtTooltipService.instance!;
    if (service.toggledElement === this.host) {
      this.hideTooltip();
    } else if (this.gwtTooltip) {
      service.toggledElement = this.host;
      this.showImmediately();
    }
  }

  /** Get the tooltip text for rendering */
  getTooltipText(): string | null {
    return this.gwtTooltip;
  }

  getPosition(): 'top' | 'bottom' | 'left' | 'right' {
    return this.gwtTooltipPosition;
  }

  private scheduleShow(): void {
    clearTimeout(this.showTimer);
    this.showTimer = setTimeout(() => {
      GwtTooltipService.instance?.show(this.host, this.gwtTooltip!, this.getPosition());
    }, this.gwtTooltipDelay);
  }

  private showImmediately(): void {
    if (this.gwtTooltip) {
      GwtTooltipService.instance?.show(this.host, this.gwtTooltip, this.getPosition());
    }
  }

  private cancelAndHide(): void {
    clearTimeout(this.showTimer);
    const service = GwtTooltipService.instance!;
    // Only hide if this element is still active (another element didn't take over)
    if (service.activeElement === this.host && service.toggledElement !== this.host) {
      service.hide();
    }
  }

  private hideTooltip(): void {
    GwtTooltipService.instance?.hide();
  }
}

// ============================================
// GLOBAL TOOLTIP SERVICE — single DOM node
// Manages tooltip display and positioning only
// Events are handled directly by each directive instance
// ============================================

class GwtTooltipService {
  static instance: GwtTooltipService | null = new GwtTooltipService();

  private tooltipEl: HTMLElement | null = null;
  /** The directive element currently showing a tooltip */
  activeElement: Element | null = null;
  /** The element whose tooltip was opened by a click (toggle mode) */
  toggledElement: Element | null = null;
  /** Set by the first directive, used to run the page listeners outside Angular */
  zone: NgZone | null = null;

  private listening = false;

  // ---- Show / Hide ----

  show(host: Element, content: string, position: 'top' | 'bottom' | 'left' | 'right'): void {
    // Another element taking over ends the click-opened state
    if (this.toggledElement !== host) {
      this.toggledElement = null;
    }
    this.activeElement = host;
    this._startListening();
    const el = this._ensureTooltip();
    const html = this._renderContent(content);
    el.innerHTML = `<div class="gwt-tooltip-arrow"></div><div class="gwt-tooltip-body">${html}</div>`;

    // Set position attribute for CSS variants
    el.setAttribute('data-position', position);

    // Use requestAnimationFrame so the element is rendered before measuring/positioning
    requestAnimationFrame(() => {
      if (!el.classList.contains('gwt-tooltip--visible')) {
        el.classList.add('gwt-tooltip--visible');
      }
      this._position(host, el, position);
    });
  }

  hide(): void {
    if (this.tooltipEl?.parentNode) {
      this.tooltipEl.parentNode.removeChild(this.tooltipEl);
    }
    this.tooltipEl = null;
    this.activeElement = null;
    this.toggledElement = null;
    this._stopListening();
  }

  // ---- Page listeners (safety net when mouseleave never comes) ----
  // Only attached while a tooltip is open, and outside Angular so mouse moves don't trigger change detection

  private _startListening(): void {
    if (this.listening) return;
    this.listening = true;
    const add = () => {
      document.addEventListener('pointermove', this._onPointerMove, { passive: true });
      document.addEventListener('pointerdown', this._onPointerDown, true);
      document.addEventListener('scroll', this._onScroll, { capture: true, passive: true });
      document.addEventListener('keydown', this._onKeyDown);
      window.addEventListener('blur', this._onBlur);
    };
    if (this.zone) {
      this.zone.runOutsideAngular(add);
    } else {
      add();
    }
  }

  private _stopListening(): void {
    if (!this.listening) return;
    this.listening = false;
    document.removeEventListener('pointermove', this._onPointerMove);
    document.removeEventListener('pointerdown', this._onPointerDown, true);
    document.removeEventListener('scroll', this._onScroll, true);
    document.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('blur', this._onBlur);
  }

  /** Hover tooltip: hide when its element was removed or the cursor is no longer over it */
  private _onPointerMove = (e: PointerEvent): void => {
    const el = this.activeElement;
    if (!el || this.toggledElement) return;
    if (!el.isConnected || !el.contains(e.target as Node)) {
      this.hide();
    }
  };

  /** Click-opened tooltip: close on a press anywhere outside its element */
  private _onPointerDown = (e: PointerEvent): void => {
    if (this.toggledElement && !this.toggledElement.contains(e.target as Node)) {
      this.hide();
    }
  };

  private _onScroll = (): void => this.hide();

  private _onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      this.hide();
    }
  };

  private _onBlur = (): void => this.hide();

  // ---- Internal helpers ----

  private _ensureTooltip(): HTMLElement {
    if (!this.tooltipEl) {
      this.tooltipEl = document.createElement('div');
      this.tooltipEl.className = 'gwt-tooltip';
      document.body.appendChild(this.tooltipEl);
    }
    return this.tooltipEl;
  }

  private _renderContent(content: string): string {
    return content.replace(/\n/g, '<br/>').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  }

  private _position(host: Element, tip: HTMLElement, position: string): void {
    const hostRect = host.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();
    const gap = 8;

    let top: number, left: number;
    switch (position) {
      case 'top':
        top = hostRect.top - tipRect.height - gap;
        left = hostRect.left + hostRect.width / 2 - tipRect.width / 2;
        break;
      case 'bottom':
        top = hostRect.bottom + gap;
        left = hostRect.left + hostRect.width / 2 - tipRect.width / 2;
        break;
      case 'left':
        top = hostRect.top + hostRect.height / 2 - tipRect.height / 2;
        left = hostRect.left - tipRect.width - gap;
        break;
      case 'right':
        top = hostRect.top + hostRect.height / 2 - tipRect.height / 2;
        left = hostRect.right + gap;
        break;
    }

    // Clamp to viewport
    const clampedLeft = Math.max(4, Math.min(left, window.innerWidth - tipRect.width - 4));
    const clampedTop = Math.max(4, Math.min(top, window.innerHeight - tipRect.height - 4));

    tip.style.top = `${clampedTop}px`;
    tip.style.left = `${clampedLeft}px`;
  }
}
