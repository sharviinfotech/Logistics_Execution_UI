import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, Chart } from 'chart.js';
import { registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-smart-dashboard',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './default.component.html',
  styleUrls: ['./default.component.scss']
})
export class DefaultComponent {
  now: Date = new Date(); 

  productionToday = 1234;
  oee = 99;

  machineStatus = {
    running: 5,
    idle: 2,
    faulty: 1
  };

  alerts = [
    'Machine 3: temperature high',
    'Line 2: minor vibration',
    'Order #456 delayed'
  ];

  // ------------------ Energy Chart ------------------
  public energyData: ChartConfiguration<'line'>['data'] = {
    labels: ['Mon','Tue','Wed','Thu','Fri'],
    datasets: [
      {
        label: 'Energy (kWh)',
        data: [60, 55, 75, 70, 85],
        fill: true,
        borderColor: '#60a5fa',
        backgroundColor: 'rgba(96,165,250,0.12)',
        tension: 0.35,
        pointRadius: 3
      }
    ]
  };
  public energyOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { 
        ticks: { color: '#444444' },   // Darker axis labels
        grid: { color: 'rgba(203,213,225,0.06)' } 
      },
      y: { 
        ticks: { color: '#444444' },   // Darker axis labels
        grid: { color: 'rgba(203,213,225,0.06)' } 
      }
    }
  };

  // ------------------ Downtime Chart ------------------
  public downtimeData: ChartConfiguration<'bar'>['data'] = {
    labels: ['Machine 1','Machine 2','Machine 3','Machine 4'],
    datasets: [
      {
        label: 'Downtime (hrs)',
        data: [3, 5, 7, 9],
        backgroundColor: ['#f87171','#facc15','#60a5fa','#93c5fd']
      }
    ]
  };
  public downtimeOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { 
        ticks: { color: '#444444' },   // Darker axis labels
        grid: { color: 'rgba(203,213,225,0.04)' } 
      },
      y: { 
        ticks: { color: '#444444' },   // Darker axis labels
        grid: { color: 'rgba(203,213,225,0.04)' } 
      }
    }
  };

  constructor() {
    setInterval(() => this.simulateLive(), 5000);
  }

  private simulateLive() {
    this.productionToday += Math.floor(Math.random() * 30);
    this.oee = Math.max(80, Math.min(100, this.oee + (Math.random() > 0.6 ? 1 : 0)));

    const ds = this.energyData.datasets[0].data as number[];
    const next = Math.max(30, (ds[ds.length-1] ?? 60) + (Math.random() * 10 - 4));
    ds.shift();
    ds.push(Math.round(next));
    this.energyData = { ...this.energyData }; 

    const dds = this.downtimeData.datasets[0].data as number[];
    for (let i = 0; i < dds.length; i++) {
      dds[i] = Math.max(0, Math.round((dds[i] + (Math.random() * 2 - 0.8)) * 10) / 10);
    }
    this.downtimeData = { ...this.downtimeData };
  }
}
