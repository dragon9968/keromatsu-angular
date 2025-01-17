import { Component, OnInit, ViewChild } from '@angular/core';
import { catchError, Observable, Subscription, throwError } from "rxjs";
import { Store } from '@ngrx/store';
import { ToastrService } from "ngx-toastr";
import { RouteSegments } from 'src/app/core/enums/route-segments.enum';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators, FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { ProjectService } from 'src/app/project/services/project.service';
import { selectActiveTemplates, selectAllProjects } from 'src/app/store/project/project.selectors';
import { validateNameExist } from 'src/app/shared/validations/name-exist.validation';
import { ErrorMessages } from 'src/app/shared/enums/error-messages.enum';
import { AgGridAngular } from 'ag-grid-angular';
import { AppPrefService } from 'src/app/core/services/app-pref/app-pref.service';
import { ColDef, GridApi, GridReadyEvent, ValueSetterParams } from 'ag-grid-community';
import { ButtonRenderersComponent } from '../renderers/button-renderers-component';
import { ConfirmationDialogComponent } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { HelpersService } from 'src/app/core/services/helpers/helpers.service';
import { selectAppPref } from 'src/app/store/app-pref/app-pref.selectors';
import { loadAppPref } from 'src/app/store/app-pref/app-pref.actions';
import { MatRadioChange } from '@angular/material/radio';
import { autoCompleteValidator } from 'src/app/shared/validations/auto-complete.validation';
import { MapPrefService } from 'src/app/core/services/map-pref/map-pref.service';
import { retrievedMapPrefs } from 'src/app/store/map-pref/map-pref.actions';
import { selectMapPrefs } from 'src/app/store/map-pref/map-pref.selectors';
import { vlanValidator } from "../../shared/validations/vlan.validation";
import { ErrorStateMatcher } from "@angular/material/core";
import { RolesService } from 'src/app/core/services/roles/roles.service';
import { loadProjects } from 'src/app/store/project/project.actions';

class CrossFieldErrorMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    return !!control?.dirty && (
      control?.errors?.['required'] ||
      form?.errors?.['isVlanInvalid'] ||
      form?.errors?.['isMaxVLANInValid']
    );
  }
}

@Component({
  selector: 'app-add-project',
  templateUrl: './add-project.component.html',
  styleUrls: ['./add-project.component.scss']
})
export class AddProjectComponent implements OnInit {
  @ViewChild(AgGridAngular) agGrid!: AgGridAngular;
  private gridApi!: GridApi;
  isSubmitBtnDisabled = false;
  selectAppPref$ = new Subscription();
  selectDefaultMapPref$ = new Subscription();
  labelPosition = 'blank';
  projectForm!: FormGroup;
  errorMatcher = new CrossFieldErrorMatcher();
  routeSegments = RouteSegments;
  errorMessages = ErrorMessages;
  selectAllProjects$ = new Subscription();
  selectActiveTemplates$ = new Subscription();
  projects!: any[];
  activeTemplates!: any[];
  rowData!: any[];
  checked = false;
  status = 'active';
  dataClone: any;
  isDisableButton = false;
  isHiddenNetwork = false;
  isHiddenTemplate = false;
  isHiddenOption = true;
  appPrefDefault!: any[];
  isDisableTemplate = true;
  isCreateNewFromSelected = false;
  filteredTemplate!: Observable<any[]>;
  selectedDefaultMapPref: any;
  selectedMapPrefByAppPref: any;

  defaultColDef: ColDef = {
    sortable: true,
    resizable: true,
    editable: true,
  };
  columnDefs: ColDef[] = [
    { headerName: '',
      editable: false,
      maxWidth: 90,
      cellRenderer: ButtonRenderersComponent,
      cellRendererParams: {
        onClick: this.onDelete.bind(this),
      }
    },
    { field: 'category',
      valueFormatter: (params) => params.value,
      cellEditor: 'agSelectCellEditor',
      cellClass: 'cy-category',
      cellEditorParams: {
        values: ['public', 'private', 'management'],
      },
    },
    { field: 'network',
      cellClass: 'cy-network',
      valueSetter: this.setterValueNetwork.bind(this),
    },
    { field: 'reserved_ip',
      headerName: 'Reserved IP Addresses',
      autoHeight: true,
      cellClass: 'cy-reserved-ip-address',
      valueGetter: function(params) {
        if (Array.isArray(params.data.reserved_ip)) {
          return params.data.reserved_ip.map((cat: any) => cat.ip).join(',');
        }
        return params.data.reserved_ip;
      },
      valueSetter: this.setterValueNetwork.bind(this),
      cellRenderer: function(params: any) {
        return params.value ? `[${params.value}]` : '[]'
      }
    }
  ];

  constructor(
    private store: Store,
    private formBuilder: FormBuilder,
    private projectService: ProjectService,
    private toastr: ToastrService,
    private router: Router,
    private appPrefService: AppPrefService,
    private dialog: MatDialog,
    public helpers: HelpersService,
    private mapPrefService: MapPrefService,
    private rolesService: RolesService
  ) {

    const state = this.router.getCurrentNavigation()?.extras.state;
    if (state?.['option'] == 'clone') {
      this.isCreateNewFromSelected = true;
      this.dataClone = state;
    }

    this.projectForm = this.formBuilder.group({
      name : ['',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(50),
          Validators.pattern('[^!@#$&*`%=]*'),
          validateNameExist(() => this.projects, 'add', undefined)
        ]
      ],
      description: [''],
      category: ['project'],
      target : ['VMWare vCenter'],
      option: [''],
      layoutOnly: [false],
      template: [''],
      enclave_number: [1, [Validators.min(1), Validators.max(100), Validators.required]],
      enclave_clients: [3, [Validators.min(0), Validators.max(100), Validators.required]],
      enclave_servers: [2, [Validators.min(0), Validators.max(100), Validators.required]],
      enclave_users: [5, [Validators.min(0), Validators.max(100), Validators.required]],
      vlan_min: [2000, [Validators.min(1), Validators.max(4093), Validators.required]],
      vlan_max: [2100]
    },{ validators: vlanValidator });
    this.selectAllProjects$ = this.store.select(selectAllProjects).subscribe(projects => {
      if (projects) {
        this.projects = projects;
      }
    })

    this.selectActiveTemplates$ = this.store.select(selectActiveTemplates).subscribe(activeTemplates => {
      if (activeTemplates) {
        this.activeTemplates = activeTemplates;
        this.template.setValidators([autoCompleteValidator(this.activeTemplates)]);
        this.filteredTemplate = this.helpers.filterOptions(this.template, this.activeTemplates);
      }
    })
    this.selectAppPref$ = this.store.select(selectAppPref).subscribe((data: any)=> {
      if (data) {
        let pubNetwork = {
          "network": data.public_network ? data.public_network : "10.0.0.0/8",
          "category": "public",
          "reserved_ip": data.public_reserved_ip
        }
        let privNetwork = {
          "network": data.private_network ? data.private_network : "192.168.0.0/16",
          "category": "private",
          "reserved_ip": data.private_reserved_ip
        }
        let manNetwork = {
          "network": data.management_network ? data.management_network : "172.16.0.0/22",
          "category": "management",
          "reserved_ip": data.management_reserved_ip
        }
        this.rowData = [pubNetwork, privNetwork, manNetwork]
        this.selectedMapPrefByAppPref = data.default_map_pref
      }
    })

    this.selectDefaultMapPref$ = this.store.select(selectMapPrefs).subscribe((selectedMapPref: any) => {
      if (selectedMapPref) {
        this.selectedDefaultMapPref = selectedMapPref.find((mapPref: any) => mapPref.name === this.selectedMapPrefByAppPref);
      }
    });
  }

  ngOnInit(): void {
    const permissions = this.rolesService.getUserPermissions();
    let isCanWriteProject = false
    let isCanReadSettings = false
    if (permissions) {
      for (let p of permissions) {
        if (p === "can_write on Project") {
          isCanWriteProject = true
        }
        if (p === "can_read on Settings") {
          isCanReadSettings = true
        }
      }
    }
    if (!isCanWriteProject || !isCanReadSettings) {
      this.toastr.warning('Not authorized!', 'Warning');
      this.router.navigate([RouteSegments.ROOT]);
    }
    this.helpers.setAutoCompleteValue(this.template, this.activeTemplates, '');
    this.store.dispatch(loadAppPref());
    this.mapPrefService.getAll().subscribe((data: any) => this.store.dispatch(retrievedMapPrefs({ data: data.result })));
  }

  get name() { return this.projectForm.get('name'); }
  get description() { return this.projectForm.get('description'); }
  get category() { return this.projectForm.get('category'); }
  get target() { return this.projectForm.get('target'); }
  get option() { return this.projectForm.get('option'); }
  get layoutOnly() { return this.projectForm.get('layoutOnly'); }
  get template() { return this.helpers.getAutoCompleteCtr(this.projectForm.get('template'), this.activeTemplates);  }
  get enclave_number() { return this.projectForm.get('enclave_number'); }
  get enclave_clients() { return this.projectForm.get('enclave_clients'); }
  get enclave_servers() { return this.projectForm.get('enclave_servers'); }
  get enclave_users() { return this.projectForm.get('enclave_users'); }
  get vlan_min() { return this.projectForm.get('vlan_min'); }
  get vlan_max() { return this.projectForm.get('vlan_max'); }

  selectLayout(event: any) {
    this.isHiddenNetwork = !event.checked;
  }

  onOptionChange(event: MatRadioChange) {
    if (event.value === 'blank') {
      this.isHiddenTemplate = false
      this.isHiddenOption = true
      this.isHiddenNetwork = false
      this.checked = false
      this.isDisableTemplate = true
    } else if (event.value === 'template') {
      this.isHiddenTemplate = true
      this.isHiddenOption = true
      if (!this.checked) {
        this.isHiddenNetwork = true
      }
      this.isDisableTemplate = false
      this.checked = false
    } else {
      this.isHiddenOption = false
      this.checked = false
      this.isHiddenTemplate = false
      this.isHiddenNetwork = false
      this.isDisableTemplate = true
    }
  }

  addProject() {
    let items: any[] = [];
    this.gridApi.forEachNode(node => items.push(node.data));
    Object.values(items).forEach(val => {
      if (!Array.isArray(val.reserved_ip)) {
        val.reserved_ip = this.helpers.processIpForm(val.reserved_ip)
      }
      this.isDisableButton = ((val.network === '') || (val.category === ''))
    })
    if (this.projectForm.valid && !this.isDisableButton) {
      const jsonDataValue = {
        name: this.name?.value,
        description: this.description?.value,
        category: this.category?.value,
        target: this.target?.value,
        option: this.option?.value,
        layout_only: this.layoutOnly?.value,
        template_id: this.template?.value.id,
        enclave_number: this.enclave_number?.value,
        enclave_clients: this.enclave_clients?.value,
        enclave_servers: this.enclave_servers?.value,
        enclave_users: this.enclave_users?.value,
        vlan_min: this.vlan_min?.value,
        vlan_max: this.vlan_max?.value,
        networks: items,
        logical_map: {
          map_style: {
            node: { "width": this.selectedDefaultMapPref?.node_size + "px", "height": this.selectedDefaultMapPref?.node_size + "px"},
            port_group: { "size": this.selectedDefaultMapPref?.port_group_size + "px", "color": this.selectedDefaultMapPref?.port_group_color },
            edge: { "size": this.selectedDefaultMapPref?.edge_width + "px", "color": this.selectedDefaultMapPref?.edge_color },
            text: { "size": this.selectedDefaultMapPref?.text_size + "px", "color": this.selectedDefaultMapPref?.text_color },
            group_box: { "color": this.selectedDefaultMapPref?.group_box_color, "group_opacity": "20%", "zIndex": 997, "gbs": [] },
            map_background: { "zIndex": 998, "bgs": [] },
            "grid_settings": { "enabled": false, "spacing": this.selectedDefaultMapPref?.grid_spacing+ "px", "snap": false },
            "accessed": false,
            "cleared": false,
            "default_map_pref_id": this.selectedDefaultMapPref?.id
          }
        },
        physical_map: {
          map_style: {
            node: { "width": this.selectedDefaultMapPref?.node_size + "px", "height": this.selectedDefaultMapPref?.node_size + "px"},
            edge: { "size": this.selectedDefaultMapPref?.edge_width + "px", "color": this.selectedDefaultMapPref?.edge_color },
            text: { "size": this.selectedDefaultMapPref?.text_size + "px", "color": this.selectedDefaultMapPref?.text_color },
            group_box: { "color": this.selectedDefaultMapPref?.group_box_color, "group_opacity": "20%", "zIndex": 997, "gbs": [] },
            map_background: { "zIndex": 998, "bgs": [] },
            "grid_settings": { "enabled": false, "spacing": this.selectedDefaultMapPref?.grid_spacing+ "px", "snap": false },
            "accessed": false,
            "cleared": false,
            "default_map_pref_id": this.selectedDefaultMapPref?.id
          }
        }
      }
      let jsonData = this.helpers.removeLeadingAndTrailingWhitespace(jsonDataValue);
      if (!jsonData.template_id && !this.isDisableTemplate) {
        this.toastr.warning('The template field is required.')
      } else {
        if (this.isCreateNewFromSelected) {
          jsonData = {...jsonData, ...this.dataClone}
        }
        this.projectService.add(jsonData).pipe(
          catchError((e: any) => {
            this.toastr.error('Add New Project failed', 'Error');
            return throwError(() => e);
          })
          ).subscribe(rest => {
            if (this.isCreateNewFromSelected) {
              this.projectService.validateProject({pk: rest.result.id}).pipe(
                catchError((e: any) => {
                  return throwError(() => e)
                })
              ).subscribe(() => {});
              this.isCreateNewFromSelected = false;
            }
            this.toastr.success(`Created ${rest.result.category} ${rest.result.name} successfully`);
            if (this.category?.value === 'project') {
              this.router.navigate([RouteSegments.PROJECTS]);
            } else {
              this.router.navigate([RouteSegments.PROJECTS_TEMPLATES]);
            }
            this.store.dispatch(loadProjects());
        });
      }
    } else {
      this.toastr.warning('Category and network fields are required.')
    }
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
  }

  cancelProject() {
    this.router.navigate([RouteSegments.PROJECTS]);
  }

  numericOnly(event: any): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode == 101 || charCode == 69 || charCode == 45 || charCode == 43) {
      return false;
    }
    return true;
  }

  onDelete(params: any) {
    const dialogData = {
      title: 'User confirmation needed',
      message: 'You sure you want to delete this item?',
      submitButtonName: 'OK'
    }
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, { disableClose: true, width: '400px', data: dialogData, autoFocus: false });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.rowData.splice(params.rowData.index, 1);
        this.gridApi.applyTransaction({ remove: [params.rowData] });
        this.toastr.success("Deleted Networks successfully")
      }
    });
    return this.rowData;
  }

  addNetwork() {
    const jsonData = {
      category: '',
      network: '',
      reserved_ip: []
    }
    this.gridApi.applyTransaction({ add: [jsonData] });
  }

  setterValueNetwork(params: ValueSetterParams) {
    return this.helpers.setterValue(params)
  }
}
