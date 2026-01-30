import { Component, OnInit } from '@angular/core';

import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { SpinnerService } from 'src/app/spinner.service';
import { GeneralserviceService } from 'src/app/generalservice.service';

interface Plant {
  PLANT: string;
  DIVISION: string;
  PLANT_TEXT: string;
}

interface Division {
  WERKS: string;
  DIVISION: string;
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
  EMP_CODE: string;
  INOUT_TYPE: string;
  CATEGORY: string;
  ROLES: string;
  STATUS: string;
  PLANTS: { WERKS: string }[];
  DIVISIONS: Division[];
  ACTIVITIES: Activity[];
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

  // ===== F4 Data =====
  PlantCodeList: Plant[] = [];
  DivisionList: { DIVISION: string; PLANT: string }[] = [];
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




  // ===== Table Data =====
  users: User[] = [
  ];

  availableRoles: Role[] = [
    { name: 'ADMIN' }
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

  // ================= Reactive Form Init =================
  initForm() {
    this.userForm = this.fb.group({
      USER: ['', Validators.required],
      FIRST_NAME: ['', Validators.required],
      LAST_NAME: [''],
      EMAIL: ['', Validators.required],
      CONTACT: ['', Validators.required],
      PASSWORD: ['', Validators.required],
      EMP_CODE: ['', Validators.required],
      INOUT_TYPE: ['', Validators.required],
      CATEGORY: ['Internal'],
      ROLES: ['', Validators.required],
      STATUS: ['Active'],

      // ✅ ADD THESE
      PLANT: [''],
      DIVISION: [''],

      ACTIVITIES: this.fb.array([])
    });
  }


  // ================= Activities FormArray =================
  get activitiesFormArray(): FormArray {
    return this.userForm.get('ACTIVITIES') as FormArray;
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
  updateDivisionsForSelectedPlants() {
    const selected = this.selectedPlants;

    this.DivisionList = this.PlantCodeList
      .filter(p => selected.includes(p.PLANT))
      .map(p => ({
        DIVISION: p.DIVISION,
        PLANT: p.PLANT
      }));
  }


  onPlantToggle(plant: string, event: any) {
    if (event.target.checked) {
      if (!this.selectedPlants.includes(plant)) {
        this.selectedPlants.push(plant);
      }
    } else {
      this.selectedPlants = this.selectedPlants.filter(p => p !== plant);

      // Also remove divisions of unselected plant
      this.selectedDivisions = this.selectedDivisions.filter(div => {
        return this.PlantCodeList.some(
          p => p.PLANT !== plant && p.DIVISION === div
        );
      });
    }

    // 🔥 VERY IMPORTANT
    this.updateDivisionsForSelectedPlants();
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

  onDivisionToggle(division: string, event: any) {
    if (event.target.checked) {
      if (!this.selectedDivisions.includes(division)) {
        this.selectedDivisions.push(division);
      }
    } else {
      this.selectedDivisions = this.selectedDivisions.filter(d => d !== division);
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
      STATUS: 'Active'
    });

    this.activitiesFormArray.clear();

    this.newUser = this.getEmptyUser();
    this.plantInput = '';
    this.selectedPlantForDivision = '';
    this.divisionInputName = '';
    this.usernameError = false;
  }

  onUsernameChange() {
    this.usernameError = this.userForm.get('USER')?.invalid || false;
  }

  // ================= Modal =================
  openModal() {
    this.showModal = true;
    this.usernameError = false;
    this.fetchPlantCodeList();
  }

  closeModal() {
    this.showModal = false;
    this.resetForm();
    this.editingIndex = null;
  }

  // ================= Status =================
  setStatus(status: string) {
    this.userForm.patchValue({ STATUS: status });
  }

  // ================= Plant / Division (UNCHANGED) =================
  fetchPlantCodeList(): void {
    this.spinner.show();
    this.service.fetchVendorCode().subscribe(
      (res: any) => {
        if (res && res[0]?.PLANT) {
          this.PlantCodeList = res[0].PLANT;
          const uniqueDivisions = Array.from(new Set(this.PlantCodeList.map(p => p.DIVISION)));
          this.DivisionList = uniqueDivisions.map(div => ({
            DIVISION: div,
            PLANT: this.PlantCodeList.find(p => p.DIVISION === div)?.PLANT || ''
          }));
        } else Swal.fire('No Plant Found', '', 'warning');
        this.spinner.hide();
      },
      error => {
        this.spinner.hide();
        Swal.fire('Error fetching plants', '', 'error');
      }
    );
  }

  onPlantChange() {
    const plant = this.userForm.value.PLANT;
    if (!plant) return;

    if (!this.newUser.PLANTS.some(p => p.WERKS === plant)) this.newUser.PLANTS.push({ WERKS: plant });

    this.DivisionList = this.PlantCodeList
      .filter(p => p.PLANT === plant)
      .map(p => ({ DIVISION: p.DIVISION, PLANT: p.PLANT }));

    this.userForm.patchValue({ DIVISION: '' });
  }

  onDivisionChange() {
    const plant = this.userForm.value.PLANT;
    const division = this.userForm.value.DIVISION;

    if (plant && division) {
      const exists = this.newUser.DIVISIONS.some(
        d => d.WERKS === plant && d.DIVISION === division
      );

      if (!exists) {
        this.newUser.DIVISIONS.push({
          WERKS: plant,
          DIVISION: division
        });
      }
    }

    console.log('🟣 Selected Divisions:', this.newUser.DIVISIONS);
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
          EMP_CODE: String(u.EMP_CODE),
          INOUT_TYPE: u.INOUT_TYPE,
          CATEGORY: u.CATEGORY,
          STATUS: u.STATUS === 'ACTIVE' ? 'Active' : u.STATUS,

          // ✅ ROLE
          ROLES: u.TYUSER,

          // ✅ PLANTS (SAFE)
          PLANTS: (u.PLANTS || []).map((p: any) => ({
            WERKS: p.WERKS
          })),

          // ✅ DIVISIONS (SAFE + CORRECT)
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



  // ================= Create / Edit =================
  createUser() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      Swal.fire('Validation Error', 'Please fill required fields', 'warning');
      return;
    }

    const formValue = this.userForm.value;

    const payload = {
      CREATE: {
        USER: formValue.USER,
        FIRST_NAME: formValue.FIRST_NAME,
        LAST_NAME: formValue.LAST_NAME,
        EMAIL: formValue.EMAIL,
        CONTACT: formValue.CONTACT,
        PASSWORD: formValue.PASSWORD,
        EMP_CODE: formValue.EMP_CODE,
        INOUT_TYPE: formValue.INOUT_TYPE,
        CATEGORY: formValue.CATEGORY,
        TYUSER: formValue.ROLES,
        STATUS: formValue.STATUS,

        // Send plants
        PLANTS: this.newUser.PLANTS,

        // Send divisions - SIMPLE FIX
        DIVISIONS: this.newUser.DIVISIONS.map(d => ({
          WERKS: d.WERKS,
          DIVISIONS: d.DIVISION  // Backend expects "DIVISIONS" not "DIVISION"
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
        console.log('📥 Response:', res);

        if (res && res.STATUS === 'TRUE') {
          Swal.fire('Success', 'User created successfully', 'success');
          this.fetchUsers();
          this.closeModal();
        } else {
          Swal.fire('Failed', res?.MESSAGE || 'User creation failed', 'error');
        }
      },
      (error) => {
        this.spinner.hide();
        console.error('❌ Error:', error);
        Swal.fire('Error', 'API Error', 'error');
      }
    );
  }



  editUser(user: User, index: number) {
    this.editingIndex = index;
    this.userForm.patchValue({
      USER: user.USER, FIRST_NAME: user.FIRST_NAME, LAST_NAME: user.LAST_NAME, EMAIL: user.EMAIL,
      CONTACT: user.CONTACT, PASSWORD: user.PASSWORD, EMP_CODE: user.EMP_CODE, INOUT_TYPE: user.INOUT_TYPE,
      CATEGORY: user.CATEGORY, ROLES: user.ROLES, STATUS: user.STATUS
    });

    this.activitiesFormArray.clear();
    user.ACTIVITIES.forEach(a => this.activitiesFormArray.push(this.fb.control(a.ACT)));

    this.newUser.PLANTS = [...user.PLANTS];
    this.newUser.DIVISIONS = [...user.DIVISIONS];

    this.showModal = true;
    this.fetchPlantCodeList();

    setTimeout(() => {
      if (this.newUser.PLANTS.length > 0) {
        const selectedPlant = this.newUser.PLANTS[0].WERKS;
        this.userForm.patchValue({ PLANT: selectedPlant });
        this.DivisionList = this.PlantCodeList
          .filter(p => p.PLANT === selectedPlant)
          .map(p => ({ DIVISION: p.DIVISION, PLANT: p.PLANT }));

        if (this.newUser.DIVISIONS.length > 0)
          this.userForm.patchValue({ DIVISION: this.newUser.DIVISIONS[0].DIVISION });
      }
    }, 300);
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
        STATUS: formValue.STATUS,
        EMP_CODE: formValue.EMP_CODE,
        INOUT_TYPE: formValue.INOUT_TYPE,
        TYUSER: formValue.ROLES,
        CATEGORY: formValue.CATEGORY,

        // Send plants
        PLANTS: this.newUser.PLANTS,

        // Send divisions - SIMPLE FIX
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
        console.log('📥 Response:', res);

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
        console.error('❌ Error:', error);
        Swal.fire('Error', 'API Error', 'error');
      }
    );
  }



  deleteUser(index: number) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.users.splice(index, 1);
    }
  }
}
