import { Component, OnInit } from '@angular/core';

import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { SpinnerService } from 'src/app/spinner.service';
import { GeneralserviceService } from 'src/app/generalservice.service';

interface Plant {
  PLANT: string;
  PLANT_DESC: string;
  DIVISION?: string;   
}

interface Division {
  WERKS: string;
  DIVISION: string;
  DIVISION_DESC?: string;
}

interface Activity {
  ACT: string;
}

interface Role {
  name: string;
}

interface User {
  USER: string;
  FIRST_NAME: string;
  LAST_NAME: string;
  EMAIL: string;
  CONTACT: string;
  PASSWORD: string;
  CONFPSWD: string;
  EMP_CODE: string;
  INOUT_TYPE: string;
  CATEGORY: string;
  ROLES: string;
  STATUS: string;
  PLANTS: { WERKS: string }[];
  DIVISIONS: Division[];
  ACTIVITIES: Activity[];
}

interface DeleteUserResponse {
  STATUS: string;
  MESSAGE: string;
  NUMBER: string;
}

@Component({
  selector: 'app-user-creation',
  templateUrl: './user-creation.component.html',
  styleUrls: ['./user-creation.component.css']
})
export class UserCreationComponent implements OnInit {

  ngOnInit() {
    this.fetchUsers();   // 🔥 THIS WAS MISSING
  }


  // ===== Reactive Form =====
  userForm!: FormGroup;

  // ===== UI State =====
  showActivityCard = false;
  showModal = false;
  usernameError = false;
  editingIndex: number | null = null;

 PlantCodeList: Plant[] = [];
DivisionList: Division[] = [];
  showActivityModal = false;




  plantInput = '';
  divisionInputName = '';
  selectedPlantForDivision = '';
  showPlantPopup = false;
  showDivisionPopup = false;

  selectedPlantsPopup: any[] = [];
  selectedDivisionsPopup: any[] = [];
  showViewCard = false;
  viewCardTitle = '';
  viewCardData: string[] = [];
  showPlantDropdown = false;
  showDivisionDropdown = false;

  selectedPlants: string[] = [];
  selectedDivisions: string[] = [];
  showPassword = false;
  showConfirmPassword = false;
  plantDivisionMap: any = {};
divisionPlantMap: any = {};




  // ===== Table Data =====
  users: User[] = [
  ];

  availableRoles: Role[] = [
    { name: 'ADMIN' },
    { name: 'USER' },
    { name: 'TRANSPORTER' }
  ];

  availableActivities: string[] = [
    'Outward-Dashboard',
    'Outward-Dispatch',
    'Outward-OrderInfo',
    'Outward-ShipmentDetails',
    'Outward-InvoiceLoadDetails',
    'Outward-SegmentInfo',
    'Outward-VehicleInfo',
    'Outward-TransitInfo',
    'Outward-FreightBilling',
    'Outward-TransitDamageInfo',
    'Outward-InsuranceClaimTracking',
    'Outward-UserCreation'
  ];

  // ===== Non-form arrays (kept same for Plant/Division) =====
  newUser: User = this.getEmptyUser();

  constructor(
    private fb: FormBuilder,
    private spinner: NgxSpinnerService,
    private service: GeneralserviceService,
    private spinnerService: SpinnerService
  ) {
    this.initForm();
  }


  initForm() {
    this.userForm = this.fb.group({
      USER: ['', Validators.required],
      FIRST_NAME: ['', Validators.required],
      LAST_NAME: [''],
      EMAIL: ['', Validators.required],
      CONTACT: ['', Validators.required],
      PASSWORD: ['', Validators.required],
      CONFPSWD: ['', Validators.required],
      EMP_CODE: ['', Validators.required],
      INOUT_TYPE: ['', Validators.required],
      CATEGORY: ['Internal'],
      ROLES: ['', Validators.required],
      STATUS: ['Active'],

      // ✅ ADD THESE
      PLANT: [''],
      DIVISION: [''],

      ACTIVITIES: this.fb.array([])
    }, { validators: this.passwordMatchValidator }); 
  }



  get activitiesFormArray(): FormArray {
    return this.userForm.get('ACTIVITIES') as FormArray;
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

    toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  isActivitySelected(activity: string): boolean {
    return this.activitiesFormArray.value.includes(activity);
  }

  selectActivity(activity: string) {
    const index = this.activitiesFormArray.value.indexOf(activity);

    if (index > -1) {
      this.activitiesFormArray.removeAt(index);
    } else {
      this.activitiesFormArray.push(this.fb.control(activity));
    }
  }
  selectAllActivities() {
    this.activitiesFormArray.clear();
    this.availableActivities.forEach(activity => {
      this.activitiesFormArray.push(this.fb.control(activity));
    });
  }
  passwordMatchValidator(form: FormGroup) {
  const password = form.get('PASSWORD')?.value;
  const confirm = form.get('CONFPSWD')?.value;

  if (password && confirm && password !== confirm) {
    form.get('CONFPSWD')?.setErrors({ mismatch: true });
  } else {
    // Clear mismatch error only (keep required error if empty)
    const errors = form.get('CONFPSWD')?.errors;
    if (errors) {
      delete errors['mismatch'];
      form.get('CONFPSWD')?.setErrors(Object.keys(errors).length ? errors : null);
    }
  }
  return null;
}

  deselectAllActivities() {
    this.activitiesFormArray.clear();
  }

  toggleActivityModal() {
    this.showActivityModal = !this.showActivityModal;
  }

  openPlantCard(plants: { WERKS: string }[]) {
    this.viewCardTitle = 'Selected Plants';
    this.viewCardData = plants.map(p => p.WERKS);
    this.showViewCard = true;
  }

  openDivisionCard(divisions: { WERKS: string; DIVISION: string }[]) {
    this.viewCardTitle = 'Selected Divisions';
    this.viewCardData = divisions.map(d =>
      `${d.WERKS} - ${d.DIVISION || '-'}`
    );
    this.showViewCard = true;
  }

  openActivityCard(activities: Activity[]) {
    this.viewCardTitle = 'Selected Activities';
    this.viewCardData = activities.map(a => a.ACT);
    this.showViewCard = true;
  }

  closeViewCard() {
    this.showViewCard = false;
    this.viewCardTitle = '';
    this.viewCardData = [];
  }

  // ================= Plant / Division Multi-select =================
  togglePlantDropdown() {
    this.showPlantDropdown = !this.showPlantDropdown;
  }



onPlantToggle(plant: string, event: any) {

  console.log("Plant received:", plant);

  if (event.target.checked) {

    console.log("Plant checked:", plant);

    if (!this.selectedPlants.includes(plant)) {
      this.selectedPlants.push(plant);
      this.newUser.PLANTS.push({ WERKS: plant });
    }

    const divisions = this.plantDivisionMap[plant] || [];

    for (let i = 0; i < divisions.length; i++) {

      const div = divisions[i];

      if (!this.selectedDivisions.includes(div)) {

        this.selectedDivisions.push(div);

        this.newUser.DIVISIONS.push({
          WERKS: plant,
          DIVISION: div
        });

      }

    }

  } else {

    console.log("Plant unchecked:", plant);

    // remove plant
    this.selectedPlants = this.selectedPlants.filter(p => p !== plant);

    this.newUser.PLANTS = this.newUser.PLANTS.filter(p => p.WERKS !== plant);

    // remove related divisions
    const divisions = this.plantDivisionMap[plant] || [];

    this.selectedDivisions = this.selectedDivisions.filter(
      d => !divisions.includes(d)
    );

    this.newUser.DIVISIONS = this.newUser.DIVISIONS.filter(
      d => d.WERKS !== plant
    );

    console.log("Updated Plants:", this.selectedPlants);
    console.log("Updated Divisions:", this.selectedDivisions);
  }

}


  isPlantSelected(plant: string): boolean {
    return this.selectedPlants.includes(plant);
  }

  getSelectedPlantsText(): string {
    return this.selectedPlants.length
      ? this.selectedPlants.join(', ')
      : 'Select Plants';
  }


  /* ---------- DIVISIONS ---------- */
  toggleDivisionDropdown() {
    this.showDivisionDropdown = !this.showDivisionDropdown;
  }
onDivisionToggle(div: Division, event: any) {

  const division = div.DIVISION_DESC;

  console.log("Division:", division);

  if (event.target.checked) {

    console.log("Division checked:", division);

    if (!this.selectedDivisions.includes(division)) {

      this.selectedDivisions.push(division);

      this.newUser.DIVISIONS.push({
        WERKS: '',
        DIVISION: division
      });

    }


  } else {

    console.log("Division unchecked:", division);

    this.selectedDivisions = this.selectedDivisions.filter(d => d !== division);

    this.newUser.DIVISIONS = this.newUser.DIVISIONS.filter(
      d => d.DIVISION !== division
    );

    console.log("Updated Divisions:", this.selectedDivisions);

  }

}



  isDivisionSelected(division: string): boolean {
    return this.selectedDivisions.includes(division);
  }

  getSelectedDivisionsText(): string {
    return this.selectedDivisions.length
      ? this.selectedDivisions.join(', ')
      : 'Select Divisions';
  }




  // ================= Helpers =================
  getEmptyUser(): User {
    return {
      USER: '',
      FIRST_NAME: '',
      LAST_NAME: '',
      EMAIL: '',
      CONTACT: '',
      PASSWORD: '',
      CONFPSWD: '',
      EMP_CODE: '',
      INOUT_TYPE: '',
      CATEGORY: 'Internal',
      ROLES: '',
      STATUS: 'Active',
      PLANTS: [],
      DIVISIONS: [],
      ACTIVITIES: []
    };
  }

  resetForm() {
    this.userForm.reset({
      CATEGORY: 'Internal',
      STATUS: 'Active',
      PLANT: '',
      DIVISION: ''
    });

    this.activitiesFormArray.clear();

    // Clear selections
    this.newUser = this.getEmptyUser();
    this.selectedPlants = [];
    this.selectedDivisions = [];

    this.plantInput = '';
    this.selectedPlantForDivision = '';
    this.divisionInputName = '';
    this.usernameError = false;

    // ✅ Close dropdowns
    this.showPlantDropdown = false;
    this.showDivisionDropdown = false;
  }



  onUsernameChange() {
    this.usernameError = this.userForm.get('USER')?.invalid || false;
  }


  openModal() {
    this.resetForm(); 
    this.showModal = true; 
    this.fetchPlantCodeList();
    this.showPlantDropdown = false;
    this.showDivisionDropdown = false;
  }



  closeModal() {
    this.showModal = false;
    this.resetForm();
    this.editingIndex = null;
  }


  
  setStatus(status: string) {
    this.userForm.patchValue({ STATUS: status });
  }

  
fetchPlantCodeList(): void {

  this.spinner.show();

  this.service.getpdb().subscribe(
    (res: any) => {

      if (res && res[0]) {

        this.PlantCodeList = res[0].PLANT || [];
        this.DivisionList = res[0].DIVISION || [];
          this.plantDivisionMap = {};
        this.divisionPlantMap = {};

       
        this.PlantCodeList.forEach((plant: any, index: number) => {

          const div = this.DivisionList[index];

          if (div) {

            if (!this.plantDivisionMap[plant.PLANT]) {
              this.plantDivisionMap[plant.PLANT] = [];
            }

            this.plantDivisionMap[plant.PLANT].push(div.DIVISION_DESC);

            if (!this.divisionPlantMap[div.DIVISION_DESC]) {
              this.divisionPlantMap[div.DIVISION_DESC] = [];
            }

            this.divisionPlantMap[div.DIVISION_DESC].push(plant.PLANT);

          }

        });

        console.log("Plant → Division Map", this.plantDivisionMap);
        console.log("Division → Plant Map", this.divisionPlantMap);

      }

      this.spinner.hide();
    },
    error => {
      this.spinner.hide();
      Swal.fire('Error fetching F4 data', '', 'error');
    }
  );
}




  removePlant(index: number) {
    this.newUser.PLANTS.splice(index, 1);
  }



  removeDivision(index: number) {
    this.newUser.DIVISIONS.splice(index, 1);
  }


  fetchUsers() {
    this.spinner.show();

    this.service.UserCreationDisplayTable().subscribe(
      (res: any[]) => {
        this.spinner.hide();
        console.log('🟢 API Response:', res);

        if (!Array.isArray(res)) {
          this.users = [];
          return;
        }

        this.users = res.map(u => ({
          USER: u.USER,
          FIRST_NAME: u.FIRST_NAME,
          LAST_NAME: u.LAST_NAME,
          EMAIL: u.EMAIL,
          CONTACT: u.CONTACT,
          PASSWORD: u.PASSWORD,
          CONFPSWD: u.CONFPSWD,
          EMP_CODE: String(u.EMP_CODE),
          INOUT_TYPE: u.INOUT_TYPE,
          CATEGORY: u.CATEGORY,
          STATUS: u.STATUS === 'ACTIVE' ? 'Active' : u.STATUS,

         
          ROLES: u.TYUSER,

       
          PLANTS: (u.PLANTS || []).map((p: any) => ({
            WERKS: p.WERKS
          })),

          
          DIVISIONS: (u.DIVISIONS || []).map((d: any) => ({
            WERKS: d.WERKS,
            DIVISION: d.DIVISION || '-'
          })),

          // ✅ ACTIVITIES
          ACTIVITIES: (u.ACTIVITY || []).map((a: any) => ({
            ACT: a.ACT
          }))
        }));
      },
      error => {
        this.spinner.hide();
        console.error('❌ Display Error:', error);
        Swal.fire('Error', 'Failed to load users', 'error');
      }
    );
  }



 
  createUser() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      Swal.fire('Validation Error', 'Please fill required fields', 'warning');
      return;
    }

    const formValue = this.userForm.value;

    // Prepare payload
    const payload = {
      CREATE: {
        USER: formValue.USER,
        FIRST_NAME: formValue.FIRST_NAME,
        LAST_NAME: formValue.LAST_NAME,
        EMAIL: formValue.EMAIL,
        CONTACT: formValue.CONTACT,
        PASSWORD: formValue.PASSWORD,
        CONFPSWD: formValue.CONFPSWD,
        EMP_CODE: formValue.EMP_CODE,
        INOUT_TYPE: formValue.INOUT_TYPE,
        CATEGORY: formValue.CATEGORY,
        TYUSER: formValue.ROLES,
        STATUS: formValue.STATUS,

        // Send plants
        PLANTS: this.newUser.PLANTS,

        // Send divisions in backend expected format
        DIVISIONS: this.newUser.DIVISIONS.map(d => ({
          WERKS: d.WERKS,
          DIVISIONS: d.DIVISION
        })),

        // Send activities
        ACTIVITY: formValue.ACTIVITIES.map((a: string) => ({ ACT: a }))
      }
    };

    console.log('📤 Sending Payload:', payload);

    this.spinner.show();
    this.service.GlobalUserAuth(payload).subscribe(
      (res: any) => {
        this.spinner.hide();
        if (res?.STATUS === 'TRUE') {
          Swal.fire('Success', 'User created successfully', 'success');
          this.fetchUsers();      
          this.closeModal();     
        } else {
          Swal.fire('Failed', res?.MESSAGE || 'User creation failed', 'error');
        }
      },
      (error) => {
        this.spinner.hide();
        Swal.fire('Error', 'API Error', 'error');
      }
    );
  }




  editUser(user: User, index: number) {
    this.editingIndex = index;
    this.userForm.patchValue({
      USER: user.USER,
      FIRST_NAME: user.FIRST_NAME,
      LAST_NAME: user.LAST_NAME,
      EMAIL: user.EMAIL,
      CONTACT: user.CONTACT,
      PASSWORD: user.PASSWORD,
      CONFPSWD: user.CONFPSWD,
      EMP_CODE: user.EMP_CODE,
      INOUT_TYPE: user.INOUT_TYPE,
      CATEGORY: user.CATEGORY,
      ROLES: user.ROLES,
      STATUS: user.STATUS
    });

    this.activitiesFormArray.clear();
    user.ACTIVITIES.forEach(a => this.activitiesFormArray.push(this.fb.control(a.ACT)));

    // Populate plants/divisions
    this.newUser.PLANTS = [...user.PLANTS];
    this.newUser.DIVISIONS = [...user.DIVISIONS];
    this.selectedPlants = user.PLANTS.map(p => p.WERKS);
    this.selectedDivisions = user.DIVISIONS.map(d => d.DIVISION);

    this.showModal = true;
    this.fetchPlantCodeList();

setTimeout(() => {
  if (this.newUser.PLANTS.length > 0) {
    const selectedPlant = this.newUser.PLANTS[0].WERKS;

    this.userForm.patchValue({ PLANT: selectedPlant });

    this.DivisionList = this.PlantCodeList
      .filter(p => this.selectedPlants.includes(p.PLANT))
      .map(p => ({
        WERKS: p.PLANT,
        DIVISION: p.DIVISION || ''
      }));
  }
}, 200);

}
  updateUser() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      Swal.fire('Validation Error', 'Please fill required fields', 'warning');
      return;
    }
 
    const formValue = this.userForm.value;
 
    const payload = {
      EDIT: {
        USER: formValue.USER,
        FIRST_NAME: formValue.FIRST_NAME,
        LAST_NAME: formValue.LAST_NAME,
        EMAIL: formValue.EMAIL,
        CONTACT: formValue.CONTACT,
        PASSWORD: formValue.PASSWORD,
        CONFPSWD: formValue.CONFPSWD,
        STATUS: formValue.STATUS,
        EMP_CODE: formValue.EMP_CODE,
        INOUT_TYPE: formValue.INOUT_TYPE,
        TYUSER: formValue.ROLES,
        CATEGORY: formValue.CATEGORY,
 
        // Send plants
        PLANTS: this.newUser.PLANTS,
 
        // Send divisions
        DIVISIONS: this.newUser.DIVISIONS.map(d => ({
          WERKS: d.WERKS,
          DIVISIONS: d.DIVISION
        })),
 
        // Send activities
        ACTIVITY: this.activitiesFormArray.value.map((a: string) => ({ ACT: a }))
      }
    };
 
    console.log('📤 Update Payload:', payload);
 
    this.spinner.show();
    this.service.GlobalUserAuth(payload).subscribe(
      (res: any) => {
        this.spinner.hide();
        if (res?.STATUS === 'TRUE') {
          Swal.fire('Success', 'User updated successfully', 'success');
          this.fetchUsers();
          this.closeModal();
        } else {
          Swal.fire('Failed', res?.MESSAGE || 'Update failed', 'error');
        }
      },
      (error) => {
        this.spinner.hide();
        Swal.fire('Error', 'API Error', 'error');
      }
    );
  }
  deleteUser(index: number) {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }
 
    const selectedUser = this.users[index];
 
    const payload = {
      DEL_USER: selectedUser.USER  
    };
 
    this.spinner.show();
 
    this.service.UserCreationDelete(payload).subscribe({
      next: (res: any) => {  
        this.spinner.hide();
 
        if (res.STATUS === 'TRUE') {
          Swal.fire('Deleted!', res.MESSAGE, 'success');
 
         
          this.users.splice(index, 1);
        } else {
          Swal.fire('Failed!', res.MESSAGE, 'error');
        }
      },
      error: (err) => {
        this.spinner.hide();
        console.error('Delete API Error:', err);
        Swal.fire('Error!', 'Something went wrong while deleting user.', 'error');
      }
    });
  }
 

}
