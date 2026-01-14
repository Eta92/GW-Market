import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';

export interface CanvasRefs {
  canvasMouseDown: (x: number, y: number) => void;
  canvasMouseUp: (x: number, y: number) => void;
  canvasMouseMove: (x: number, y: number) => void;
  canvasMouseWheel: (x: boolean) => void;
  canvasMouseHover: (b: boolean, x: number, y: number) => void;
  canvasKeyDown: (key: string) => void;
  canvasKeyUp: (key: string) => void;
  canvasMouseIn: (x: number, y: number) => void;
  canvasMouseOut: () => void;
  canvasResize: (width: number, height: number) => void;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
}

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss'],
})
export class CanvasComponent implements AfterViewInit {
  @Input() rounded?: boolean;
  @ViewChild('mycanvas') canvasRef: ElementRef<HTMLCanvasElement>;
  public refs: CanvasRefs;
  public html: HTMLCanvasElement;
  @Output() setupCanvasListeners = new EventEmitter<CanvasRefs>();
  public width = null;
  public height = null;
  public moveId = null;

  constructor() {}

  ngAfterViewInit(): void {
    this.InitRefs();
    this.InitCanvas();
    this.InitListeners();
    this.setupCanvasListeners.emit(this.refs);
  }

  InitRefs(): void {
    this.refs = {
      canvasMouseDown: (x: number, y: number) => {},
      canvasMouseUp: (x: number, y: number) => {},
      canvasMouseMove: (x: number, y: number) => {},
      canvasMouseWheel: (x: boolean) => {},
      canvasMouseHover: (b: boolean, x: number, y: number) => {},
      canvasKeyDown: (k: string) => {},
      canvasKeyUp: (k: string) => {},
      canvasMouseIn: (x: number, y: number) => {},
      canvasMouseOut: () => {},
      canvasResize: (width: number, height: number) => {},
      ctx: null,
      width: 0,
      height: 0,
    } as CanvasRefs;
  }

  InitCanvas(): void {
    this.html = this.canvasRef.nativeElement;
    this.refs.ctx = this.html.getContext('2d');
    this.Resize();
    this.refs.width = this.width;
    this.refs.height = this.height;
    this.moveId = 0;
    // console.log('My canvas generated with resolution ' + this.width + 'x' + this.height);
  }

  Resize(): void {
    this.width = parseInt('' + this.html.clientWidth, 10);
    this.height = parseInt('' + this.html.clientHeight, 10);
    this.html.width = this.width;
    this.html.height = this.height;
  }

  TriggerHover(moveId: number, evtx: number, evty: number): void {
    if (this.moveId === moveId) {
      this.refs.canvasMouseHover(true, evtx, evty);
    }
  }

  InitListeners(): void {
    this.html.addEventListener('mousedown', (evt) => {
      this.refs.canvasMouseDown(evt.offsetX, evt.offsetY);
    });
    this.html.addEventListener('mouseup', (evt) => {
      this.refs.canvasMouseUp(evt.offsetX, evt.offsetY);
    });
    this.html.addEventListener('mousemove', (evt) => {
      this.refs.canvasMouseMove(evt.offsetX, evt.offsetY);
      // manage hovering from here
      this.moveId++;
      setTimeout(this.TriggerHover, 500, this.moveId, evt.offsetX, evt.offsetY);
      this.refs.canvasMouseHover(false, 0, 0);
    });
    this.html.addEventListener('wheel', (evt) => {
      this.refs.canvasMouseWheel(evt.deltaY < 0);
    });
    window.addEventListener('keydown', (evt) => {
      this.refs.canvasKeyDown(evt.key);
    });
    window.addEventListener('keyup', (evt) => {
      this.refs.canvasKeyUp(evt.key);
    });
    this.html.addEventListener('mouseover', (evt) => {
      this.refs.canvasMouseIn(evt.offsetX, evt.offsetY);
    });
    this.html.addEventListener('mouseout', () => {
      this.refs.canvasMouseOut();
    });
    window.addEventListener('resize', () => {
      this.Resize();
      this.refs.canvasResize(this.width, this.height);
    });
  }
}
