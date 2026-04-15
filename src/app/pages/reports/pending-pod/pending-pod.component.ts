import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { SpinnerService } from 'src/app/spinner.service';
import { GeneralserviceService } from 'src/app/generalservice.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-pending-pod',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgSelectModule],
  templateUrl: './pending-pod.component.html',
  styleUrl: './pending-pod.component.css'
})
export class PendingPodComponent implements OnInit {

  Pendingform!: FormGroup;

  // Static Data
  // allData = [
  //   {
  //     WERKS: '1000',
  //     KDAUF_AUFK: '500001',
  //     KDPOS_AUFK: '10',
  //     MATNR: 'MAT001',
  //     MATXT: 'Sample Material',
  //     AUFNR: '300001',
  //     AUART: 'PP01',
  //     STEXT: 'Released',
  //     GWEMG: 10,
  //     GAMNG: 100
  //   },
  //   {
  //     WERKS: '2000',
  //     KDAUF_AUFK: '500002',
  //     KDPOS_AUFK: '20',
  //     MATNR: 'MAT002',
  //     MATXT: 'Material 2',
  //     AUFNR: '300002',
  //     AUART: 'PP02',
  //     STEXT: 'Pending',
  //     GWEMG: 20,
  //     GAMNG: 200
  //   }
  // ];

  filteredData: any[] = [];
  originalData: any[] = [];
  transporterList: any[] = [];
  loggedInUser: any[] = [];
  plantList: any[] = [];
  divisionList: any[] = [];
  customerList: any[] = [];
  branchList: any[] = [];



  constructor(private fb: FormBuilder,
    private spinner: NgxSpinnerService,
    private service: GeneralserviceService,
    private spinnerService: SpinnerService,


  ) { }

  ngOnInit(): void {
    this.Pendingform = this.fb.group({
      INOUT: ['', Validators.required],
      SAPTYPE: [''],
      FROM_DATE: ['', Validators.required],
      TO_DATE: ['', Validators.required],
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
    this.getTransporters();
    this.fetchpdb();
    this.getBranches();

    const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.loggedInUser = userData.USER || '';
    console.log("Logged in user:", this.loggedInUser);
    this.plantList = userData.PLANTS || [];
    this.divisionList = userData.DIV || [];

    console.log("Plants:", this.plantList);
    console.log("Divisions:", this.divisionList);
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

    this.service.FetchPendingPodReport(payload).subscribe({
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
    const value = this.Pendingform.get('CUSTOMER')?.value;
    console.log("Customer selected:", value);
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

        }
      },
      error: (err) => {
        this.spinner.hide();
        console.error('F4 fetch error', err);
        Swal.fire('Error', 'Failed to load master dropdown data (F4).', 'error');
      }
    });
  }


}


