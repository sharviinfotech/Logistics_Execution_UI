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
  selector: 'app-loading-factor-cost',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgSelectModule],
  templateUrl: './loading-factor-cost.component.html',
  styleUrl: './loading-factor-cost.component.css'
})
export class LoadingFactorCostComponent implements OnInit {
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
  customergroupList: any[] = [];

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
  MATNR:          [[]],
  DIVISION:       [[]],
  CUSTOMER_GROUP:  [[]],
  CUSTOMER:       [[]],
  BRANCH:         [[]],
  BRANCH_ZONE:    [[]],
  DEST_LOCATION:  [[]],
  DEST_STATE:     [[]],
  DEST_ZONE:      [[]],
  INCOTERMS:      [[]],
  SEGMENT:         [[]]
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
  product: this.createArray(form.MATNR, 'product'),
  division: this.createArray(form.DIVISION, 'DIVISION'),
  customer_group: this.createArray(form.CUSTOMER_GROUP, 'CUSTOMER_GROUP'),
  branch: this.createArray(form.BRANCH, 'branch'),
  branch_zone: this.createArray(form.BRANCH_ZONE, 'branch_zone'),
  destination_location: this.createArray(form.DEST_LOCATION, 'destination_location'),
  destination_state: this.createArray(form.DEST_STATE, 'destination_state'),
  segment: this.createArray(form.SEGMENT, 'segment'),
  customer: this.createArray(form.CUSTOMER, 'CUSTOMER'),
  incoterms: this.createArray(form.INCOTERMS, 'incoterms')
};

    console.log('Payload:', payload);

    this.spinner.show(); // optional spinner start

    this.service.FetchLoadingFactorandCost(payload).subscribe({
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

        console.log("Customer Data:", res);

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
    'Reference No': row.REFERENCE_NUMBER || '',
    'SAP Type': row.SAP_NONSAP || '',
    'Financial Year': row.FINANCIAL_YEAR || '',
    'Month': row.MONTH || '',
    'Plant': row.PLANT || '',
    'Division': row.DIVISION || '',
    'Sub Division': row.SUB_DIVISION || '',
    'Customer': row.CUSTOMER || '',
    'Customer Group': row.CUSTOMER_GROUP || '',
    'Destination Location': row.DESTINATION_LOCATION || '',
    'Destination State': row.DESTINATION_STATE || '',
    'Destination Zone': row.DESTINATION_ZONE || '',
    'Product': row.PRODUCT || '',
    'Type of Material': row.TYPE_OF_MATERIAL || '',
    'Material Description': row.MATERIAL_DESCRIPTION || '',
    'Battery Condition': row.BATTERY_CONDITION || '',
    'Inco Terms': row.INCO_TERMS || '',
    'Transporter Name': row.TRANSPORTER_NAME || '',
    'Transporter Group': row.TRANSPORTER_GROUP || '',
    'Date': row.DATE || '',
    'Basic Invoice Amount': row.BASIC_INVOICE_AMOUNT || '',
    'Physical Dispatch Date': row.PHYSICAL_DISPATCH_DATE || '',
    'No of Vehicle': row.NO_OF_VEHICLE || '',
    'Vehicle Passing Weight': row.VEHICLE_PASSING_WEIGHT || '',
    'Actual Load': row.ACTUAL_LOAD || '',
    'Loading Factor Weight': row.LOADING_FACTOR_WEIGHT || '',
    'Vehicle Volume': row.VEHICLE_VOLUME || '',
    '% of Volume Occupied': (row['%_OF_VOLUME_OCCUPIED'] || row['%_OF_VOLUME_OCCUPIED'] === 0) ? row['%_OF_VOLUME_OCCUPIED'] + '%' : '',
    'Shipment Volume': row.SHIPMENT_VOLUME || '',
    'Total Freight': row.TOTAL_FREIGHT || '',
    'AH Loaded in Truck': row.AH_LOADED_IN_THE_TRUCK || '',
    'Freight AH': row.FREIGHT_AH || '',
    'Distance KM': row.DISTANCE_KILLOMETER || '',
    'Cost KM': row.COST_KM || '',
    'Cost Ton KM': row.COST_TON_KM || '',
    'Freight Cost Over Sales': row.FREIGHT_COST_OVER_SALES || '',
    'Cost Ton Passing Weight': row.COST_TON_AS_PER_PASSING_WEIGHT || '',
    'Cost Ton Actual Load': row.COST_TON_AS_PER_ACTUAL_LOAD || '',
    'Total Cost Passing Weight': row.TOTAL_COST_PASSING_WEIGHT || '',
    'Total Cost Actual Load': row.TOTAL_COST_AS_PER_ACTUAL_LOAD || '',
    'Percentage': (row.PERCENTAGE || row.PERCENTAGE === 0) ? row.PERCENTAGE + '%' : ''
  }));

  const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
  const wb: XLSX.WorkBook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, 'Loading Factor Report');
  XLSX.writeFile(wb, 'Loading_Factor_Cost_Report.xlsx');

  Swal.fire('Success', 'Excel downloaded successfully.', 'success');
}
downloadPDF() {
  if (!this.filteredData || this.filteredData.length === 0) {
    Swal.fire('Warning', 'No data available to download.', 'warning');
    return;
  }

  const doc = new jsPDF('l', 'mm', 'a2');

  const tableColumn = [
    'Reference No',
    'SAP Type',
    'Financial Year',
    'Month',
    'Plant',
    'Division',
    'Sub Division',
    'Customer',
    'Customer Group',
    'Destination Location',
    'Destination State',
    'Destination Zone',
    'Product',
    'Type of Material',
    'Material Description',
    'Battery Condition',
    'Inco Terms',
    'Transporter Name',
    'Type of Vehicle',
    'GSTIN No',
    'ODN Number',
    'Date',
    'Basic Invoice Amount',
    'Physical Dispatch Date',
    'Transporter Group',
    'No of Vehicle',
    'Vehicle Passing Weight',
    'Actual Load',
    'Loading Factor Weight',
    'Vehicle Volume',
    '% of Volume Occupied',
    'Shipment Volume',
    'Total Freight',
    'AH Loaded in Truck',
    'Freight AH',
    'Distance KM',
    'Cost KM',
    'Cost Ton KM',
    'Freight Cost Over Sales',
    'Cost Ton Passing Weight',
    'Cost Ton Actual Load',
    'Total Cost Passing Weight',
    'Total Cost Actual Load',
    'Percentage'
  ];

  const tableRows = this.filteredData.map((row: any) => [
    row.REFERENCE_NUMBER || '',
    row.SAP_NONSAP || '',
    row.FINANCIAL_YEAR || '',
    row.MONTH || '',
    row.PLANT || '',
    row.DIVISION || '',
    row.SUB_DIVISION || '',
    row.CUSTOMER || '',
    row.CUSTOMER_GROUP || '',
    row.DESTINATION_LOCATION || '',
    row.DESTINATION_STATE || '',
    row.DESTINATION_ZONE || '',
    row.PRODUCT || '',
    row.TYPE_OF_MATERIAL || '',
    row.MATERIAL_DESCRIPTION || '',
    row.BATTERY_CONDITION || '',
    row.INCO_TERMS || '',
    row.TRANSPORTER_NAME || '',
    row.TYPE_OF_VEHICLE || '',
    row.GSTIN_NO || '',
    row.ODN_NUMBER || '',
    row.DATE || '',
    row.BASIC_INVOICE_AMOUNT || '',
    row.PHYSICAL_DISPATCH_DATE || '',
    row.TRANSPORTER_GROUP || '',
    row.NO_OF_VEHICLE || '',
    row.VEHICLE_PASSING_WEIGHT || '',
    row.ACTUAL_LOAD || '',
    row.LOADING_FACTOR_WEIGHT || '',
    row.VEHICLE_VOLUME || '',
    (row['%_OF_VOLUME_OCCUPIED'] || row['%_OF_VOLUME_OCCUPIED'] === 0) ? row['%_OF_VOLUME_OCCUPIED'] + '%' : '',
    row.SHIPMENT_VOLUME || '',
    row.TOTAL_FREIGHT || '',
    row.AH_LOADED_IN_THE_TRUCK || '',
    row.FREIGHT_AH || '',
    row.DISTANCE_KILLOMETER || '',
    row.COST_KM || '',
    row.COST_TON_KM || '',
    row.FREIGHT_COST_OVER_SALES || '',
    row.COST_TON_AS_PER_PASSING_WEIGHT || '',
    row.COST_TON_AS_PER_ACTUAL_LOAD || '',
    row.TOTAL_COST_PASSING_WEIGHT || '',
    row.TOTAL_COST_AS_PER_ACTUAL_LOAD || '',
    (row.PERCENTAGE || row.PERCENTAGE === 0) ? row.PERCENTAGE + '%' : ''
  ]);

  doc.text('Loading Factor Cost Report', 14, 10);

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

  doc.save('Loading_Factor_Cost_Report.pdf');

  Swal.fire('Success', 'PDF downloaded successfully.', 'success');
}
}
