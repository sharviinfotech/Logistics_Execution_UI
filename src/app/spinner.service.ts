import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type SpinnerStatus = 'loading' | 'success' | 'error';
export type TruckDirection = 'center' | 'right' | 'left';

@Injectable({ providedIn: 'root' })
export class SpinnerService {
  private spinnerSubject = new BehaviorSubject<boolean>(false);
  spinner$ = this.spinnerSubject.asObservable();

  private statusSubject = new BehaviorSubject<SpinnerStatus>('loading');
  status$ = this.statusSubject.asObservable();

  private directionSubject = new BehaviorSubject<TruckDirection>('center');
  direction$ = this.directionSubject.asObservable();

  show(status: SpinnerStatus = 'loading', direction: TruckDirection = 'center') {
    this.statusSubject.next(status);
    this.directionSubject.next(direction);
    this.spinnerSubject.next(true);
  }

  hide() {
    this.spinnerSubject.next(false);
    this.statusSubject.next('loading');
    this.directionSubject.next('center');
  }
}
