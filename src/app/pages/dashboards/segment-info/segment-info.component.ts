import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GeneralserviceService } from 'src/app/generalservice.service';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-segment-info',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule,NgSelectModule],
  templateUrl: './segment-info.component.html',
  styleUrls: ['./segment-info.component.css']
})
export class SegmentInfoComponent implements OnInit {
  segmentInfo!: FormGroup;
  showForm = false;
  isSubmitting = false;

  orderType: string = '';
  sapType: string = '';
  ponumber: string = '';
  invoicenumber: string = '';
  previousOrderType: string | null = null;

  // Dropdown Data
  supplierList: any[] = [];
  segmentList: any[] = [];
  custGrpList: any[] = [];
  branchList: any[] = [];

  constructor(
    private fb: FormBuilder,
    private service: GeneralserviceService,
    private spinner: NgxSpinnerService
  ) { }

  ngOnInit(): void {
    this.segmentInfo = this.fb.group({
      INV_VBELN: [''],
      SALES_EMP: ['', Validators.required],
      SEGMENT: ['', Validators.required],
      CUST_PROF: [''],
      BRANCH: ['', Validators.required],
      BRANCH_ZONE: [''],
      TAT_DAYS: [''],
      ETA_DATE: ['', Validators.required],
      // SUPPLIER: [''],
      // CUST_GRP: ['']
    });
  }

  // Handle Order Type (Inward / Outward)
  onOrderTypeChange() {
    if (this.previousOrderType && this.previousOrderType !== this.orderType) {
      this.sapType = '';
      this.showForm = false;
      this.segmentInfo.reset();
    }
    this.previousOrderType = this.orderType;
  }

  // Handle SAP Type (With / Without)
  onSapTypeChange() {
    if (this.sapType === 'Non-SAP') {
      this.showForm = true;
      this.fetchDropdownData();
    } else {
      this.showForm = false;
    }
  }

  // Input change reset logic
  onInputChange(type: 'purchase' | 'invoice') {
    const value = type === 'purchase' ? this.ponumber : this.invoicenumber;
    if (!value || value.trim() === '') {
      this.showForm = false;
      this.segmentInfo.reset();
    }
  }

  // GET Button Logic (SAP mode)
  getForm(type: 'purchase' | 'invoice') {
    const value = type === 'purchase' ? this.ponumber : this.invoicenumber;
    if (!value || value.trim() === '') return;
    if (this.sapType === 'SAP') {
      this.fetchSAPData(type);
    }
  }

  // Fetch SAP data
  fetchSAPData(type: 'purchase' | 'invoice') {
    const obj = type === 'purchase' ? { VBELN: this.ponumber } : { VBELN: this.invoicenumber };
    this.spinner.show();
    this.service.SegmentInfoInwardOutward(obj).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        if (res && res.length > 0) {
          this.patchForm(res[0]);
          this.showForm = true;
        } else {
          Swal.fire('No data found', '', 'info');
        }
      },
      error: () => {
        this.spinner.hide();
        Swal.fire('Error fetching SAP data', '', 'error');
      }
    });
  }

  // Patch form with fetched SAP data
  patchForm(data: any) {
    this.segmentInfo.patchValue({
      INV_VBELN: data.INV_VBELN || '',
      SALES_EMP: data.SALES_EMP || '',
      SEGMENT: data.SEGMENT || '',
      CUST_PROF: data.CUST_PROF || '',
      BRANCH: data.BRANCH || '',
      BRANCH_ZONE: data.BRANCH_ZONE || '',
      TAT_DAYS: data.TAT_DAYS || '',
      ETA_DATE: data.ETA_DATE || ''
    });
    this.segmentInfo.markAllAsTouched();
  }

  // Fetch dropdown data for Non-SAP
  fetchDropdownData() {
    this.spinner.show();
    this.service.getssc().subscribe((res: any) => {
      this.spinner.hide();
      console.log("fetchDropdownData res",res)
      const data = res[0];
      this.supplierList = data.SUPPLIERS || [];
      this.segmentList = data.SEGMENTS || [];
      this.custGrpList = data.CUST_GRPS || [];
      this.branchList = data.BRANCH || [];
    }, error => {
      this.spinner.hide();
    })

  }

  // Save button handler
  savePlan() {
    if (this.sapType === 'SAP') {
      this.saveSegmentInfoWithSAP();
    } else {
      this.saveSegmentInfoWithoutSAP();
    }
  }

  saveSegmentInfoWithSAP(): void {
    this.segmentInfo.markAllAsTouched();

    // Stop if form is invalid
    if (this.segmentInfo.invalid) {
      Swal.fire({
        title: 'Validation Error',
        text: 'Please fill all required fields before saving.',
        icon: 'warning',
        confirmButtonText: 'Ok',
        timer: 4000
      });
      return;
    }
    const formValue = this.segmentInfo.value;
    const payload = {
      SAVE: [
        {
          INV_VBELN: formValue.INV_VBELN,
          SALES_EMP: formValue.SALES_EMP,
          SEGMENT: formValue.SEGMENT,
          CUST_PROF: formValue.CUST_PROF,
          BRANCH: formValue.BRANCH,
          BRANCH_ZONE: formValue.BRANCH_ZONE,
          TAT_DAYS: formValue.TAT_DAYS,
          ETA_DATE: formValue.ETA_DATE
        }
      ]
    };
    this.spinner.show();
    this.service.SegmentInfoOutwardSave(payload).subscribe({
      next: (res: any) => {

        if (res.STATUS == "true" || res.NUMBER == "200") {
          Swal.fire({
            title: '',
            text: res.MESSAGE,
            icon: 'success',
            cancelButtonText: 'Ok',
            timer: 5000
          }).then((result) => {
            if (result) {
              // Handle confirmation if needed
            } else {
              // Handle cancel if needed
            }
          });
          this.segmentInfo.reset()
          this.spinner.hide()
          this.showForm = false;
        } else {
          Swal.fire({
            title: '',
            text: res.MESSAGE,
            icon: 'success',
            cancelButtonText: 'Ok',
            timer: 5000
          }).then((result) => {
            if (result) {
              // Handle confirmation if needed
            } else {
              // Handle cancel if needed
            }
            this.spinner.hide()
          });
          this.spinner.hide()
        }
      },
      error: () => {
        this.spinner.hide();
        Swal.fire('Server error while saving', '', 'error');
      }
    });
  }

  saveSegmentInfoWithoutSAP(): void {
    this.segmentInfo.markAllAsTouched();

    // Stop if form is invalid
    if (this.segmentInfo.invalid) {
      Swal.fire({
        title: 'Validation Error',
        text: 'Please fill all required fields before saving.',
        icon: 'warning',
        confirmButtonText: 'Ok',
        timer: 4000
      });
      return;
    }
    const formValue = this.segmentInfo.value;
    const payload = {
      CREATE: [
        {
          SALES_EMP: formValue.SALES_EMP,
          SEGMENT: formValue.SEGMENT,
          CUST_PROF: formValue.CUST_PROF,
          BRANCH: formValue.BRANCH,
          CUST_GRP: formValue.CUST_GRP,
          SUPPLIER: formValue.SUPPLIER,
          TAT_DAYS: formValue.TAT_DAYS,
          ETA_DATE: formValue.ETA_DATE
        }
      ]
    };
    this.spinner.show();
    this.service.SegmentInfoNonSap(payload).subscribe({
      next: (res: any) => {
        if (res.STATUS == "true" || res.NUMBER == "200") {
          Swal.fire({
            title: '',
            text: res.MESSAGE,
            icon: 'success',
            cancelButtonText: 'Ok',
            timer: 5000
          }).then((result) => {
            if (result) {
              // Handle confirmation if needed
            } else {
              // Handle cancel if needed
            }
          });
          this.segmentInfo.reset()
          this.spinner.hide()
          this.showForm = true;
        } else {
          Swal.fire({
            title: '',
            text: res.MESSAGE,
            icon: 'success',
            cancelButtonText: 'Ok',
            timer: 5000
          }).then((result) => {
            if (result) {
              // Handle confirmation if needed
            } else {
              // Handle cancel if needed
            }
            this.spinner.hide()
          });
          this.spinner.hide()
        }
      },
      error: () => {
        this.spinner.hide();
        Swal.fire('Error saving Non-SAP data', '', 'error');
      }
    });
  }

  // fetchzonechange() {
  //   const branchDesc = this.segmentInfo.value.BRANCH;

  //   if (!branchDesc) {
  //     this.segmentInfo.patchValue({
  //       BRANCH_ZONE: '',
  //       TAT_DAYS: ''
  //     });
  //     return;
  //   }

  //   const obj = { STATE: branchDesc };  // Send branchDesc as STATE

  //   this.spinner.show();
  //   this.service.fetchzoneTat(obj).subscribe({
  //     next: (res: any) => {
  //       this.spinner.hide();
  //       this.segmentInfo.patchValue({
  //         BRANCH_ZONE: res.ZZONE || '',
  //         TAT_DAYS: res.ZZTAT || ''
  //       });
  //     },
  //     error: () => {
  //       this.spinner.hide();
  //       Swal.fire('Error fetching Zone & TAT', '', 'error');
  //       this.segmentInfo.patchValue({
  //         BRANCH_ZONE: '',
  //         TAT_DAYS: ''
  //       });
  //     }
  //   });
  // }
  fetchzonechange() {
    // Only execute for Non-SAP orders
    if (this.sapType !== 'Non-SAP') {
      return;
    }

    const branchDesc = this.segmentInfo.value.BRANCH;

    // Reset if no branch is selected
    if (!branchDesc) {
      this.segmentInfo.patchValue({
        BRANCH_ZONE: '',
        TAT_DAYS: ''
      });
      return;
    }

    const obj = { STATE: branchDesc };  // Send branchDesc as STATE

    this.spinner.show();
    this.service.fetchzoneTat(obj).subscribe({
      next: (res: any) => {
        this.spinner.hide();
        this.segmentInfo.patchValue({
          BRANCH_ZONE: res.ZZONE || '',
          TAT_DAYS: res.ZZTAT || ''
        });
      },
      error: () => {
        this.spinner.hide();
        Swal.fire('Error fetching Zone & TAT', '', 'error');
        this.segmentInfo.patchValue({
          BRANCH_ZONE: '',
          TAT_DAYS: ''
        });
      }
    });
  }


}
