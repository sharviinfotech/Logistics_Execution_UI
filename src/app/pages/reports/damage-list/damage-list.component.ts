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
  selector: 'app-damage-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgSelectModule],
  templateUrl: './damage-list.component.html',
  styleUrl: './damage-list.component.css'
})
export class DamageListComponent implements OnInit {
 Pendingform!: FormGroup;
  filteredData: any[] = [];
  originalData: any[] = [];
  transporterList: any[] = [];
  loggedInUser: any[] = [];
  plantList: any[] = [];
  divisionList: any[] = [];
  customerList: any[] = [];
  branchList: any[] = [];
  destLocationList: any[] = [];
  destStateZoneList: any[] = [];
  IncotermsList: any[] = [];
  segmentList: any[] = [];

  // Add these static option arrays
inoutOptions = [
  { value: 'INWARD', label: 'Inward' },
  { value: 'OUTWARD', label: 'Outward' }
];

sapTypeOptions = [
  { value: 'SAP', label: 'SAP' },
  { value: 'NONSAP', label: 'Non-SAP' }
];

transGroupOptions = [
  { value: 'FULL TRUCK LOAD', label: 'FULL TRUCK LOAD' },
  { value: 'CARGO', label: 'CARGO' },
  { value: 'RATECONTRACT', label: 'RATE CONTRACT' },
  { value: 'LOCALTRANSPORTATION', label: 'LOCAL TRANSPORTATION' },
  { value: 'CUSTOMERTRANSPORTER', label: 'CUSTOMER TRANSPORTER' },
  { value: 'COMPANYVEHICLE', label: 'COMPANY VEHICLE' },
  { value: 'COURIER', label: 'COURIER' },
  { value: 'BYHAND', label: 'BY HAND' }
];

productOptions = [
  { value: 'Batteries', label: 'Batteries' },
  { value: 'Electronics', label: 'Electronics' },
  { value: 'Fuze', label: 'Fuze' },
  { value: 'Cement Poles and Piles', label: 'Cement Poles and Piles' },
  { value: 'Raw Materials', label: 'Raw Materials' },
  { value: 'Job Work Material', label: 'Job Work Material' },
  { value: 'Machinery', label: 'Machinery' },
  { value: 'Others', label: 'Others' }
];

damageRemarkOptions = [
  { value: 'Packing material damage', label: 'Packing material damage' },
  { value: 'Pallet damage', label: 'Pallet damage' },
  { value: 'Cells damage', label: 'Cells damage' },
  { value: 'Cell Bank damage', label: 'Cell Bank damage' },
  { value: 'Can damage', label: 'Can damage' },
  { value: 'Accident', label: 'Accident' },
  {
    value: 'Prohibited material loading and seized by Police',
    label: 'Prohibited material loading and seized by Police'
  },
  { value: 'Damage during unloading', label: 'Damage during unloading' },
  { value: 'Material in wet condition', label: 'Material in wet condition' },
  {
    value: 'Damage due to other materials loaded',
    label: 'Damage due to other materials loaded'
  }
];



  constructor(private fb: FormBuilder,
    private spinner: NgxSpinnerService,
    private service: GeneralserviceService,
    private spinnerService: SpinnerService,


  ) { }

  ngOnInit(): void {
this.Pendingform = this.fb.group({
  INOUT:          [[], Validators.required], 
  SAPTYPE:        [[]],
  FROM_DATE:      ['', Validators.required],
  TO_DATE:        ['', Validators.required],
  TRANS_GROUP:    [[]],
  TRANSPORTER:    [[]],
  WERKS:          [[]],
  DAMAGE_RMK:     [[]],
  INCIDENT_DATE:  [''],
  MATNR:          [[]],
  DIVISION:       [[]],
  CUSTOMER:       [[]],
  DEST_LOCATION:  [[]],
  INCOTERMS:      [[]],

});
    this.getTransporters();
    this.fetchpdb();
    this.getBranches();
    this.fetchIncoterms();

    const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.loggedInUser = userData.USER || '';
    console.log("Logged in user:", this.loggedInUser);
    this.plantList = userData.PLANTS || [];
    this.divisionList = userData.DIV || [];

    console.log("Plants:", this.plantList);
    console.log("Divisions:", this.divisionList);
  }

  createArray(value: any, key: string) {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return [];
    }
 
    if (Array.isArray(value)) {
      return value.map(v => ({ [key]: v }));
    }
 
    return [{ [key]: value }];
  }

formatDate(date: string) {
  if (!date) return '';
  return date.split('-').join('');
}

  // ✅ EXECUTE BUTTON
  onSearch() {

     if (this.Pendingform.invalid) {

    // Mark all fields as touched (to show errors in UI)
    this.Pendingform.markAllAsTouched();

    Swal.fire({
      icon: 'warning',
      title: 'Validation Error',
      text: 'Please fill all mandatory fields',
      confirmButtonText: 'OK',
    });

    return; // ⛔ STOP API CALL
  }

    const form = this.Pendingform.value;

    // const payload = {
    //   inward_outward: form.INOUT || '',
    //   from_date: form.FROM_DATE || '',
    //   to_date: form.TO_DATE || '',
    //   sap_nonsap: form.SAPTYPE || '',
    //   transporter_group: form.TRANS_GROUP || '',
    //   transporter: form.TRANSPORTER || '',
    //   plant: form.WERKS || '',
    //   product: form.MATNR || '',
    //   division: form.DIVISION || '',
    //   customer: form.CUSTOMER || '',
    //   branch: form.BRANCH || '',
    //   branch_zone: form.BRANCH_ZONE || '',
    //   destination_location: form.DEST_LOCATION || '',
    //   destination_state: form.DEST_STATE || '',
    //   destination_zone: form.DEST_ZONE || '',
    //   incoterms: form.INCOTERMS || ''
    // };
const payload = {
  inward_outward: this.createArray(form.INOUT, 'inout'),
  from_date: this.formatDate(form.FROM_DATE),
  to_date: this.formatDate(form.TO_DATE),
  sap_nonsap: this.createArray(form.SAPTYPE, 'type'),
  transporter_group: this.createArray(form.TRANS_GROUP, 'TRANSPORTER_GROUP'),
  transporter: this.createArray(form.TRANSPORTER, 'TRANSPORTER'),
  plant: this.createArray(form.WERKS, 'plant'),
  damage_remarks: this.createArray(form.DAMAGE_RMK, 'damage_remarks'),
  incident_date: this.createArray(form.INCIDENT_DATE, 'incident_date'),
  product: this.createArray(form.MATNR, 'product'),
  division: this.createArray(form.DIVISION, 'DIVISION'),
  destination_location: this.createArray(form.DEST_LOCATION, 'destination_location'),
  customer: this.createArray(form.CUSTOMER, 'CUSTOMER'),
  incoterms: this.createArray(form.INCOTERMS, 'incoterms')
};

    console.log('Payload:', payload);

    this.spinner.show(); // optional spinner start

    this.service.FetchDamageList(payload).subscribe({
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

  // ✅ CLEAR BUTTON
  resetForm() {
    this.Pendingform.reset();
    this.filteredData = []; // clear table
  }
  onFilter(event: any) {
    const value = event.target.value.toLowerCase();

    this.filteredData = this.originalData.filter(item =>
      Object.values(item).some(val =>
        String(val).toLowerCase().includes(value)
      )
    );
  }
  getTransporters() {
    this.spinner.show();

    this.service.fetchVendorCode().subscribe({
      next: (res: any) => {
        console.log('Transporter API:', res);

        this.transporterList = res?.[0]?.VEND_CODE || [];
      },
      error: (err) => {
        console.error('Error fetching transporters', err);
        this.transporterList = [];
      },
      complete: () => {
        this.spinner.hide();
      }
    });
  }

fetchpdb(): void {
  this.spinner.show();
  this.service.getpdb().subscribe(
    (res: any) => {
      console.log("PDB Data:", res);

      this.customerList = res?.[0]?.CUSTOMER || [];

      this.spinner.hide();
    },
    error => {
      console.error("❌ PDB Fetch Error:", error);
      this.spinner.hide();
    }
  );
}

onCustomerChange(): void {
  const selectedValues = this.Pendingform.get('CUSTOMER')?.value;
  console.log("Selected customers:", selectedValues);
}

// toggleSelectAll(event: any): void {
//   if (event.target.checked) {
//     const allCustomers = this.customerList.map((item: any) => item.CUSTOMER);
//     this.Pendingform.get('CUSTOMER')?.setValue(allCustomers);
//   } else {
//     this.Pendingform.get('CUSTOMER')?.setValue([]);
//   }
// }

// isAllSelected(): boolean {
//   const selected = this.Pendingform.get('CUSTOMER')?.value || [];
//   return selected.length === this.customerList.length;
// }

  getBranches(): void {
    this.spinner.show();
    this.service.getssc().subscribe({
      next: (res: any) => {
        console.log('Branch & Segment API response:', res);
        this.spinner.hide();
        if (res && res.length > 0) {
          const data = res[0];

          this.branchList = data.BRANCH || [];
          this.segmentList = data.SEGMENTS || [];
          this.destLocationList =
            // data?.DEST_LOCATION ||
            data.DEST_LOC ||
            [];
            this.destStateZoneList = data.DEST_STZ || [];

        }
      },
      error: (err) => {
        this.spinner.hide();
        console.error('F4 fetch error', err);
        Swal.fire('Error', 'Failed to load master dropdown data (F4).', 'error');
      }
    });
  }

  fetchIncoterms() {
    this.spinner.show();
    const payload = { INCO1: "", BEZEI: "" };
    this.service.Incoterms(payload).subscribe({
      next: (res: any) => {
        this.IncotermsList = Array.isArray(res) ? res : (res?.data || []);
        this.spinner.hide();
      },
      error: (err) => {
        console.error("Error fetching Incoterms:", err);
        this.spinner.hide();
      }
    });
  }


downloadExcel() {
  if (!this.filteredData || this.filteredData.length === 0) {
    Swal.fire('Warning', 'No data available to download.', 'warning');
    return;
  }

  const exportData = this.filteredData.map((row: any) => ({
    'Reference No': `${row.REFERENCE_NUMBER || ''}`,
    'Inward / Outward': row.INWARD_OUTWARD || '',
    'SAP Type': row.SAP_NONSAP || '',
    'Incident Date': row.INCIDENT_DATE || '',
    'Plant': row.PLANT || '',
    'Division': row.DIVISION || '',
    'Customer': row.CUSTOMER || '',
    'Invoice Number': row.INVOICE_NUMBER || '',
    'Invoice Date': row.INVOICE_DATE || '',
    'Product': row.PRODUCT || '',
    'Product Description': row.PRODUCT_DESCRIPTION || '',
    'Transporter Group': row.TRANSPORTER_GROUP || '',
    'Transporter': row.TRANSPORTER || '',
    'LR No': row.LR_NO || '',
    'Nature of Damage': row.NATURE_OF_DAMAGE || '',
    'FSR Reported Date': row.FSR_REPORTED_DATE || '',
    'Settlement': row.SETTLEMENT || '',
    'Incident Closing Date': row.INCIDENT_CLOSING_DATE || ''
  }));

  const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
  const wb: XLSX.WorkBook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, 'Damage List Report');
  XLSX.writeFile(wb, 'Damage_List_Report.xlsx');

  Swal.fire('Success', 'Excel downloaded successfully.', 'success');
}
downloadPDF() {
  if (!this.filteredData || this.filteredData.length === 0) {
    Swal.fire('Warning', 'No data available to download.', 'warning');
    return;
  }

  const doc = new jsPDF('l', 'mm', 'a4');

  const tableColumn = [
    'Reference No',
    'Inward / Outward',
    'SAP Type',
    'Incident Date',
    'Plant',
    'Division',
    'Customer',
    'Invoice Number',
    'Invoice Date',
    'Product',
    'Product Description',
    'Transporter Group',
    'Transporter',
    'LR No',
    'Nature of Damage',
    'FSR Reported Date',
    'Settlement',
    'Incident Closing Date'
  ];

  const tableRows = this.filteredData.map((row: any) => [
    row.REFERENCE_NUMBER || '',
    row.INWARD_OUTWARD || '',
    row.SAP_NONSAP || '',
    row.INCIDENT_DATE || '',
    row.PLANT || '',
    row.DIVISION || '',
    row.CUSTOMER || '',
    row.INVOICE_NUMBER || '',
    row.INVOICE_DATE || '',
    row.PRODUCT || '',
    row.PRODUCT_DESCRIPTION || '',
    row.TRANSPORTER_GROUP || '',
    row.TRANSPORTER || '',
    row.LR_NO || '',
    row.NATURE_OF_DAMAGE || '',
    row.FSR_REPORTED_DATE || '',
    row.SETTLEMENT || '',
    row.INCIDENT_CLOSING_DATE || ''
  ]);

  doc.text('Damage List Report', 14, 10);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 20,
    styles: {
      fontSize: 6,
      cellPadding: 1
    },
    headStyles: {
      fillColor: [41, 128, 185],
      fontSize: 6
    },
    margin: { left: 5, right: 5 }
  });

  doc.save('Damage_List_Report.pdf');

  Swal.fire('Success', 'PDF downloaded successfully.', 'success');
}
}
