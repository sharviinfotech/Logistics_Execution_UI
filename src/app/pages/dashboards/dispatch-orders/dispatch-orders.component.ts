import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { SpinnerService } from 'src/app/spinner.service';
import { GeneralserviceService } from 'src/app/generalservice.service';

@Component({
  selector: 'app-dispatch-orders',
  templateUrl: './dispatch-orders.component.html',
  styleUrl: './dispatch-orders.component.css'
})
export class DispatchOrdersComponent {

  
  filterForm!: FormGroup;
  filteredData: any[] = [];
  submitted : boolean = false;
  originalData: any[] = [];
  
  constructor(private fb: FormBuilder, private service: GeneralserviceService, private spinner: NgxSpinnerService,) { }
   
    ngOnInit(): void {
    this.filterForm = this.fb.group({
      SAPTYPE: [[]],
      FROM_DATE: ['', Validators.required],
      TO_DATE: ['', Validators.required],
      TRANS_GROUP: [[]],
      TRANSPORTER: [[]],
      WERKS: [[]],
      MATNR: [[]],
      DIVISION: [[]],
      CUSTOMER: [[]],
      BRANCH: [[]],
      BRANCH_ZONE: [[]],
      DEST_LOCATION: [[]],
      DEST_STATE: [[]],
      DEST_ZONE: [[]],
      INCOTERMS: ['']
    });
   

  }

  onSearch() {
  this.submitted = true;

  if (this.filterForm.invalid) {
    this.filterForm.markAllAsTouched();
    Swal.fire('Validation', 'Please fill required fields', 'warning');
    return;
  }

  this.spinner.show();

  // ⏳ Simulate API delay
  setTimeout(() => {

    this.filteredData = [
      {
        REFERENCE_NUMBER: 'REF001',
        INWARD_OUTWARD: 'Out',
        SAP_NONSAP: 'SAP',
        PLANT: 'Plant 1',
        DIVISION: 'Division A',
        CUSTOMER: 'ABC Pvt Ltd',
        PRODUCT: 'Cement',
        MATERIAL_DESCRIPTION: 'OPC Cement',
        INVOICE_NUMBER: 'INV1001',
        INVOICE_DATE: '2026-04-01',
        TRANSPORTER_GROUP: 'TG1',
        TRANSPORTER: 'VRL Logistics',
        LR_NO: 'LR12345',
        DRIVER_NAME: 'Ramesh',
        DRIVER_MOBILE: '9876543210',
        PHYSICAL_DISPATCH_DATE: '2026-04-02',
        ETA: '2026-04-05',
        EWAY_NO: 'EWAY123',
        EWAY_VALIDITY_TILL: '2026-04-06',
        STATUS: 'In Transit'
      },
      {
        REFERENCE_NUMBER: 'REF002',
        INWARD_OUTWARD: 'In',
        SAP_NONSAP: 'Non-SAP',
        PLANT: 'Plant 2',
        DIVISION: 'Division B',
        CUSTOMER: 'XYZ Ltd',
        PRODUCT: 'Steel',
        MATERIAL_DESCRIPTION: 'TMT Bars',
        INVOICE_NUMBER: 'INV1002',
        INVOICE_DATE: '2026-04-03',
        TRANSPORTER_GROUP: 'TG2',
        TRANSPORTER: 'Blue Dart',
        LR_NO: 'LR67890',
        DRIVER_NAME: 'Suresh',
        DRIVER_MOBILE: '9123456780',
        PHYSICAL_DISPATCH_DATE: '2026-04-04',
        ETA: '2026-04-06',
        EWAY_NO: 'EWAY456',
        EWAY_VALIDITY_TILL: '2026-04-07',
        STATUS: 'Delivered'
      }
    ];

    this.spinner.hide();

    if (this.filteredData.length === 0) {
      Swal.fire('No Data', 'No records found', 'info');
    }

  }, 1000); // simulate 1 sec delay
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

}
