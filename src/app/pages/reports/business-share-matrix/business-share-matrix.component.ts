import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { SpinnerService } from 'src/app/spinner.service';
import { GeneralserviceService } from 'src/app/generalservice.service';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-business-share-matrix',
   standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgSelectModule],
  templateUrl: './business-share-matrix.component.html',
  styleUrl: './business-share-matrix.component.css'
})
export class BusinessShareMatrixComponent {

filterForm!: FormGroup;



  filteredData: any[] = [];
  originalData: any[] = [];
  plantList: any;
  divisionList: any;
  loggedInUser: string = '';
  transporterList: any[] = [];
  branchList: any[] = [];
  customerList: any[] = [];
  IncotermsList: any[] = [];
  destStateZoneList: any[] = [];
  destLocationList: any[] = [];
   segmentList: any[] = [];
   inoutOptions = [
    { value: 'INWARD', label: 'Inward' },
    { value: 'OUTWARD', label: 'Outward' }
  ];

  sapTypeOptions = [
    { value: 'SAP', label: 'SAP' },
    { value: 'NONSAP', label: 'Non-SAP' }
  ];
  
  provisionAccountOptions = [
  { label: 'PROVISION', value: 'PROVISION' },
  { label: 'ACCOUNT', value: 'ACCOUNT' }
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



  constructor(private fb: FormBuilder, private service: GeneralserviceService, private spinner: NgxSpinnerService,) { }

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      INOUT: [[], Validators.required],
      SAPTYPE: [[]],
      FROM_DATE: [[], Validators.required],
      TO_DATE: [[], Validators.required],
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
      INCOTERMS: [[]],
       SEGMENT: [[]]
    });
    const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.loggedInUser = userData.USER || '';
    console.log("Logged in user:", this.loggedInUser);
    this.plantList = userData.PLANTS || [];
    this.divisionList = userData.DIV || [];

    console.log("Plants:", this.plantList);
    console.log("Divisions:", this.divisionList);

    this.getTransporters();
    this.getBranches();
    this.fetchpdb();
    this.fetchIncoterms();

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



  getBranches(): void {
    this.spinner.show();
    this.service.getssc().subscribe({
      next: (res: any) => {
        console.log('Branch API response:', res);
        this.spinner.hide();
        if (res && res.length > 0) {
          const data = res[0];

          this.branchList = data.BRANCH || [];
           this.segmentList = data.SEGMENTS || [];
          this.destLocationList =
            // data?.DEST_LOCATION ||
            data.DEST_LOC ||
            [];

        }
      },
      error: (err) => {
        this.spinner.hide();
        console.error('F4 fetch error', err);
        Swal.fire('Error', 'Failed to load master dropdown data (F4).', 'error');
      }
    });
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
  inward_outward: this.createArray(form.INOUT, 'inout'),

  from_date: this.formatDate(form.FROM_DATE),
  to_date: this.formatDate(form.TO_DATE),

  // ✅ convert to lowercase (IMPORTANT)
  sap_nonsap: (form.SAPTYPE || []).map((v: string) => ({
    type: v.toLowerCase()
  })),



  transporter_group: this.createArray(form.TRANS_GROUP, 'TRANSPORTER_GROUP'),
  transporter: this.createArray(form.TRANSPORTER, 'TRANSPORTER'),

  plant: this.createArray(form.WERKS, 'plant'),
  product: this.createArray(form.MATNR, 'product'),

  division: this.createArray(form.DIVISION, 'DIVISION'),

  // ✅ ADD THIS (you missed it)
  customer_group: this.createArray(form.CUSTOMER_GROUP, 'CUSTOMER_GROUP'),

  customer: this.createArray(form.CUSTOMER, 'CUSTOMER'),

  branch: this.createArray(form.BRANCH, 'branch'),

  destination_location: this.createArray(form.DEST_LOCATION, 'destination_location'),

  // ✅ ADD THIS (you missed it)
  segment: this.createArray(form.SEGMENT, 'segment'),

  incoterms: this.createArray(form.INCOTERMS, 'incoterms')
};
    console.log('Payload:', payload);

    this.spinner.show(); // optional spinner start

    this.service.FetchBusinessShareMatrix(payload).subscribe({
      next: (res: any) => {
        this.spinner.hide();

        // ❌ ERROR RESPONSE HANDLING
        if (res?.ERROR_TYPE === 'E') {
          this.filteredData = [];
          this.originalData = [];

          Swal.fire({
            icon: 'warning',
            title: 'No Data',
            text: res?.MESSAGE
          });

          return;
        }

        // ✅ SAFE ARRAY CHECK (IMPORTANT FIX)
        if (!Array.isArray(res)) {
          this.filteredData = [];
          this.originalData = [];
          return;
        }

        this.filteredData = res;
        this.originalData = [...res];

        if (this.filteredData.length > 0) {
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Data fetched successfully!'
          });
        } else {
          Swal.fire({
            icon: 'warning',
            title: 'No Data',
            text: 'No records found'
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

  formatDate(date: string) {
    if (!date) return '';
    return date.split('-').join('');
  }
  // ✅ CLEAR BUTTON
  resetForm() {
    this.filterForm.reset();
    this.filteredData = []; // clear table
  }

  fetchpdb(): void {
    this.spinner.show();
    this.service.getpdb().subscribe(
      (res: any) => {

        console.log("📦 PDB Data:", res);

        this.customerList = res?.[0]?.CUSTOMER || [];


        this.spinner.hide();
      },
      error => {
        console.error("❌ PDB Fetch Error:", error);
        this.spinner.hide();
      }
    );
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

    exportToExcel(): void {
  if (!this.filteredData || this.filteredData.length === 0) {
    Swal.fire('No Data', 'Nothing to export', 'warning');
    return;
  }

const exportData = this.filteredData.map(row => ({
    'Reference No': row.REFERENCE_NUMBER,
    'In/Out': row.INWARD_OUTWARD,
    'SAP Type': row.SAP_NONSAP,
    'Plant': row.PLANT,
    'Transporter Group': row.TRANSPORTER_GROUP,
    'Transporter': row.TRANSPORTER,
    'No. of Vehicles': row.NO_OF_VEHICLES_PLACED,
    'Freight Amount': row.FREIGHT_AMOUNT,
    'Basic Charge': row.BASIC_CHARGE,
    'Detention Loading': row.DETENTION_LOADING,
    'Detention Unloading': row.DETENTION_UNLOADING,
    'Loading Charge': row.LOADING_CHARGE,
    'Unloading Charge': row.UNLOADING_CHARGE,
    'Routing Charges': row.ROUTING_CHARGES,
    'Transshipment Charges': row.TRANSHIPMENT_CHARGES,
    'Other Charges': row.OTHER_CHARGES,
    'Deduction Charges': row.DEDUCTION_CHARGES
  }));

  const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
  const workbook: XLSX.WorkBook = {
    Sheets: { 'Business Share Matrix': worksheet },
    SheetNames: ['Business Share Matrix']
  };

  XLSX.writeFile(workbook, 'Business_Share_Matrix.xlsx');
}

downloadPDF() {
  if (!this.filteredData || this.filteredData.length === 0) {
    Swal.fire('Warning', 'No data available to download.', 'warning');
    return;
  }

  const doc = new jsPDF('l', 'mm', 'a2');

  doc.text('Freight Bills Report', 14, 10);

 const tableColumn = [
    'Reference No',
    'In/Out',
    'SAP Type',
    'Plant',
    'Transporter Group',
    'Transporter',
    'No. of Vehicles',
    'Freight Amount',
    'Basic Charge',
    'Detention Loading',
    'Detention Unloading',
    'Loading Charge',
    'Unloading Charge',
    'Routing Charges',
    'Transshipment Charges',
    'Other Charges',
    'Deduction Charges'
  ];

  const tableRows = this.filteredData.map((row: any) => [
    row.REFERENCE_NUMBER || '',
    row.INWARD_OUTWARD || '',
    row.SAP_NONSAP || '',
    row.PLANT || '',
    row.TRANSPORTER_GROUP || '',
    row.TRANSPORTER || '',
    row.NO_OF_VEHICLES_PLACED || '',
    row.FREIGHT_AMOUNT || 0,
    row.BASIC_CHARGE || 0,
    row.DETENTION_LOADING || 0,
    row.DETENTION_UNLOADING || 0,
    row.LOADING_CHARGE || 0,
    row.UNLOADING_CHARGE || 0,
    row.ROUTING_CHARGES || 0,
    row.TRANSHIPMENT_CHARGES || 0,
    row.OTHER_CHARGES || 0,
    row.DEDUCTION_CHARGES || 0
  ]);


  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 15,
    styles: {
      fontSize: 7,
      cellWidth: 'wrap'
    },
    headStyles: {
      fillColor: [41, 128, 185],
      fontSize: 7
    }
  });

  doc.save(`Business_Share_Matrix_Report_${Date.now()}.pdf`);

  Swal.fire('Success', 'PDF downloaded successfully.', 'success');
}
}

