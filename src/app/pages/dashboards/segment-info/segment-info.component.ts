import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GeneralserviceService } from 'src/app/generalservice.service';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-segment-info',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
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
      ETA_DATE: [''],
      SUPPLIER: [''],
      CUST_GRP: ['']
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
  }

  // Fetch dropdown data for Non-SAP
  fetchDropdownData() {
    this.spinner.show();
    this.service.getssc().subscribe({
      next: (res: any) => {
        this.spinner.hide();
        const data = res[0];
        this.supplierList = data.SUPPLIERS || [];
        this.segmentList = data.SEGMENTS || [];
        this.custGrpList = data.CUST_GRPS || [];
        this.branchList = data.BRANCH || [];
      },
      error: () => {
        this.spinner.hide();
        Swal.fire('Failed to load dropdown data', '', 'error');
      }
    });
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
        this.spinner.hide();
        if (res.STATUS === 'TRUE') {
          Swal.fire('Saved successfully!', res.MESSAGE, 'success');
          this.segmentInfo.reset();
          this.showForm = false;
        } else {
          Swal.fire('Save failed', res.MESSAGE, 'error');
        }
      },
      error: () => {
        this.spinner.hide();
        Swal.fire('Server error while saving', '', 'error');
      }
    });
  }

  saveSegmentInfoWithoutSAP(): void {
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
      next: () => {
        this.spinner.hide();
        Swal.fire('Non-SAP data saved!', '', 'success');
        this.segmentInfo.reset();
        this.showForm = false;
      },
      error: () => {
        this.spinner.hide();
        Swal.fire('Error saving Non-SAP data', '', 'error');
      }
    });
  }
}
