import { Store } from "@ngrx/store";
import { ToastrService } from 'ngx-toastr';
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { catchError, Subscription, throwError } from 'rxjs';
import { TaskService } from 'src/app/core/services/task/task.service';
import { HelpersService } from 'src/app/core/services/helpers/helpers.service';
import { selectLoginProfiles } from "../../store/login-profile/login-profile.selectors";
import { autoCompleteValidator } from "../../shared/validations/auto-complete.validation";
import { InfoPanelService } from "../../core/services/info-panel/info-panel.service";
import { ErrorMessages } from "../../shared/enums/error-messages.enum";
import { ServerConnectService } from "../../core/services/server-connect/server-connect.service";

@Component({
  selector: 'app-add-node-deploy-dialog',
  templateUrl: './add-update-node-deploy-dialog.component.html',
  styleUrls: ['./add-update-node-deploy-dialog.component.scss']
})
export class AddUpdateNodeDeployDialogComponent {
  deployNewNodeForm: FormGroup;
  selectLoginProfiles$ = new Subscription();
  loginProfiles: any[] = [];
  errorMessages = ErrorMessages;
  constructor(
    private store: Store,
    private toastr: ToastrService,
    public dialogRef: MatDialogRef<AddUpdateNodeDeployDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public helpers: HelpersService,
    private taskService: TaskService,
    private infoPanelService: InfoPanelService,
    private serverConnectionService: ServerConnectService
  ) {
    this.selectLoginProfiles$ = this.store.select(selectLoginProfiles).subscribe(
      loginProfiles => this.loginProfiles = loginProfiles
    )
    this.deployNewNodeForm = new FormGroup({
      loginProfileCtr: new FormControl('', [autoCompleteValidator(this.loginProfiles)]),
      isBackupVMCtr: new FormControl(true),
      isOSCustomizationCtr: new FormControl(true),
    });
  }

  get isBackupVMCtr() { return this.deployNewNodeForm.get('isBackupVMCtr'); }
  get isOSCustomizationCtr() { return this.deployNewNodeForm.get('isOSCustomizationCtr'); }
  get loginProfileCtr() { return this.helpers.getAutoCompleteCtr(this.deployNewNodeForm.get('loginProfileCtr'), this.loginProfiles) }

  onCancel() {
    this.dialogRef.close();
  }

  deployNodeAddUpdate() {
    const connection = this.serverConnectionService.getConnection();
    const jsonData = {
      connection_id: connection ? connection.id : 0,
      job_name: this.data.jobName,
      category: 'node',
      pks: this.data.activeNodes.map((ele: any) => ele.data('node_id')).join(","),
      backup_vm: this.isBackupVMCtr?.value,
      os_customization: this.isOSCustomizationCtr?.value,
      login_profile_id: this.loginProfileCtr?.value?.id
    };
    this.taskService.add(jsonData).pipe(
      catchError((e: any) => {
        this.toastr.error(e.error.message);
        return throwError(() => e);
      })
    ).subscribe(respData => {
      this.infoPanelService.updateTaskList();
      this.dialogRef.close();
      this.toastr.success("Task added to the queue", 'Success');
    });
  }
}
