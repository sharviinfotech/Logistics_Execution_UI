import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { FormBuilder, FormGroup,ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-smart-dashboard',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './default.component.html',
  styleUrls: ['./default.component.scss']
})
export class DefaultComponent {
  now: Date = new Date(); 
dashboard1form !: FormGroup;
 // Shipments by Destination Zone
// public shipmentData: ChartConfiguration<'bar'>['data'] = {
//   labels: ['West', 'South', 'North', 'East', 'North East'],
//   datasets: [
//     {
//       label: 'No of Shipments',
//       data: [221, 192, 128, 96, 12],  // static values
//       backgroundColor: '#60a5fa'
//     }
//   ]
// };


// public shipmentOptions: ChartOptions<'bar'> = {
//   responsive: true,
//   indexAxis: 'y',   // ✅ horizontal bar
//   plugins: { legend: { display: false } },
//   scales: {
//     x: { ticks: { color: '#444' } },
//     y: { ticks: { color: '#444' } }
//   }
// };

  constructor(private fb: FormBuilder) {
  }
  ngOnInit(): void {
      const today = new Date().toISOString().substring(0, 10);
      this.dashboard1form = this.fb.group({
        date: ['',],
        Months: ['',],
        financialYear: ['',],
        customerGroup: ['',], 
        batteryCondition: ['',],
       
      });
    }
// Loading Factor by Division
// public loadingFactorData: ChartConfiguration<'bar'>['data'] = {
//   labels: ['Bty Group (NCP)', 'Bty Group (NCP)', 'Electronics', 'LIB-ESS', 'Defence'],
//   datasets: [
//     {
//       label: 'Loading Factor %',
//       data: [84, 76, 75, 72, 66],   // static %
//       backgroundColor: ['#3b82f6','#60a5fa','#93c5fd','#38bdf8','#0ea5e9']
//     }
//   ]
// };

// public loadingFactorOptions: ChartOptions<'bar'> = {
//   responsive: true,
//   plugins: { legend: { display: false } },
//   scales: {
//     x: { ticks: { color: '#444' } },
//     y: {
//       ticks: { color: '#444', callback: (val) => val + '%' }, // show % sign
//       min: 0,
//       max: 100
//     }
//   }
// };
  
}
