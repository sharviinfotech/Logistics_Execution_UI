import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Validators } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { GeneralserviceService } from 'src/app/generalservice.service';
import { validateEvents } from 'angular-calendar/modules/common/util/util';

@Component({
  selector: 'app-transit-reports',
  templateUrl: './transit-reports.component.html',
  styleUrls: ['./transit-reports.component.css']
})
export class TransitReportsComponent implements OnInit {

  filterForm!: FormGroup;



  filteredData: any[] = [];
   originalData: any[] = [];
    plantList: any;
     divisionList: any;
     loggedInUser: string = '';
     transporterList: any[] = [];

  constructor(private fb: FormBuilder, private service: GeneralserviceService,  private spinner: NgxSpinnerService,) {}

  ngOnInit(): void {
  this.filterForm = this.fb.group({
  INOUT: ['',Validators.required],
  SAPTYPE: [''],
  FROM_DATE: ['',Validators.required],
  TO_DATE: ['',Validators.required],
  TRANS_GROUP: [''],
  TRANSPORTER: [''],
  WERKS: [''],
  MATNR: [''],
  DIVISION: [''],
  CUSTOMER: [''],
  BRANCH: [''],
  BRANCH_ZONE: [''],
  DEST_LOCATION: [''],
  DEST_STATE: [''],
  DEST_ZONE: [''],
  INCOTERMS: ['']
});
 const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.loggedInUser = userData.USER || '';
    console.log("Logged in user:", this.loggedInUser);
 this.plantList = userData.PLANTS || [];
   this.divisionList = userData.DIV || [];
 
  console.log("Plants:", this.plantList);
  console.log("Divisions:", this.divisionList);
  this.transporterList = userData.VEND_CODE || [];
console.log("Transporters:", this.transporterList);
  }

onSearch() {
  this.filterForm.markAllAsTouched(); 

  if (this.filterForm.invalid) {

    Swal.fire({
      icon: 'warning',
      title: 'Validation',
      text: 'Please fill required fields'
    });

    return; 
  }


  const form = this.filterForm.value;

  const payload = {
    inward_outward: form.INOUT || '',
    from_date: form.FROM_DATE || '',
    to_date: form.TO_DATE || '',
    sap_nonsap: form.SAPTYPE || '',
    transporter_group: form.TRANS_GROUP || '',
    transporter: form.TRANSPORTER || '',
    plant: form.WERKS || '',
    product: form.MATNR || '',
    division: form.DIVISION || '',
    customer: form.CUSTOMER || '',
    branch: form.BRANCH || '',
    branch_zone: form.BRANCH_ZONE || '',
    destination_location: form.DEST_LOCATION || '',
    destination_state: form.DEST_STATE || '',
    destination_zone: form.DEST_ZONE || '',
    incoterms: form.INCOTERMS || ''
  };

  console.log('Payload:', payload);

  this.spinner.show(); // optional spinner start

  this.service.FetchTransitReport(payload).subscribe({
    next: (res: any) => {
      console.log('API Response:', res);

      this.filteredData = res || [];
      this.originalData = [...this.filteredData];

      this.spinner.hide(); // stop spinner

      // ✅ SUCCESS SWAL
      if (this.filteredData.length > 0) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Data fetched successfully!'
        });
      } else {
        // ⚠️ NO DATA SWAL
        Swal.fire({
          icon: 'warning',
          title: 'No Data',
          text: 'No records found for selected filters.'
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
        text: 'Failed to fetch data. Please try again.'
      });
    }
  });
}

  onFilter(event: any) {
  const value = event.target.value.toLowerCase();
 
  this.filteredData = this.originalData.filter(item =>
    Object.values(item).some(val =>
      String(val).toLowerCase().includes(value)
    )
  );
}
  // ✅ CLEAR BUTTON
  resetForm() {
    this.filterForm.reset();
    this.filteredData = []; // clear table
  }

}