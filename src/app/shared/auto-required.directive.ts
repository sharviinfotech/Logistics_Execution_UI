import { Directive, ElementRef, OnInit } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[formControlName]'
})
export class AutoRequiredDirective implements OnInit {
  constructor(private el: ElementRef, private control: NgControl) {}

  ngOnInit() {
    const control = this.control.control;

    if (control && control.validator) {
      const validationResult = control.validator({} as any);

      console.log('Directive initialized for:', this.el.nativeElement, validationResult); // 👈 check this log

      if (validationResult && validationResult['required']) {
        this.el.nativeElement.setAttribute('required', '');
        console.log('✅ Added required to:', this.el.nativeElement);
      }
    }
  }
}
