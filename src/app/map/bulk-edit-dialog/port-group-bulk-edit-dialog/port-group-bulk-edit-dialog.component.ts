import { Store } from "@ngrx/store";
import { forkJoin, map, Subscription } from "rxjs";
import { ToastrService } from "ngx-toastr";
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { ErrorMessages } from "../../../shared/enums/error-messages.enum";
import { HelpersService } from "../../../core/services/helpers/helpers.service";
import { PortGroupService } from "../../../core/services/portgroup/portgroup.service";
import { selectDomains } from "../../../store/domain/domain.selectors";
import { autoCompleteValidator } from "../../../shared/validations/auto-complete.validation";
import { retrievedMapSelection } from "src/app/store/map-selection/map-selection.actions";
import { showErrorFromServer } from "src/app/shared/validations/error-server-response.validation";
import { retrievedMapEdit } from "src/app/store/map-edit/map-edit.actions";

@Component({
  selector: 'app-port-group-bulk-edit-dialog',
  templateUrl: './port-group-bulk-edit-dialog.component.html',
  styleUrls: ['./port-group-bulk-edit-dialog.component.scss']
})
export class PortGroupBulkEditDialogComponent implements OnInit, OnDestroy {
  portGroupBulkEdit: FormGroup;
  errorMessages = ErrorMessages;
  domains!: any[];
  selectDomains$ = new Subscription();
  errors: any[] = [];

  constructor(
    private store: Store,
    private toastr: ToastrService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<PortGroupBulkEditDialogComponent>,
    public helpers: HelpersService,
    private portGroupService: PortGroupService
  ) {
    this.selectDomains$ = this.store.select(selectDomains).subscribe(domains => this.domains = domains);
    this.portGroupBulkEdit = new FormGroup({
      domainCtr: new FormControl('', [autoCompleteValidator(this.domains)]),
      vlanCtr: new FormControl('', [
        Validators.pattern('^[0-9]*$'),
        showErrorFromServer(() => this.errors)
      ]),
      categoryCtr: new FormControl(''),
      subnetAllocationCtr: new FormControl(''),
    })
  }

  get domainCtr() { return this.helpers.getAutoCompleteCtr(this.portGroupBulkEdit.get('domainCtr'), this.domains); }
  get vlanCtr() { return this.portGroupBulkEdit.get('vlanCtr'); }
  get categoryCtr() { return this.portGroupBulkEdit.get('categoryCtr'); }
  get subnetAllocationCtr() { return this.portGroupBulkEdit.get('subnetAllocationCtr'); }

  ngOnInit(): void {
  }

  ngOnDestroy() {
    this.selectDomains$.unsubscribe();
  }

  updatePortGroupBulk() {
    const jsonData = {
      ids: this.data.genData.ids,
      domain_id: this.domainCtr?.value.id,
      vlan: this.vlanCtr?.value,
      category: this.categoryCtr?.value,
      subnet_allocation: this.subnetAllocationCtr?.value
    }
    this.portGroupService.editBulk(jsonData).subscribe((response: any) => {
      const pgEditedData: any[] = [];
      return forkJoin(this.data.genData.ids.map((portGroupId: any) => {
        return this.portGroupService.get(portGroupId).pipe(map(pgData => {
          const ele = this.data.cy.getElementById('pg-' + portGroupId);
          const result = pgData.result;
          ele.data('subnet_allocation', result.subnet_allocation);
          ele.data('group', result.groups);
          ele.data('domain', result.domain.id);
          ele.data('vlan', result.vlan);
          pgEditedData.push({
            id: result.id,
            name: result.name,
            category: result.category,
            vlan: result.vlan,
            subnet_allocation: result.subnet_allocation,
            subnet: result.subnet,
            domain: result.domain.name,
            interfaces: result.interfaces
          });
        }));
      }))
        .subscribe(() => {
          this.store.dispatch(retrievedMapEdit({ data: { pgEditedData } }));
          this.helpers.reloadGroupBoxes(this.data.cy);
          this.dialogRef.close();
          this.toastr.success(response.message);
        });
    });
  }

  onCancel() {
    this.dialogRef.close();
  }
}
