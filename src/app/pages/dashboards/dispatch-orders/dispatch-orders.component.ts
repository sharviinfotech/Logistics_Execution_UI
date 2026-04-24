import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { SpinnerService } from 'src/app/spinner.service';
import { GeneralserviceService } from 'src/app/generalservice.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-dispatch-orders',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgSelectModule],
  templateUrl: './dispatch-orders.component.html',
  styleUrl: './dispatch-orders.component.css'
})
export class DispatchOrdersComponent implements OnInit{

  
  filterForm!: FormGroup;
  filteredData: any[] = [];
  submitted : boolean = false;
  originalData: any[] = [];
  pendingCount: number = 0;
  completedCount: number = 0;
  
  constructor(private fb: FormBuilder, private service: GeneralserviceService, private spinner: NgxSpinnerService,) { }
   
    ngOnInit(): void {
    this.filterForm = this.fb.group({
      FROM_DATE: ['', Validators.required],
      TO_DATE: ['', Validators.required],
    });
   this.fetchPendingAndCompletedCounts();

  }

// onSearch() {
//   this.submitted = true;

//   if (this.filterForm.invalid) {
//     this.filterForm.markAllAsTouched();
//     Swal.fire('Validation', 'Please fill required fields', 'warning');
//     return;
//   }

//   const payload = {
//     from_date: this.formatDate(this.filterForm.value.FROM_DATE),
//     to_date: this.formatDate(this.filterForm.value.TO_DATE)
//   };

//   this.spinner.show();

//   this.service.FetchDispatchOrderFlowData(payload).subscribe({
//     next: (res: any) => {
//       this.spinner.hide();

//       console.log('API Response:', res);

//       this.originalData = res?.data || res || [];
//       this.filteredData = [...this.originalData];

//       if (this.filteredData.length === 0) {
//         Swal.fire('Info', 'No records found', 'info');
//       }
//     },
//     error: (err) => {
//       this.spinner.hide();
//       console.error('API Error:', err);
//       Swal.fire('Error', 'Failed to fetch dispatch orders', 'error');
//     }
//   });
// }

  onSearch() {

     if (this.filterForm.invalid) {

    // Mark all fields as touched (to show errors in UI)
    this.filterForm.markAllAsTouched();

    Swal.fire({
      icon: 'warning',
      title: 'Validation Error',
      text: 'Please fill all mandatory fields',
      confirmButtonText: 'OK',
    });

    return; // ⛔ STOP API CALL
  }

    const form = this.filterForm.value;

  const payload = {
    from_date: this.formatDate(this.filterForm.value.FROM_DATE),
    to_date: this.formatDate(this.filterForm.value.TO_DATE)
  };

    console.log('Payload:', payload);

    this.spinner.show(); // optional spinner start

    this.service.FetchDispatchOrderFlowData(payload).subscribe({
      next: (res: any) => {
        console.log('API Response:', res);

        this.spinner.hide();

        // ✅ CASE 1: API returns error object
        if (res && res.ERROR_TYPE === 'E') {
          this.filteredData = [];

          Swal.fire({
            icon: 'warning',
            title: 'No Data',
            text: res.MESSAGE,
            confirmButtonText: 'OK',
          });

          return;
        }

        // ✅ CASE 2: API returns actual data (array)
        this.filteredData = res || [];
        this.originalData = [...this.filteredData];

        if (this.filteredData.length > 0) {
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Data Fetched Successfully',
            confirmButtonText: 'OK',
          });
        } else {
          Swal.fire({
            icon: 'warning',
            title: 'No Data',
            text: res.MESSAGE,
            confirmButtonText: 'OK',
          });
        }
      },
      error: (err) => {
        console.error('API Error:', err);

        this.spinner.hide();

        this.filteredData = [];

        // ❌ ERROR SWAL
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to fetch data. Please try again.',
          confirmButtonText: 'OK',
        });
      }
    });
  }

// formatDate(date: string): string {
//   if (!date) return '';

//   const d = new Date(date);
//   const year = d.getFullYear();
//   const month = ('0' + (d.getMonth() + 1)).slice(-2);
//   const day = ('0' + d.getDate()).slice(-2);

//   return `${year}${month}${day}`;
// }

formatDate(date: string) {
  if (!date) return '';
  return date.split('-').join('');
}

   resetForm() {
    this.filterForm.reset();
    this.submitted = false;
    this.filteredData = [];
  }

   onFilter(event: any) {
    const value = event.target.value.toLowerCase();

    this.filteredData = this.originalData.filter(item =>
      Object.values(item).some(val =>
        String(val).toLowerCase().includes(value)
      )
    );
  }

fetchPendingAndCompletedCounts() {
  this.service.FetchDispatchOrderPendingCounts().subscribe(
    (response: any) => {
      console.log('Pending Counts Response:', response);

      this.pendingCount = response?.PENDING || 0;
      this.completedCount = response?.COMPLETED || 0;
    },
    (error: any) => {
      console.error('Error fetching counts:', error);

      this.pendingCount = 0;
      this.completedCount = 0;
    }
  );
}

}
