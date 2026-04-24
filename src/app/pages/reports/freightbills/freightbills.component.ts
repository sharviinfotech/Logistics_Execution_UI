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
  selector: 'app-freightbills',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgSelectModule],
  templateUrl: './freightbills.component.html',
  styleUrl: './freightbills.component.css'
})
export class FreightbillsComponent {
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
      PROVISION_ACCOUNT: [[]]
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

      sap_nonsap: this.createArray(form.SAPTYPE, 'type'),

      // ✅ NEW FIELD
      provision_account: this.createArray(form.PROVISION_ACCOUNT, 'provision_account'),

      // ✅ CASE-SENSITIVE FIXES
      transporter_group: this.createArray(form.TRANS_GROUP, 'TRANSPORTER_GROUP'),
      transporter: this.createArray(form.TRANSPORTER, 'TRANSPORTER'),

      plant: this.createArray(form.WERKS, 'plant'),
      product: this.createArray(form.MATNR, 'product'),

      division: this.createArray(form.DIVISION, 'DIVISION'),
      customer: this.createArray(form.CUSTOMER, 'CUSTOMER'),

      branch: this.createArray(form.BRANCH, 'branch'),

      destination_location: this.createArray(form.DEST_LOCATION, 'destination_location'),

      incoterms: this.createArray(form.INCOTERMS, 'incoterms')
    };
    console.log('Payload:', payload);

    this.spinner.show(); // optional spinner start

    this.service.FetchFreightBills(payload).subscribe({
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
        this.customerList = this.customerList.map((item: any) => ({
          ...item,
          searchText: `${item.CUSTOMER} - ${item.CUSTOMER_NAME}`
        }));


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
      'Division': row.DIVISION,
      'Customer': row.CUSTOMER,
      'Product': row.PRODUCT,
      'Product Description': row.PRODUCT_DESCRIPTION,
      'Invoice No': row.INVOICE_NUMBER,
      'Invoice Date': row.INVOICE_DATE,
      'Transporter Group': row.TRANSPORTER_GROUP,
      'Transporter': row.TRANSPORTER,
      'LR No': row.LR_NO,
      'Delivery Date': row.DELIVERY_DATE,
      'POD Submitted Date': row.POD_SUBMITTED_DATE || '-',
      'Provision Account Status': row.PROVISION_ACCOUNT_STATUS,
      'Freight Bill Status': row.FREIGHT_BILL_STATUS,
      'Pending Days': row.PENDING_DAYS
    }));

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'Freight Bills': worksheet },
      SheetNames: ['Freight Bills']
    };

    XLSX.writeFile(workbook, 'Freight_Bills.xlsx');
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
      'Division',
      'Customer',
      'Product',
      'Product Description',
      'Invoice No',
      'Invoice Date',
      'Transporter Group',
      'Transporter',
      'LR No',
      'Delivery Date',
      'POD Submitted Date',
      'Provision Account Status',
      'Freight Bill Status',
      'Pending Days'
    ];

    const tableRows = this.filteredData.map((row: any) => [
      row.REFERENCE_NUMBER || '',
      row.INWARD_OUTWARD || '',
      row.SAP_NONSAP || '',
      row.PLANT || '',
      row.DIVISION || '',
      row.CUSTOMER || '',
      row.PRODUCT || '',
      row.PRODUCT_DESCRIPTION || '',
      row.INVOICE_NUMBER || '',
      this.formatDate(row.INVOICE_DATE),
      row.TRANSPORTER_GROUP || '',
      row.TRANSPORTER || '',
      row.LR_NO || '',
      this.formatDate(row.DELIVERY_DATE),
      row.POD_SUBMITTED_DATE || '-',
      row.PROVISION_ACCOUNT_STATUS || '',
      row.FREIGHT_BILL_STATUS || '',
      row.PENDING_DAYS || ''
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

    doc.save(`Freight_Bills_Report_${Date.now()}.pdf`);

    Swal.fire('Success', 'PDF downloaded successfully.', 'success');
  }
}
