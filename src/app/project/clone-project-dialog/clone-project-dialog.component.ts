import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { ToastrService } from 'ngx-toastr';
import { RouteSegments } from 'src/app/core/enums/route-segments.enum';
import { ErrorMessages } from 'src/app/shared/enums/error-messages.enum';
import { ProjectService } from '../services/project.service';
import { HelpersService } from "../../core/services/helpers/helpers.service";
import { throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { loadProjects } from 'src/app/store/project/project.actions';

@Component({
  selector: 'app-clone-project-dialog',
  templateUrl: './clone-project-dialog.component.html',
  styleUrls: ['./clone-project-dialog.component.scss']
})
export class CloneProjectDialogComponent implements OnInit {
  cloneForm!: FormGroup;
  errorMessages = ErrorMessages;
  projectId: any;
  status = 'active';
  listProjects!: any[];
  constructor(
    private projectService: ProjectService,
    private toastr: ToastrService,
    private store: Store,
    private router: Router,
    public dialogRef: MatDialogRef<CloneProjectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private helperService: HelpersService
  ) {
    this.cloneForm = new FormGroup({
      nameCtr: new FormControl('',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(50)
        ]),
      categoryCtr: new FormControl('project')
    });
    this.nameCtr?.setValue(this.data.genData.name);
    this.categoryCtr?.setValue(this.data.category);
  }

  get nameCtr() { return this.cloneForm.get('nameCtr') }
  get categoryCtr() { return this.cloneForm.get('categoryCtr') }

  ngOnInit(): void {
    this.projectId = this.projectService.getProjectId()
  }

  onCancel() {
    this.dialogRef.close();
  }

  cloneProject() {
    if (this.cloneForm.valid) {
      const jsonDataValue = {
        pk: this.projectId,
        category: this.categoryCtr?.value,
        name: this.nameCtr?.value
      }
      const jsonData = this.helperService.removeLeadingAndTrailingWhitespace(jsonDataValue);
      this.projectService.cloneProject(jsonData)
        .pipe(
          catchError(err => {
            this.toastr.error('Clone project failed!', 'Error');
            return throwError(() => err);
          })
        )
        .subscribe(() => {
          if (this.categoryCtr?.value === 'project') {
            this.toastr.success('Clone project successfully', 'Success');
            this.store.dispatch(loadProjects());
            this.router.navigate([RouteSegments.PROJECTS]);
          } else {
            this.toastr.success('Clone project to template successfully', 'Success');
            this.store.dispatch(loadProjects());
            this.router.navigate([RouteSegments.PROJECTS_TEMPLATES]);
          }
          this.dialogRef.close();
        }
        )
    }
  }
}
