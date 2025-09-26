import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ScrollspyDirective } from './scrollspy.directive'
import { RouterModule } from '@angular/router';

@NgModule({
    declarations: [ScrollspyDirective],
    imports: [
        CommonModule,
        RouterModule 
    ],
    exports: [ScrollspyDirective]
})
export class SharedModule { }
