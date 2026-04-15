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
    this.fetchUsers();

    this.userForm.get('ROLES')?.valueChanges.subscribe(role => {

      if (role === 'ADMIN') {

        this.selectAllActivities();
      } else {

        this.activitiesFormArray.clear();
      }

    });
  }

  userForm!: FormGroup;


  showActivityCard = false;
  showModal = false;
  usernameError = false;
  editingIndex: number | null = null;


  PlantCodeList: Plant[] = [];
  DivisionList: { DIVISION: string; PLANT: string }[] = [];
  viewCardAvailableActivities: string[] = [];
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
  changePassword = false;





  users: User[] = [
  ];

  availableRoles: Role[] = [
    { name: 'ADMIN' },
    { name: 'USER' },
    { name: 'TRANSPORTER' }
  ];

  get filteredRoles(): Role[] {
    const category = this.userForm.get('CATEGORY')?.value;

    if (category === 'External') {
      return this.availableRoles.filter(role => role.name === 'TRANSPORTER');
    }

    return this.availableRoles;
  }

  availableActivities: string[] = [
    // 'Outward-Dashboard',
    'Outward-Dispatch',
    'Outward-OrderInfo',
    'Outward-ShipmentDetails',
    'Outward-InvoiceLoadDetails',
    'Outward-SegmentInfo',
    'Outward-VehicleInfo',
    'Outward-TransitInfo',
    'Outward-FreightBilling',
    'Outward-ServiceLevel',
    'Outward-TransitDamageInfo',
    'Outward-InsuranceClaimTracking',
    'Outward-UserCreation',
    // 'Outward-Reports',
    // 'Outward-TransitReport',
    // 'Outward-PendingPodReport',
  ];


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
      EMAIL: [
        '',
        [
          Validators.required,
          Validators.pattern('^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$')
        ]
      ],
      CONTACT: ['', [Validators.required, Validators.pattern('[0-9]{10}')]],
      PASSWORD: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(10),
          Validators.pattern(/^(?=.*[A-Z])(?=.*\d)[^&*%]*$/)
        ]
      ],
      CONFPSWD: [
        '',
        [
          Validators.required,
          Validators.pattern('^[^&*%]*$')
        ]
      ],
      EMP_CODE: ['', Validators.required],
      INOUT_TYPE: ['', Validators.required],
      CATEGORY: ['Internal'],
      ROLES: ['', Validators.required],
      STATUS: ['Active'],
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
    this.filteredActivities.forEach(activity => {
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

  get filteredActivities() {
    const category = this.userForm.get('CATEGORY')?.value;

    if (category == 'External') {
      return [
        'Outward-TransitInfo',
        'Outward-FreightBilling'
      ];
    }

    return this.availableActivities;
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

  openActivityCard(activities: Activity[], category?: string) {
    this.viewCardTitle = 'Selected Activities';
    this.viewCardData = activities.map(a => a.ACT);

    // ✅ Only show allowed screens for External users
    this.viewCardAvailableActivities = category === 'External'
      ? ['Outward-TransitInfo', 'Outward-FreightBilling']
      : [...this.availableActivities];

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
    if (this.selectedPlants.length === 0) {
      this.DivisionList = [];
      return;
    }

    this.DivisionList = this.PlantCodeList
      .filter(p => this.selectedPlants.includes(p.PLANT))
      .map(p => ({
        DIVISION: p.DIVISION,
        PLANT: p.PLANT
      }));
  }



  onPlantToggle(plant: string, event: any) {

    console.log("Clicked Plant:", plant);
    console.log("Checkbox State:", event.target.checked);
    if (event.target.checked) {
      console.log("Plant Selected");
      if (!this.selectedPlants.includes(plant)) this.selectedPlants.push(plant);


      if (!this.newUser.PLANTS.some(p => p.WERKS === plant)) {
        this.newUser.PLANTS.push({ WERKS: plant });
      }
    } else {
      console.log("Plant Unselected");

      this.selectedPlants = this.selectedPlants.filter(p => p !== plant);


      this.newUser.PLANTS = this.newUser.PLANTS.filter(p => p.WERKS !== plant);

      this.selectedDivisions = this.selectedDivisions.filter(div => {
        return this.newUser.DIVISIONS.some(d => d.DIVISION !== div || d.WERKS !== plant);
      });

      this.newUser.DIVISIONS = this.newUser.DIVISIONS.filter(d => d.WERKS !== plant);
    }

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



  toggleDivisionDropdown() {
    this.showDivisionDropdown = !this.showDivisionDropdown;
  }

  onDivisionToggle(division: string, event: any, plant?: string) {

    const mapping = this.DivisionList.find(
      d => d.DIVISION === division
    );

    const plantCode = mapping?.PLANT;

    if (event.target.checked) {
      console.log("Division Selected");

      // ===== ADD DIVISION (MULTI) =====
      if (!this.selectedDivisions.includes(division)) {
        this.selectedDivisions.push(division);
      }

      if (plantCode) {
        // Add division object
        if (!this.newUser.DIVISIONS.some(d => d.WERKS === plantCode && d.DIVISION === division)) {
          this.newUser.DIVISIONS.push({ WERKS: plantCode, DIVISION: division });
        }

        // ===== AUTO ADD PLANT (MULTI) =====
        // if (!this.selectedPlants.includes(plantCode)) {
        //   this.selectedPlants.push(plantCode);
        // }

        if (!this.newUser.PLANTS.some(p => p.WERKS === plantCode)) {
          this.newUser.PLANTS.push({ WERKS: plantCode });
          console.log("Updated selectedPlants:", this.selectedPlants);
          console.log("Updated newUser.PLANTS:", this.newUser.PLANTS);
        }

      }

    } else {
      console.log("Division Unselected");

      // ===== REMOVE DIVISION =====
      this.selectedDivisions = this.selectedDivisions.filter(d => d !== division);

      if (plantCode) {
        this.newUser.DIVISIONS = this.newUser.DIVISIONS.filter(
          d => !(d.WERKS === plantCode && d.DIVISION === division)
        );

        // ===== REMOVE PLANT ONLY IF NO DIVISIONS LEFT FOR IT =====
        const stillHas = this.newUser.DIVISIONS.some(d => d.WERKS === plantCode);

        if (!stillHas) {
          this.selectedPlants = this.selectedPlants.filter(p => p !== plantCode);
          this.newUser.PLANTS = this.newUser.PLANTS.filter(p => p.WERKS !== plantCode);
        }
      }
    }

    // DO NOT RESET DivisionList HERE ❌
  }



  isDivisionSelected(division: string): boolean {
    return this.selectedDivisions.includes(division);
  }

  getSelectedDivisionsText(): string {
    return this.selectedDivisions.length
      ? this.selectedDivisions.join(', ')
      : 'Select Divisions';
  }


  onCategoryChange(event: any) {

    const category = event.target.value;
    const userId = this.userForm.get('USER').value;

    if (category === 'External') {
      this.userForm.patchValue({
        EMP_CODE: userId
      });
      this.userForm.get('EMP_CODE').disable();
      this.activitiesFormArray.clear();
    } else {
      this.userForm.get('EMP_CODE').enable();
      this.userForm.patchValue({
        EMP_CODE: '',
        ROLES: ''
      });
    }
  }

  onUserIdChange() {
    const category = this.userForm.get('CATEGORY').value;
    if (category === 'External') {
      const userId = this.userForm.get('USER').value;
      this.userForm.patchValue({
        EMP_CODE: userId
      });
    }
  }

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

  // ================= Modal =================
  openModal() {
    this.resetForm(); // reset everything
    this.showModal = true;
    this.changePassword = true;

    this.userForm.get('PASSWORD')?.enable();
    this.userForm.get('CONFPSWD')?.enable();
    // Fetch plant list if needed
    this.fetchPlantCodeList();

    // Make sure dropdowns are closed
    this.showPlantDropdown = false;
    this.showDivisionDropdown = false;
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


  // fetchPlantCodeList(): void {
  //   this.spinner.show();
  //   this.service.fetchVendorCode().subscribe(
  //     (res: any) => {
  //       if (res && res[0]?.PLANT) {
  //         this.PlantCodeList = res[0].PLANT;
  //         const uniqueDivisions = Array.from(new Set(this.PlantCodeList.map(p => p.DIVISION)));
  //         this.DivisionList = uniqueDivisions.map(div => ({
  //           DIVISION: div,
  //           PLANT: this.PlantCodeList.find(p => p.DIVISION === div)?.PLANT || ''
  //         }));
  //       } else Swal.fire('No Plant Found', '', 'warning');
  //       this.spinner.hide();
  //     },
  //     error => {
  //       this.spinner.hide();
  //       Swal.fire('Error fetching plants', '', 'error');
  //     }
  //   );
  // }

  // onPlantChange() {
  //   const plant = this.userForm.value.PLANT;
  //   if (!plant) return;

  //   if (!this.newUser.PLANTS.some(p => p.WERKS === plant)) this.newUser.PLANTS.push({ WERKS: plant });

  //   this.DivisionList = this.PlantCodeList
  //     .filter(p => p.PLANT === plant)
  //     .map(p => ({ DIVISION: p.DIVISION, PLANT: p.PLANT }));

  //   this.userForm.patchValue({ DIVISION: '' });
  // }

  // onDivisionChange() {
  //   const plant = this.userForm.value.PLANT;
  //   const division = this.userForm.value.DIVISION;

  //   if (plant && division) {
  //     const exists = this.newUser.DIVISIONS.some(
  //       d => d.WERKS === plant && d.DIVISION === division
  //     );

  //     if (!exists) {
  //       this.newUser.DIVISIONS.push({
  //         WERKS: plant,
  //         DIVISION: division
  //       });
  //     }
  //   }

  //   console.log('🟣 Selected Divisions:', this.newUser.DIVISIONS);
  // }

  fetchPlantCodeList(): void {

    this.spinner.show();

    this.service.fetchVendorCode().subscribe(
      (res: any) => {

        if (res && res[0]?.PLANT) {

          this.PlantCodeList = res[0].PLANT;

          this.DivisionList = this.PlantCodeList.map(p => ({
            DIVISION: p.DIVISION,
            PLANT: p.PLANT
          }));

          console.log("PlantCodeList:", this.PlantCodeList);
          console.log("DivisionList:", this.DivisionList);

        } else {
          Swal.fire('No Plant Found', '', 'warning');
        }

        this.spinner.hide();
      },

      error => {
        this.spinner.hide();
        Swal.fire('Error fetching plants', '', 'error');
      }
    );
  }

  toggleAllPlants(event: any) {

    if (event.target.checked) {

      this.selectedPlants = this.PlantCodeList.map(p => p.PLANT);

      this.newUser.PLANTS = this.selectedPlants.map(p => ({
        WERKS: p
      }));

      this.updateDivisionsForSelectedPlants();

      // divisions also select
      this.selectedDivisions = this.DivisionList.map(d => d.DIVISION);

      this.newUser.DIVISIONS = this.DivisionList.map(d => ({
        WERKS: d.PLANT,
        DIVISION: d.DIVISION
      }));

    } else {

      this.selectedPlants = [];
      this.selectedDivisions = [];
      this.newUser.PLANTS = [];
      this.newUser.DIVISIONS = [];
    }
  }

  isAllPlantsSelected() {
    return this.selectedPlants.length === this.PlantCodeList.length;
  }

  isAllDivisionsSelected() {
    return this.selectedDivisions.length === this.DivisionList.length;
  }
  toggleAllDivisions(event: any) {

    if (event.target.checked) {

      // select all divisions
      this.selectedDivisions = this.DivisionList.map(d => d.DIVISION);

      this.newUser.DIVISIONS = this.DivisionList.map(d => ({
        WERKS: d.PLANT,
        DIVISION: d.DIVISION
      }));

      // // also select all plants
      // this.selectedPlants = this.PlantCodeList.map(p => p.PLANT);

      // this.newUser.PLANTS = this.selectedPlants.map(p => ({
      //   WERKS: p
      // }));

    } else {

      this.selectedDivisions = [];
      this.newUser.DIVISIONS = [];

      this.selectedPlants = [];
      this.newUser.PLANTS = [];
    }
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
        console.log(' API Response:', res);

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
      this.newUser.PASSWORD = user.PASSWORD;
    this.userForm.patchValue({
      USER: user.USER,
      FIRST_NAME: user.FIRST_NAME,
      LAST_NAME: user.LAST_NAME,
      EMAIL: user.EMAIL,
      CONTACT: user.CONTACT,
      PASSWORD: user.PASSWORD,
      CONFPSWD: user.PASSWORD,
      EMP_CODE: user.EMP_CODE,
      INOUT_TYPE: user.INOUT_TYPE,
      CATEGORY: user.CATEGORY,
      ROLES: user.ROLES,
      STATUS: user.STATUS
    });
    if (user.CATEGORY === 'External') {

      this.userForm.patchValue({
        EMP_CODE: user.USER
      });

      this.userForm.get('EMP_CODE')?.disable();

    } else {
      this.userForm.get('EMP_CODE')?.enable();
    }

    this.changePassword = false;

    this.userForm.get('PASSWORD')?.disable();
    this.userForm.get('CONFPSWD')?.disable();

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
          .map(p => ({ DIVISION: p.DIVISION, PLANT: p.PLANT }));
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
        // PASSWORD: formValue.PASSWORD,
        // CONFPSWD: formValue.CONFPSWD,
        PASSWORD: this.changePassword ? formValue.PASSWORD : this.newUser.PASSWORD,
        CONFPSWD: this.changePassword ? formValue.CONFPSWD : this.newUser.PASSWORD,
        STATUS: formValue.STATUS,
        EMP_CODE: formValue.EMP_CODE,
        INOUT_TYPE: formValue.INOUT_TYPE,
        TYUSER: formValue.ROLES,
        CATEGORY: formValue.CATEGORY,
        ZCHPWRD: this.changePassword ? 'X' : '',

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


  //   deleteUser(index: number) {
  //     Swal.fire({
  //         title: 'Are you sure?',
  //         text: 'Do you want to delete this record? This action cannot be undone.',
  //         icon: 'warning',
  //         showCancelButton: true,
  //         confirmButtonText: 'Yes, Delete',
  //         cancelButtonText: 'Cancel',
  //         confirmButtonColor: '#d33'
  //       }).then((result) => {

  //     if (result.isConfirmed) {
  //       const selectedUser = this.users[index];

  //     const selectedUser = this.users[index];

  //     const payload = {
  //       DEL_USER: selectedUser.USER
  //     };

  //     this.spinner.show();

  //     this.service.UserCreationDelete(payload).subscribe({
  //       next: (res: any) => {
  //         this.spinner.hide();

  //         if (res.STATUS === 'TRUE') {
  //           Swal.fire('Deleted!', res.MESSAGE, 'success');


  //           this.users.splice(index, 1);
  //         } else {
  //           Swal.fire('Failed!', res.MESSAGE, 'error');
  //         }
  //       },
  //       error: (err) => {
  //         this.spinner.hide();
  //         console.error('Delete API Error:', err);
  //         Swal.fire('Error!', 'Something went wrong while deleting user.', 'error');
  //       }
  //     });
  //   }

  //  });
  // }

  blockSpecialChars(event: KeyboardEvent) {
    const forbidden = ['&', '*', '%'];
    if (forbidden.includes(event.key)) {
      event.preventDefault();
    }
  }
  hasForbiddenChars(): boolean {
    const value = this.userForm.get('PASSWORD')?.value || '';
    return /[&*%]/.test(value);
  }

  deleteUser(index: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this record? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d33'
    }).then((result) => {

      if (result.isConfirmed) {
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

    });
  }

onChangePasswordToggle(event: any) {
  this.changePassword = event.target.checked;

  if (this.changePassword) {
    // Enable fields so user can edit
    this.userForm.get('PASSWORD')?.enable();
    this.userForm.get('CONFPSWD')?.enable();
    
    // this.userForm.patchValue({ PASSWORD: '', CONFPSWD: '' });
  } else {
    // Disable fields so user cannot edit
    this.userForm.get('PASSWORD')?.disable();
    this.userForm.get('CONFPSWD')?.disable();
    // Refill old password from this.newUser to keep payload intact
    this.userForm.patchValue({
      PASSWORD: this.newUser.PASSWORD,
      CONFPSWD: this.newUser.PASSWORD
    });
  }
}
}
