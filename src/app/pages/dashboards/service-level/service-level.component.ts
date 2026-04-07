import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, FormsModule ,Validators} from '@angular/forms';
import { GeneralserviceService } from 'src/app/generalservice.service';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { SpinnerService } from 'src/app/spinner.service';


@Component({
  selector: 'app-service-level',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './service-level.component.html',
  styleUrls: ['./service-level.component.css']
})
export class ServiceLevelComponent implements OnInit {

  orderType: string = '';
  sapType: string = '';

  pendingCount = 5;
  completedCount = 10;

  invoicenumber: string = '';
  truckType: string = '';

  OrderInfo!: FormGroup;
  showFeedback: boolean = false;
  feedbackForm!: FormGroup;

 selectedItems: any[] = [];
 invoiceList: string[] = [];
 

   loggedInUser: string = '';

  constructor(private fb: FormBuilder,  private service: GeneralserviceService,
    private spinner: NgxSpinnerService,
    public spinnerService: SpinnerService,) { }

  ngOnInit(): void {
    this.OrderInfo = this.fb.group({
      items: this.fb.array([this.createRow()])
    });
    this.feedbackForm = this.fb.group({

  onTimePlacement: [''],
  transhipment: [''],
  delivery: ['', Validators.required],
  damage: ['', Validators.required],
  accident: ['', Validators.required],
  probiated: [''],
  othermaterials: [''],
  pod: ['', Validators.required],
  freight: ['', Validators.required],
  overall: ['', Validators.required]

});
     const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
    this.loggedInUser = userData.USER || '';
console.log("Logged in user:", this.loggedInUser);
  }

  get items(): FormArray {
    return this.OrderInfo.get('items') as FormArray;
  }

  createRow(): FormGroup {
    return this.fb.group({
      referenceNumber: [''],
      workOrderNumber: [''],
      lrNumber: [''],
      transporter: [''],
       mapId: [''] 
    });
  }

  addRow() {
    this.items.push(this.createRow());
  }

  removeRow(index: number) {
    this.items.removeAt(index);
  }

  onCheckboxChange(event: Event, index: number): void {
    const checkbox = event.target as HTMLInputElement;
    const rowValue = (this.items.at(index) as FormGroup).value;

    if (checkbox.checked) {
      const exists = this.selectedItems.some(
        (item) =>
          item.referenceNumber === rowValue.referenceNumber &&
          item.workOrderNumber === rowValue.workOrderNumber &&
          item.lrNumber === rowValue.lrNumber &&
          item.transporter === rowValue.transporter
      );
      if (!exists) {
        this.selectedItems.push(rowValue);
      }
    } else {
      this.selectedItems = this.selectedItems.filter(
        (item) =>
          !(
            item.referenceNumber === rowValue.referenceNumber &&
            item.workOrderNumber === rowValue.workOrderNumber &&
            item.lrNumber === rowValue.lrNumber &&
            item.transporter === rowValue.transporter
          )
      );
    }

    console.log('✅ Selected Items:', this.selectedItems);
  }

  

isItemSelected(index: number): boolean {
  const rowValue = (this.items.at(index) as FormGroup).value;

  return this.selectedItems.some(
    item =>
      item.referenceNumber === rowValue.referenceNumber &&
      item.workOrderNumber === rowValue.workOrderNumber &&
      item.lrNumber === rowValue.lrNumber &&
      item.transporter === rowValue.transporter
  );
}

  onOrderTypeChange() {

    console.log('Order Type:', this.orderType);

    this.sapType = '';
    this.invoicenumber = '';

    this.OrderInfo = this.fb.group({
      items: this.fb.array([this.createRow()])
    });

  }

 onSapTypeChange() {
  this.truckType = '';
  this.invoicenumber = '';
  this.showFeedback = false;

  // reset table
  this.OrderInfo = this.fb.group({
    items: this.fb.array([this.createItemRow()])
  });

  // clear selected rows
  this.selectedItems = [];
    if (this.feedbackForm) {
    this.feedbackForm.reset();
  }
}
 onTruckTypeChange() {
  this.showFeedback = false;
  this.invoicenumber = '';

  // reset table
  this.OrderInfo = this.fb.group({
    items: this.fb.array([this.createItemRow()])
  });

  // clear selected rows
  this.selectedItems = [];
    if (this.feedbackForm) {
    this.feedbackForm.reset();
  }
}
  // refreshScreen() {
  //   this.orderType = 'Outward';
  //   this.sapType = 'SAP';
  //   this.invoicenumber = '';
  //   this.pendingCount = 5;
  //   this.completedCount = 10;

  //   this.OrderInfo = this.fb.group({
  //     items: this.fb.array([this.createRow()])
  //   });

  //   this.selectedItems = [];

  //   console.log('Screen Refreshed');
  // }

  onInputChange(type: string) {
    console.log('Input changed:', type);
  }

getForm(type: string) {

  console.log('GET clicked for:', type);
  console.log('Invoice No:', this.invoicenumber);
  console.log('Truck Type:', this.truckType);
  console.log('Selected Items:', this.selectedItems);

  if (
    type === 'invoice' &&
    this.invoicenumber.trim() !== '' &&
    this.truckType !== '' &&
    this.selectedItems.length > 0  
  ) {

    this.showFeedback = true;

    Swal.fire({
      icon: 'success',
      title: 'Feedback Form Loaded for Invoice',
      timer: 3000,
      confirmButtonText: 'Ok',
    });

  } 
  else {

    this.showFeedback = false;

    Swal.fire({
      icon: 'warning',
      title: 'Missing Details',
      text: 'Please select at least one Reference row and enter Invoice Number',
      timer: 3000,
      confirmButtonText: 'Ok',
    });

  }
}
    onFieldBlur(index: number, fieldKey: string): void {

    if (!this.items || this.items.length === 0) return;
    if (index !== 0) return;

    const firstRow = this.items.at(0) as FormGroup;
    const values = firstRow.value || {};

    if (
      !values.referenceNumber &&
      !values.workOrderNumber &&
      !values.lrNumber &&
      !values.transporter
    ) {
      this.items.clear();
      this.items.push(this.createItemRow());
      return;
    }

    const obj = {
      global_scr: 'SERVICE LEVEL',
      TYPE_OPTION: this.truckType,
      REF_NO: fieldKey === 'REF_NO' ? values.referenceNumber : '',
      WORK_ORDER_NO: fieldKey === 'WORK_ORDER_NO' ? values.workOrderNumber : '',
      LR_NO: fieldKey === 'LR_NO' ? values.lrNumber : '',
      TRANSPORTER: fieldKey === 'TRANSPORTER' ? values.transporter : '',
      LINE_NO: values.lineNumber || '',
      ZUSER: this.loggedInUser
    };

    console.log('🔹 Sending Object:', obj);

    this.spinner.show();

    let apiCall;

    // 🎯 CONDITION BASED API CALL
    if (this.sapType === 'SAP') {
      apiCall = this.service.GlobalReferenceNoFetch(obj); // POST
    } else {
      apiCall = this.service.GlobalReferenceNoFetchwithoutsap(obj); // PUT
    }

    apiCall.subscribe({
      next: (res: any) => {
        console.log('✅ Response:', res);
        this.spinner.hide();
        this.populateRows(res);
      },
      error: err => {
        console.error('❌ Error:', err);
        this.spinner.hide();
      }
    });
  }

    populateRows(data: any[]): void {
    this.items.clear();

    if (data && data.length > 0) {
      data.forEach(d => {
        this.items.push(
          this.fb.group({
            referenceNumber: [d.REF_NO || ''],
            workOrderNumber: [d.WORK_ORDER_NO || ''],
            lrNumber: [d.LR_NO || ''],
            transporter: [d.TRANSPORTER || ''],
            lineNumber: [d.LINE_NO || ''],
              mapId: [d.MAPID || ''] 
          })
        );
          if (d.INV_NO && d.INV_NO.length > 0) {

        d.INV_NO.forEach((inv: any) => {
          this.invoiceList.push(inv.VBELN);
        });

      }
      });
    } else {
      Swal.fire({
        icon: 'info',
        title: 'No Records Found',
        text: 'No matching reference details were found.',
        timer: 1500,
        showConfirmButton: false,
        width: '300px'
      });
      this.items.push(this.createItemRow());
    }
  }

    createItemRow(): FormGroup {
    return this.fb.group({
      referenceNumber: ['', [
        Validators.required,
        Validators.pattern(/^[0-9]{10}$/)
      ]],
      workOrderNumber: [''],
      lrNumber: [''],
      transporter: [''],
      lineNumber: ['']
    });
  }

  
refreshScreen() {

  // Reset dropdowns
  this.orderType = '';
  this.sapType = '';
  this.truckType = '';

  // Reset invoice
  this.invoicenumber = '';

  // Reset counters
  this.pendingCount = 0;
  this.completedCount = 0;

  // Hide feedback
  this.showFeedback = false;

  // Clear selected rows
  this.selectedItems = [];

  // ✅ Reset feedback reactive form
  if (this.feedbackForm) {
    this.feedbackForm.reset();
  }

  // ✅ Reset OrderInfo form
  this.OrderInfo = this.fb.group({
    items: this.fb.array([this.createItemRow()])
  });

  // Stop spinner if running
  this.spinner.hide();

  console.log('🔄 Screen Fully Refreshed');

}

submitFeedback() {

  // 1️⃣ Check reference selection
  if (this.selectedItems.length === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'No Reference Selected',
      text: 'Please select at least one reference row',
      timer: 2000
    });
    return;
  }

  // 2️⃣ Check invoice
  if (!this.invoicenumber) {
    Swal.fire({
      icon: 'warning',
      title: 'Invoice Missing',
      text: 'Please enter Invoice Number',
      timer: 2000
    });
    return;
  }

  // 3️⃣ Check feedback form
  if (this.feedbackForm.invalid) {
    Swal.fire({
      icon: 'warning',
      title: 'Feedback Missing',
      text: 'Please fill all required feedback fields',
      timer: 2000
    });
    return;
  }

  // 4️⃣ Get form values
  const feedback = this.feedbackForm.value;

  // 5️⃣ Create payload
  const payload = this.selectedItems.map((item, index) => ({

    // POSNR: index + 10,
    ZREFNO: item.referenceNumber,
    ZLINE_NO: item.lineNumber || '',
    VBELN: this.invoicenumber,
    ZLRNO: item.lrNumber,
    ZMAPID: item.mapId,
    ZTRANSPORTER: item.transporter,
    ZWORK_ORDER: item.workOrderNumber,
    ZVEH_TYPE: this.truckType,

    ZONTIME: feedback.onTimePlacement,
    ZTRNSMNT: feedback.transhipment,
    ZONDELV: feedback.delivery,
    ZDAMAGE: feedback.damage,
    ZACCIDENT: feedback.accident,
    ZPROBIATED: feedback.probiated,
    ZLOADTRANSIT: feedback.othermaterials,
    ZONPOD: feedback.pod,
    ZONFREIGHT: feedback.freight,
    ZFEEDBACK: feedback.overall,

    ZTOT_SCORE: '',

    ZPALNT: '',
    ZDIVISION: '',
    ZUSER: this.loggedInUser,
    ZSUBMIT_DT: new Date().toISOString().slice(0, 10)

  }));


  console.log("📦 Payload:", payload);

  this.spinner.show();

  let apiCall;

  if (this.sapType === 'SAP') {
    apiCall = this.service.FeedbackCreationwithsap(payload);
  } else {
    apiCall = this.service.FeedbackCreationwithoutsap(payload);
  }

  apiCall.subscribe({

    next: (res: any) => {

      this.spinner.hide();

      Swal.fire({
        icon: 'success',
        title: 'Feedback Submitted Successfully',
        timer: 2000,
        showConfirmButton: false
      });

      this.feedbackForm.reset();   // ✅ reset form
      this.refreshScreen();

    },

    error: (err) => {

      this.spinner.hide();

      Swal.fire({
        icon: 'error',
        title: 'Submission Failed',
        text: 'Something went wrong',
        timer: 2000
      });

      console.error(err);
    }

  });
}




}
