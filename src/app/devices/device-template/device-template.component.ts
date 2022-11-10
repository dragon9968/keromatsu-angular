import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { ToastrService } from 'ngx-toastr';
import { Observable, of, Subscription } from 'rxjs';
import { DeviceService } from 'src/app/core/services/device/device.service';
import { HelpersService } from 'src/app/core/services/helpers/helpers.service';
import { IconService } from 'src/app/core/services/icon/icon.service';
import { LoginProfileService } from 'src/app/core/services/login-profile/login-profile.service';
import { TemplateService } from 'src/app/core/services/template/template.service';
import { ICON_PATH } from 'src/app/shared/contants/icon-path.constant';
import { retrievedDevices } from 'src/app/store/device/device.actions';
import { selectDevices } from 'src/app/store/device/device.selectors';
import { retrievedIcons } from 'src/app/store/icon/icon.actions';
import { retrievedLoginProfiles } from 'src/app/store/login-profile/login-profile.actions';
import { retrievedTemplates } from 'src/app/store/template/template.actions';
import { selectTemplates } from 'src/app/store/template/template.selectors';
import { ActionRenderDeviceComponent } from './action-render-device/action-render-device.component';
import { ActionRenderTemplateComponent } from './action-render-template/action-render-template.component';
import { AddEditDeviceDialogComponent } from './add-edit-device-dialog/add-edit-device-dialog.component';
import { AddEditTemplateDialogComponent } from './add-edit-template-dialog/add-edit-template-dialog.component';

@Component({
  selector: 'app-device-template',
  templateUrl: './device-template.component.html',
  styleUrls: ['./device-template.component.scss']
})
export class DeviceTemplateComponent implements OnInit, OnDestroy {
  @ViewChild("agGrid1") agGrid1!: AgGridAngular;
  private gridApi!: GridApi;
  @ViewChild("agGrid2") agGrid2!: AgGridAngular;
  isDisableTemplate = true;
  deviceId!: string;
  quickFilterValueDevices = '';
  quickFilterValueTemplates = '';
  rowsSelected: any[] = [];
  rowsSelectedId: any[] = [];
  selectDevices$ = new Subscription();
  selectTemplates$ = new Subscription();
  rowDataDevices$! : Observable<any[]>;
  rowDataTemplate$! : Observable<any[]>;
  id!: any;
  rowSelectedDevice: any[] = [];
  rowSelectedDeviceId: any[] = [];
  exportType!: string;
  isHiddenTable = true
  ICON_PATH = ICON_PATH;
  large: boolean = true;
  defaultColDef: ColDef = {
    sortable: true,
    resizable: true
  };
  columnDefsDevices: ColDef[] = [
    {
      headerCheckboxSelection: true,
      checkboxSelection: true,
      suppressSizeToFit: true,
      width: 20
    },
    {
      headerName: '',
      field: 'id',
      suppressSizeToFit: true,
      width: 90,
      cellRenderer: ActionRenderDeviceComponent,
      cellClass: 'devices-actions'
    },
    { field: 'name',
      suppressSizeToFit: true,
      flex: 1,
    },
    { 
      field: 'category.0.name',
      headerName: 'Category',
      suppressSizeToFit: true,
      flex: 1,
    },
    {
      headerName: 'Icon',
      field: 'icon.photo',
      suppressSizeToFit: true,
      cellRenderer: function(param: any) {
        const img = `<img src="${ICON_PATH}${param.value}" alt="Photo" height="25" width="25">`
        return img
      },
      autoHeight: true,
      flex: 1,
    }
  ];

  columnDefsTemplate: ColDef[] = [
    {
      headerCheckboxSelection: true,
      checkboxSelection: true,
      suppressSizeToFit: true,
      width: 52
    },
    {
      headerName: '',
      field: 'id',
      suppressSizeToFit: true,
      flex: 1,
      width: 90,
      cellRenderer: ActionRenderTemplateComponent,
      cellClass: 'template-actions'
    },
    { 
      headerName: 'Display Name',
      field: 'display_name',
      suppressSizeToFit: true,
      flex: 1,
    },
    { field: 'name',
      suppressSizeToFit: true,
      flex: 1, 
    },
    { field: 'category',
      suppressSizeToFit: true,
      flex: 1, 
    },
    {
      headerName: 'Icon',
      field: 'icon.photo',
      cellRenderer: function(param: any) {
        const img = `<img src="${ICON_PATH}${param.value}" alt="Photo" height="25" width="25">`
        return img
      },
      autoHeight: true,
      suppressSizeToFit: true,
      flex: 1,
    },
    { 
      headerName: 'Login',
      field: 'login_profile',
      autoHeight: true,
      suppressSizeToFit: true,
      flex: 1,
      cellRenderer: function(param: any) {
        if (param.value){
          let html_str = `<div>Username:${param.value.username}</div><div>Password:${param.value.password}</div>`;
          return html_str;
        }else {
          return 
        }
      },
    },
  ];
  constructor(
    private store: Store,
    private toastr: ToastrService,
    private deviceService: DeviceService,
    private templateService: TemplateService,
    private iconService: IconService,
    private loginProfileService: LoginProfileService,
    private dialog: MatDialog,
    private domSanitizer: DomSanitizer,
    iconRegistry: MatIconRegistry,
    private helpers: HelpersService,
  ) {
    this.selectDevices$ = this.store.select(selectDevices).subscribe((devicesData: any) => {
      this.rowDataDevices$ = of(devicesData);
    });
    this.selectTemplates$ = this.store.select(selectTemplates).subscribe((templateData: any) => {
      this.rowDataTemplate$ = of(templateData);
    });

    iconRegistry.addSvgIcon('export-json', this._setPath('/assets/icons/export-json.svg'));
   }

  ngOnInit(): void {
    this.deviceService.getAll().subscribe((data: any) => this.store.dispatch(retrievedDevices({data: data.result})));
    this.templateService.getAll().subscribe(data => this.store.dispatch(retrievedTemplates({ data: null})))
    this.iconService.getAll().subscribe(data => {
      this.store.dispatch(retrievedIcons({data: data.result}));
    })
    this.loginProfileService.getAll().subscribe(data => {
      this.store.dispatch(retrievedLoginProfiles({data: data.result}));
    })
  }

  private _setPath(url: string): SafeResourceUrl {
    return this.domSanitizer.bypassSecurityTrustResourceUrl(url);
  }

  ngOnDestroy(): void {
    this.selectDevices$.unsubscribe();
    this.selectTemplates$.unsubscribe();
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
  }

  onGridReady2(params: GridReadyEvent) {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
  }

  onSelectionChanged() {
    this.id = this.agGrid1.api.getSelectedRows();
    if (this.id.length > 0) {
      this.isDisableTemplate = false;
      this.deviceId = this.id[0].id;
      this.templateService.getAll().subscribe((data: any)  => {
        let template = data.result.filter((val: any) => val.device_id === this.deviceId)
        this.store.dispatch(retrievedTemplates({ data: template }))
      })
    }else {
      this.templateService.getAll().subscribe((data: any)  => { this.store.dispatch(retrievedTemplates({ data: null }))})
      this.isDisableTemplate = true;
    }
  }

  selectedRows() {
    this.rowsSelected = this.agGrid2.api.getSelectedRows();
    this.rowsSelectedId = this.rowsSelected.map(ele => ele.id);
  }

  selectedRowsDevice () {
    this.rowSelectedDevice = this.agGrid1.api.getSelectedRows();
    this.rowSelectedDeviceId = this.rowSelectedDevice.map(ele => ele.id);
    this.exportType = 'device'
    if (this.rowSelectedDeviceId.length == 0 ) {
      this.isHiddenTable = true;
      this.large = true;
    }else {
      this.isHiddenTable = false;
      this.large = false;
    }
  }

  addDevices() {
    const dialogData = {
      mode: 'add',
      genData: {
        name:  '',
        category: '',
        icon:  '',
      }
    }
    const dialogRef = this.dialog.open(AddEditDeviceDialogComponent, {
      autoFocus: false,
      width: '450px',
      data: dialogData
    });
  }

  onQuickFilterInputDevices(event: any) {
    this.agGrid1.api.setQuickFilter(event.target.value);
  }

  onQuickFilterInputTemplate (event: any) {
    this.agGrid2.api.setQuickFilter(event.target.value);
  }

  addTemplate() {
    const dialogData = {
      mode: 'add',
      genData: {
        deviceId: this.id[0].id, 
        displayName:  '',
        name: '',
        category:  'vm',
        icon:  '',
        loginProfile:  '',
        defaultConfigFile: '',
      }
    }
    const dialogRef = this.dialog.open(AddEditTemplateDialogComponent, {
      autoFocus: false,
      width: '450px',
      data: dialogData
    });
  }

  exportDevice() {
    if (this.rowSelectedDeviceId.length == 0) {
      this.toastr.info('No row selected');
    }else {
      let file = new Blob();
      this.deviceService.export(this.rowSelectedDeviceId).subscribe(response => {
      file = new Blob([JSON.stringify(response, null, 4)], {type: 'application/json'});
      this.helpers.downloadBlob('Devices-Export.json', file);
      this.toastr.success(`Exported Templates as ${'json'.toUpperCase()} file successfully`);
        })
      }
    }

    exportTemplate() {
      if (this.rowsSelectedId.length == 0) {
        this.toastr.info('No row selected');
      }else {
        let file = new Blob();
        this.templateService.export(this.rowsSelectedId).subscribe(response => {
        file = new Blob([JSON.stringify(response, null, 4)], {type: 'application/json'});
        this.helpers.downloadBlob('Templates-Export.json', file);
        this.toastr.success(`Exported Templates as ${'json'.toUpperCase()} file successfully`);
          })
        }
      }
}