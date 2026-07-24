import { Directive, OnDestroy, OnInit } from '@angular/core';

@Directive({
  selector: '[appScrollLock]',
  standalone: true
})
export class ScrollLockDirective implements OnInit, OnDestroy {
  ngOnInit() {
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy() {
    document.body.style.overflow = '';
  }
}
