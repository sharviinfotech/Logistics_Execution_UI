import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ScrollspyDirective } from './scrollspy.directive'
import { RouterModule } from '@angular/router';
import { AutoRequiredDirective } from 'src/app/shared/auto-required.directive';

@NgModule({
    declarations: [ScrollspyDirective,AutoRequiredDirective],
    imports: [
        CommonModule,
        RouterModule 
    ],
    exports: [ScrollspyDirective,AutoRequiredDirective]
})
export class SharedModule { }
