import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { of } from 'rxjs';

@Component({
  selector: 'app-transit-reports',
  templateUrl: './transit-reports.component.html',
  styleUrls: ['./transit-reports.component.css'] // ✅ correct property name
})
export class TransitReportsComponent implements OnInit {

  filterForm!: FormGroup;

  // Dummy table data
  tables$ = of([
    {
      WERKS: '1000',
      KDAUF_AUFK: '500001',
      KDPOS_AUFK: '10',
      MATNR: 'MAT001',
      MATXT: 'Sample Material',
      AUFNR: '300001',
      AUART: 'PP01',
      STEXT: 'Released',
      GWEMG: 10,
      GAMNG: 100
    }
  ]);

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      WERKS: [''],
      AUFNR_F: [''],
      AUFNR_T: [''],
      AUART_F: [''],
      AUART_T: [''],
      KDAUF_F: [''],
      KDAUF_T: [''],
      KDPOS_F: [''],
      KDPOS_T: ['']
    });
  }

  // Clear button
  resetForm() {
    this.filterForm.reset();
  }

  // Execute button
  onSearch() {
    console.log('Form Data:', this.filterForm.value);
  }

  // Search box
  onSearchTermChange(event: any) {
    console.log('Search:', event.target.value);
  }

}