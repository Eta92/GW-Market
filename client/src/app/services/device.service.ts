import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DeviceService {
  isMobile(): boolean {
    // Check if running on a mobile device or touch-based interface
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

    // Mobile detection patterns
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|tablet/i.test(userAgent);
  }

  isTouchDevice(): boolean {
    // Check if device supports touch events
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }
}
