import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { ToastrService } from 'ngx-toastr';

@Injectable()
export class ToasterService {
  constructor(
    private toastrService: ToastrService,
    private socket: Socket
  ) {}

  toasterInit(): void {
    this.socket.on('ToasterInfo', (message: string) => {
      this.toastrService.info(message, '', {
        timeOut: 2000
      });
    });
    this.socket.on('ToasterSuccess', (message: string) => {
      this.toastrService.success(message, '', {
        timeOut: 5000
      });
    });
    this.socket.on('ToasterError', (message: string) => {
      this.toastrService.error(message, '', {
        timeOut: 10000
      });
    });
    this.socket.on('ToasterWarning', (message: string) => {
      this.toastrService.warning(message, '', {
        timeOut: 2000
      });
    });
  }
}
