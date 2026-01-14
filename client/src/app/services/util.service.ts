import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable, of } from 'rxjs';
import { CurrentSubject } from '../helpers/current.subject';
import { Router } from '@angular/router';
import { debounceTime } from 'rxjs/operators';
import { ToasterService } from './toaster.service';

@Injectable()
export class UtilService {
  init = false;
  ready = false;
  redirect = false;
  readySubject = new CurrentSubject<boolean>();

  constructor(
    private router: Router,
    private socket: Socket,
    private toasterService: ToasterService
  ) {}

  start(): void {
    if (!this.init) {
      this.socketInit();
      this.toasterService.toasterInit();
      this.socket.emit('SocketStarted');
      this.init = true;
    }
  }

  socketInit(): void {
    this.socket.on('ClientRedirect', (url: string[]) => {
      this.router.navigate(url);
    });
    this.socket.on('ClientLog', message => {
      console.log(message);
      this.setReady();
    });
    this.socket.on('ClientAlert', message => {
      alert(message);
    });
    this.socket.on('ClientInit', () => {
      this.setReady();
    });
  }

  setReady(): void {
    this.ready = true;
    this.readySubject.set(true);
  }

  getReady(): Observable<boolean> {
    if (this.ready) {
      return of(true);
    } else {
      return this.readySubject.asObservable().pipe(debounceTime(0));
    }
  }
}
