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
  selector: 'app-service-level-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgSelectModule],
  templateUrl: './service-level-report.component.html',
  styleUrl: './service-level-report.component.css'
})
export class ServiceLevelReportComponent implements OnInit {
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
  destLocationList: any[] = [];
  destStateZoneList: any[] = [];
  isDropdownOpen = false;
  selectedZones: string[] = [];
  selectedReportType: string = '';
  customergroupList: any[] = [];
  segmentList: any[] = [];

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
    // { value: 'RATECONTRACT', label: 'RATE CONTRACT' },
    // { value: 'LOCALTRANSPORTATION', label: 'LOCAL TRANSPORTATION' },
    // { value: 'CUSTOMERTRANSPORTER', label: 'CUSTOMER TRANSPORTER' },
    // { value: 'COMPANYVEHICLE', label: 'COMPANY VEHICLE' },
    // { value: 'COURIER', label: 'COURIER' },
    // { value: 'BYHAND', label: 'BY HAND' }
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
      FROM_DATE: ['', Validators.required],
      TO_DATE: ['', Validators.required],
      TRANS_GROUP: [[]],
      TRANSPORTER: [[]],
      WERKS: [[]],
      MATNR: [[]],
      DIVISION: [[]],
      CUSTOMER: [[]],
      SEGMENT: [[]],
      CUSTOMER_GROUP: [[]],
      BRANCH: [[]],
      BRANCH_ZONE: [[]],
      DEST_LOCATION: [[]],
      DEST_STATE: [[]],
      DEST_ZONE: [[]],
      INCOTERMS: [''],
      REPORT_TYPE: ['', Validators.required]


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
          console.log('FULL RESPONSE:', res);
          const data = res[0];


          this.branchList = data.BRANCH || [];
          this.segmentList = data.SEGMENTS || [];
          this.destLocationList =
            // data?.DEST_LOCATION ||
            data.DEST_LOC ||
            [];
          this.destStateZoneList = data.DEST_STZ || [];
          this.customergroupList = data.CUSTGRP || [];

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
    this.selectedReportType = form.REPORT_TYPE;

    const payload = {
      inward_outward: this.createArray(form.INOUT, 'inout'),
      from_date: this.formatDate(form.FROM_DATE),
      to_date: this.formatDate(form.TO_DATE),
      sap_nonsap: this.createArray(form.SAPTYPE, 'type'),
      transporter_group: this.createArray(form.TRANS_GROUP, 'transporter_group'),
      transporter: this.createArray(form.TRANSPORTER, 'transporter'),
      plant: this.createArray(form.WERKS, 'plant'),
      product: this.createArray(form.MATNR, 'product'),
      division: this.createArray(form.DIVISION, 'division'),
      customer_group: this.createArray(form.CUSTOMER_GROUP, 'customer_group'),
      segment: this.createArray(form.SEGMENT, 'segment'),
      customer: this.createArray(form.CUSTOMER, 'customer'),
      destination_location: this.createArray(form.DEST_LOCATION, 'destination_location'),
      destination_state: this.createArray(form.DEST_STATE, 'destination_state'),
      destination_zone: this.createArray(form.DEST_ZONE, 'destination_zone'),
      incoterms: this.createArray(form.INCOTERMS, 'incoterms'),
      vehicle: this.createArray(form.TRANS_GROUP, 'vehicle'),
      mode: form.REPORT_TYPE
    };
    console.log('Payload:', payload);

    this.spinner.show(); // optional spinner start

    this.service.FetchServiceLevelReports(payload).subscribe({
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

  formatDate(date: string) {
    if (!date) return '';
    return date.split('-').join('');
  }

  exportToExcel(): void {
    if (!this.filteredData || this.filteredData.length === 0) {
      Swal.fire('No Data', 'Nothing to export', 'warning');
      return;
    }

    let exportData: any[] = [];
    let fileName = '';

    // DETAILED
    if (this.selectedReportType === 'Detailed') {
      fileName = 'Service_Level_Detailed_Report';

      exportData = this.filteredData.map(row => ({
        'Reference No': row.REFERENCE_NUMBER,
        'SAP Type': row.SAP_NONSAP,
        'Financial Year': row.FINANCIAL_YEAR,
        'Month': row.MONTH,
        'Plant': row.PLANT,
        'Transporter Group': row.TRANSPORTER_GROUP,
        'Transporter': row.TRANSPORTER,
        'LR Number': row.LR_NUMBER,
        'LR Date': row.LR_DATE,
        'Division': row.DIVISION,
        'Sub Division': row.SUB_DIVISION,
        'Customer Group': row.CUSTOMER_GROUP,
        'Customer': row.CUSTOMER,
        'No Of Vehicles': row.NO_OF_VEHICLES_PLACED,
        'Vehicle Type': row.VEHICLE_TYPE,
        'On Time Placement': row.ON_TIME_PLACEMENT,
        'Transhipment': row.TRANSHIPMENT_IF_ANY,
        'On Time Delivery': row.ON_TIME_DELIVERY,
        'Damage': row.DAMAGE_IF_ANY,
        'Accident': row.ACCIDENT_IF_ANY,
        'Total Score': row.TOTAL_SCORE,
        'Feedback Date': row.FEEDBACK_SUBMITTED_DATE,
        'Feedback': row.FEEDBACK_FROM_USER
      }));
    }

    // SUMMARY
    else if (this.selectedReportType === 'Summary') {
      fileName = 'Service_Level_Summary_Audit_Report';

      exportData = this.filteredData.map(row => ({
        'Transporter Group': row.TRANSPORTER_GROUP,
        'Transporter': row.TRANSPORTER,
        'No Of Feedbacks': row.NO_OF_FEEDBACKS,
        'No Of Vehicles': row.NO_OF_VEHICLE_PLACED,
        'On Time Placement %': row.ON_TIME_PLACEMENT_PER,
        'Transhipment %': row.TRANSHIPMENT_IF_ANY_PER,
        'On Time Delivery %': row.ON_TIME_DELIVERY_PER,
        'Damage %': row.DAMAGE_IF_ANY_PER,
        'Accident %': row.ACCIDENT_IF_ANY_PER,
        'Problem Material Load %': row.PROB_MAT_LOAD_DURING_TRANS_PER,
        'Other Material Load %': row.OTH_MAT_LOAD_DURING_TRANS_PER,
        'POD Submission %': row.ON_TIME_POD_SUBMISSION_PER,
        'Freight Bill Submission %': row.ON_TIME_FREIGHT_BILL_SUB_PER,
        'Overall Feedback %': row.OVERALL_FEEDBACK_FROM_USER_PER
      }));
    }

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = {
      Sheets: { Report: worksheet },
      SheetNames: ['Report']
    };

    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  }

  downloadPDF() {
    if (!this.filteredData || this.filteredData.length === 0) {
      Swal.fire('Warning', 'No data available to download.', 'warning');
      return;
    }

    const doc = new jsPDF('l', 'mm', 'a2');

    let tableColumn: string[] = [];
    let tableRows: any[] = [];
    let fileName = '';

    // DETAILED
    if (this.selectedReportType === 'Detailed') {
      fileName = 'Service_Level_Detailed_Report';

      tableColumn = [
        'Reference No',
        'SAP Type',
        'Financial Year',
        'Month',
        'Plant',
        'Transporter Group',
        'Transporter',
        'LR Number',
        'LR Date',
        'Division',
        'Sub Division',
        'Customer Group',
        'Customer',
        'No Of Vehicles',
        'Vehicle Type',
        'On Time Placement',
        'Transhipment',
        'On Time Delivery',
        'Damage',
        'Accident',
        'Total Score',
        'Feedback Date',
        'Feedback'
      ];

      tableRows = this.filteredData.map(row => [
        row.REFERENCE_NUMBER,
        row.SAP_NONSAP,
        row.FINANCIAL_YEAR,
        row.MONTH,
        row.PLANT,
        row.TRANSPORTER_GROUP,
        row.TRANSPORTER,
        row.LR_NUMBER,
        row.LR_DATE,
        row.DIVISION,
        row.SUB_DIVISION,
        row.CUSTOMER_GROUP,
        row.CUSTOMER,
        row.NO_OF_VEHICLES_PLACED,
        row.VEHICLE_TYPE,
        row.ON_TIME_PLACEMENT,
        row.TRANSHIPMENT_IF_ANY,
        row.ON_TIME_DELIVERY,
        row.DAMAGE_IF_ANY,
        row.ACCIDENT_IF_ANY,
        row.TOTAL_SCORE,
        row.FEEDBACK_SUBMITTED_DATE,
        row.FEEDBACK_FROM_USER
      ]);
    }

    // SUMMARY
    else if (this.selectedReportType === 'Summary') {
      fileName = 'Service_Level_Summary_Audit_Report';

      tableColumn = [
        'Transporter Group',
        'Transporter',
        'No Of Feedbacks',
        'No Of Vehicles',
        'On Time Placement %',
        'Transhipment %',
        'On Time Delivery %',
        'Damage %',
        'Accident %',
        'Problem Material Load %',
        'Other Material Load %',
        'POD Submission %',
        'Freight Bill Submission %',
        'Overall Feedback %'
      ];

      tableRows = this.filteredData.map(row => [
        row.TRANSPORTER_GROUP,
        row.TRANSPORTER,
        row.NO_OF_FEEDBACKS,
        row.NO_OF_VEHICLE_PLACED,
        row.ON_TIME_PLACEMENT_PER,
        row.TRANSHIPMENT_IF_ANY_PER,
        row.ON_TIME_DELIVERY_PER,
        row.DAMAGE_IF_ANY_PER,
        row.ACCIDENT_IF_ANY_PER,
        row.PROB_MAT_LOAD_DURING_TRANS_PER,
        row.OTH_MAT_LOAD_DURING_TRANS_PER,
        row.ON_TIME_POD_SUBMISSION_PER,
        row.ON_TIME_FREIGHT_BILL_SUB_PER,
        row.OVERALL_FEEDBACK_FROM_USER_PER
      ]);
    }

    doc.text(fileName, 14, 10);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 15,
      styles: {
        fontSize: 6,
        cellWidth: 'wrap'
      },
      headStyles: {
        fillColor: [41, 128, 185]
      }
    });

    doc.save(`${fileName}.pdf`);

    Swal.fire('Success', 'PDF downloaded successfully.', 'success');
  }
}
