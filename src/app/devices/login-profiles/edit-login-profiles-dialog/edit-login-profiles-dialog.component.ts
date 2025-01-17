import { Component, Inject, OnInit } from '@angular/core';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { ToastrService } from 'ngx-toastr';
import { LoginProfileService } from 'src/app/core/services/login-profile/login-profile.service';
import { retrievedLoginProfiles } from 'src/app/store/login-profile/login-profile.actions';
import { ErrorMessages } from 'src/app/shared/enums/error-messages.enum';
import { HelpersService } from "../../../core/services/helpers/helpers.service";

@Component({
  selector: 'app-edit-login-profiles-dialog',
  templateUrl: './edit-login-profiles-dialog.component.html',
  styleUrls: ['./edit-login-profiles-dialog.component.scss']
})
export class EditLoginProfilesDialogComponent implements OnInit {
  loginProfileEditForm!: FormGroup;
  isViewMode = false;
  listExtraArgs: any[] = [];
  errorMessages = ErrorMessages;
  visible = true;
  selectable = true;
  removable = true;
  addOnBlur = true;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  constructor(
    private loginProfileService: LoginProfileService,
    private formBuilder: FormBuilder,
    private toastr: ToastrService,
    private store: Store,
    public dialogRef: MatDialogRef<EditLoginProfilesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private helpersService: HelpersService
  ) { }

  get name() { return this.loginProfileEditForm.get('name') };
  get description() { return this.loginProfileEditForm.get('description') };
  get username() { return this.loginProfileEditForm.get('username') };
  get password() { return this.loginProfileEditForm.get('password') };
  get updatePassword() { return this.loginProfileEditForm.get('updatePassword') };
  get category() { return this.loginProfileEditForm.get('category') };
  get extraArgs() { return this.loginProfileEditForm.get('extraArgs') };

  ngOnInit(): void {
    this.isViewMode = this.data.mode == 'view';
    this.loginProfileEditForm = this.formBuilder.group({
      name: [{ value: '', disabled: this.isViewMode }, [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      description: [{ value: '', disabled: this.isViewMode }],
      username: [{ value: '', disabled: this.isViewMode }, Validators.required],
      password: [{ value: '', disabled: this.isViewMode }],
      updatePassword: [{ value: '', disabled: this.isViewMode }],
      category: [{ value: 'local', disabled: this.isViewMode }],
      extraArgs: [{ value: '', disabled: this.isViewMode }],
    });
    this.name?.setValue(this.data.genData.name);
    this.description?.setValue(this.data.genData.description);
    this.username?.setValue(this.data.genData.username);
    this.password?.setValue(this.data.genData.password);
    this.category?.setValue(this.data.genData.category);
    if (this.data.mode !== 'add' ) {
      this.data.genData.extra_args.forEach((el: any) => {
        this.listExtraArgs.push(el);
      });
    }
    if (this.data.mode === 'add') {
      this.password?.setValidators([Validators.required]);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  addExtraArgs(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;
    if ((value || '').trim()) {
      if (this.listExtraArgs.indexOf(value.trim()) == -1) {
        this.listExtraArgs.push(value.trim());
      };
    }
    if (input) {
      input.value = '';
    }
  }

  remove(value: any): void {
    const index = this.listExtraArgs.indexOf(value);

    if (index >= 0) {
      this.listExtraArgs.splice(index, 1);
    }
  }

  addLoginProfile() {
    if (this.loginProfileEditForm.valid) {
      const jsonDataValue = {
        name: this.name?.value,
        description: this.description?.value,
        username: this.username?.value,
        password: this.password?.value,
        category: this.category?.value,
        extra_args: this.listExtraArgs
      }
      const jsonData = this.helpersService.removeLeadingAndTrailingWhitespace(jsonDataValue);
      this.loginProfileService.add(jsonData).subscribe({
        next: (rest) => {
          this.toastr.success(`Add new Login Profile ${rest.result.name} successfully`);
          this.dialogRef.close();
          this.loginProfileService.getAll().subscribe((data: any) => this.store.dispatch(retrievedLoginProfiles({ data: data.result })));
        },
        error: (err) => {
          this.toastr.error(`Error while add login profile `);
        }
      });
    }
  }

  updateLogin() {
    if (this.loginProfileEditForm.valid) {
      const jsonDataValue = {
        name: this.name?.value,
        description: this.description?.value,
        username: this.username?.value,
        update_password: this.updatePassword?.value,
        category: this.category?.value,
        extra_args: this.listExtraArgs
      }
      const jsonData = this.helpersService.removeLeadingAndTrailingWhitespace(jsonDataValue);
      this.loginProfileService.put(this.data.genData.id, jsonData).subscribe(response => {
        this.toastr.success(`Updated Login Profile ${response.result.name} successfully`);
        this.dialogRef.close();
        this.loginProfileService.getAll().subscribe((data: any) => this.store.dispatch(retrievedLoginProfiles({ data: data.result })));
      })
    }
  }

  changeViewToEdit() {
    this.data.mode = 'update';
    this.isViewMode = false;
    this.name?.enable();
    this.description?.enable();
    this.username?.enable();
    this.updatePassword?.enable();
    this.category?.enable();
    this.extraArgs?.enable();
  }

}
