import { AfterViewInit, Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatRadioChange } from '@angular/material/radio';
import { ROLES } from 'src/app/shared/contants/roles.constant';
import { HelpersService } from 'src/app/core/services/helpers/helpers.service';
import { autoCompleteValidator } from 'src/app/shared/validations/auto-complete.validation';
import { ErrorMessages } from 'src/app/shared/enums/error-messages.enum';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { ToastrService } from 'ngx-toastr';
import { NodeService } from 'src/app/core/services/node/node.service';
import { Store } from '@ngrx/store';
import { catchError, Observable, of, Subscription, throwError } from 'rxjs';
import { selectIcons } from '../../store/icon/icon.selectors';
import { selectDevices } from '../../store/device/device.selectors';
import { selectTemplates } from '../../store/template/template.selectors';
import { selectHardwares } from '../../store/hardware/hardware.selectors';
import { selectDomains } from '../../store/domain/domain.selectors';
import { selectConfigTemplates } from '../../store/config-template/config-template.selectors';
import { selectLoginProfiles } from '../../store/login-profile/login-profile.selectors';
import { ICON_PATH } from 'src/app/shared/contants/icon-path.constant';
import { selectLogicalNodes } from 'src/app/store/node/node.selectors';
import { validateNameExist } from 'src/app/shared/validations/name-exist.validation';
import { hostnameValidator } from 'src/app/shared/validations/hostname.validation';
import { ErrorStateMatcher } from '@angular/material/core';
import { ColDef, GridApi, GridOptions, GridReadyEvent, ValueSetterParams } from "ag-grid-community";
import { InterfaceService } from "../../core/services/interface/interface.service";
import { ConfigTemplateService } from "../../core/services/config-template/config-template.service";
import { retrievedConfigTemplates } from "../../store/config-template/config-template.actions";
import { PORT } from "../../shared/contants/port.constant";
import { AceEditorComponent } from "ng12-ace-editor";
import { networksValidation } from 'src/app/shared/validations/networks.validation';
import { selectIsConfiguratorConnect, selectIsDatasourceConnect, selectIsHypervisorConnect } from 'src/app/store/server-connect/server-connect.selectors';
import { RemoteCategories } from 'src/app/core/enums/remote-categories.enum';
import { ServerConnectService } from 'src/app/core/services/server-connect/server-connect.service';
import { AgGridAngular } from 'ag-grid-angular';
import { addNewNode, updateNode } from 'src/app/store/node/node.actions';
import { selectNotification } from 'src/app/store/app/app.selectors';
import { ipSubnetValidation } from "../../shared/validations/ip-subnet.validation";
import { IpReservationModel, RangeModel } from "../../core/models/config-template.model";
import { ConfirmationDialogComponent } from "../../shared/components/confirmation-dialog/confirmation-dialog.component";
import { ButtonRenderersComponent } from "../../project/renderers/button-renderers-component";

class CrossFieldErrorMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    return !!control?.dirty && (
      control?.errors?.['required'] ||
      form?.errors?.['isNotMatchPattern'] ||
      form?.errors?.['isNotMatchLength']
    );
  }
}

@Component({
  selector: 'app-add-update-node-dialog',
  templateUrl: './add-update-node-dialog.component.html',
  styleUrls: ['./add-update-node-dialog.component.scss']
})
export class AddUpdateNodeDialogComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild("editor") editor!: AceEditorComponent;
  @ViewChild("agGridInterfaces") agGridInterfaces!: AgGridAngular;
  @ViewChild("agGridDeployInterfaces") agGridDeployInterfaces!: AgGridAngular;
  private rangeGridApi!: GridApi;
  private reservationGridApi!: GridApi;
  private gridApi!: GridApi;
  nodeAddForm: FormGroup;
  errorMatcher = new CrossFieldErrorMatcher();
  ROLES = ROLES;
  PORT = PORT;
  ICON_PATH = ICON_PATH;
  filteredTemplatesByDevice!: any[];
  errorMessages = ErrorMessages;
  icons!: any[];
  devices!: any[];
  templates!: any[];
  hardwares!: any[];
  domains!: any[];
  configTemplates!: any[];
  loginProfiles!: any[];
  nodes!: any[];
  selectIcons$ = new Subscription();
  selectDevices$ = new Subscription();
  selectTemplates$ = new Subscription();
  selectHardwares$ = new Subscription();
  selectDomains$ = new Subscription();
  selectConfigTemplates$ = new Subscription();
  selectLoginProfiles$ = new Subscription();
  selectNodes$ = new Subscription();
  isViewMode = false;
  filteredIcons!: Observable<any[]>;
  filteredDevices!: Observable<any[]>;
  filteredTemplates!: Observable<any[]>;
  filteredHardwares!: Observable<any[]>;
  filteredDomains!: Observable<any[]>;
  filteredRoles!: Observable<any[]>;
  filteredConfigTemplates!: Observable<any[]>;
  filteredLoginProfiles!: Observable<any[]>;
  filteredNodeIP!: Observable<any[]>;
  rowDataInterfaces$!: Observable<any[]>;
  rowDeployInterfacesData$!: Observable<any[]>;
  configTemplateAddsType: any[] = [];
  configTemplateForm!: FormGroup;
  actionsAddForm!: FormGroup;
  configForm!: FormGroup;
  firewallRuleForm!: FormGroup;
  domainMemberForm!: FormGroup;
  roleServicesForm!: FormGroup;
  ospfForm!: FormGroup;
  bgpForm!: FormGroup;
  rangeRowData: any[] = [];
  reservationRowData: any[] = [];
  dhcpForm!: FormGroup;
  isAddMode = false;
  isAddRoute = false;
  isAddFirewallRule = false;
  isAddRolesAndService = false;
  isAddDomainMembership = false;
  isAddOSPF = false;
  bgpChecked = true;
  connectedChecked = true;
  staticChecked = true;
  isAddBGP = false;
  isAddDHCP = false;
  isDisableAddDHCP = false;
  bgpConnectedChecked = true;
  bgpOspfChecked = true;
  rolesAndService: any[] = [];
  filteredAddActions!: Observable<any>[];
  listNodeIP: any[] = [];
  selectIsHypervisorConnect$ = new Subscription();
  selectIsDatasourceConnect$ = new Subscription();
  selectIsConfiguratorConnect$ = new Subscription();
  selectNotification$ = new Subscription();
  isHypervisorConnect = false;
  isDatasourceConnect = false;
  isConfiguratorConnect = false;
  connectionCategory = '';
  infrastructureChecked = false;

  public gridOptionsInterfaces: GridOptions = {
    headerHeight: 48,
    defaultColDef: {
      sortable: true,
      resizable: true,
      singleClickEdit: true,
      filter: true
    },
    rowSelection: 'multiple',
    suppressRowDeselection: true,
    suppressCellFocus: true,
    enableCellTextSelection: true,
    pagination: true,
    paginationPageSize: 25,
    suppressRowClickSelection: true,
    animateRows: true,
    rowData: [],
    columnDefs: [
      {
        field: 'id',
        hide: true
      },
      {
        field: 'name',
        headerName: 'Interface Name',
        minWidth: 145,
        flex: 1,
      },
      {
        field: 'ip',
        headerName: 'IP Address',
        minWidth: 160,
        flex: 1,
      },
      {
        field: 'port_group.subnet',
        headerName: 'Subnet',
        minWidth: 160,
        flex: 1,
      },
      {
        field: 'description',
        flex: 1,
      }
    ]
  };

  public gridOptionsDeployInterfaces: GridOptions = {
    headerHeight: 48,
    defaultColDef: {
      sortable: true,
      resizable: true,
      singleClickEdit: true,
      filter: true
    },
    rowSelection: 'multiple',
    suppressRowDeselection: true,
    suppressCellFocus: true,
    enableCellTextSelection: true,
    pagination: true,
    paginationPageSize: 25,
    suppressRowClickSelection: true,
    animateRows: true,
    rowData: [],
    columnDefs: [
      {
        field: 'name',
        minWidth: 160,
        flex: 1,
      },
      {
        field: 'ip',
        headerName: 'IP Address',
        minWidth: 145,
        flex: 1,
      },
      {
        field: 'macaddress',
        headerName: 'Mac Address',
        minWidth: 160,
        flex: 1,
      }
    ]
  };
  defaultConfig: any = {}

  defaultColDef: ColDef = {
    sortable: true,
    resizable: true,
    editable: true,
  };

  rangeColumnDefs: ColDef[] = [
    {
      headerName: '',
      editable: false,
      maxWidth: 90,
      cellRenderer: ButtonRenderersComponent,
      cellRendererParams: {
        onClick: this.onDelete.bind(this),
      }
    },
    {
      field: 'name'
    },
    {
      field: 'start',
      valueSetter: this.setterValueNetwork.bind(this)
    },
    {
      field: 'stop',
      valueSetter: this.setterValueNetwork.bind(this),
    }
  ];

  reservationColumnDefs: ColDef[] = [
    {
      headerName: '',
      editable: false,
      maxWidth: 90,
      cellRenderer: ButtonRenderersComponent,
      cellRendererParams: {
        onClick: this.onDeleteReservation.bind(this),
      }
    },
    {
      field: 'name'
    },
    {
      field: 'ip_address',
      headerName: 'IP Address',
      valueSetter: this.setterValueNetwork.bind(this)
    },
    {
      field: 'mac_address',
      headerName: 'MAC Address'
    }
  ];

  constructor(
    private nodeService: NodeService,
    private toastr: ToastrService,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<AddUpdateNodeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public helpers: HelpersService,
    private store: Store,
    private interfaceService: InterfaceService,
    private configTemplateService: ConfigTemplateService,
    private serverConnectionService: ServerConnectService,
  ) {
    this.infrastructureChecked = this.data.mapCategory != 'logical'
    this.actionsAddForm = new FormGroup({
      addTypeCtr: new FormControl('')
    })
    this.configForm = new FormGroup({
      routeCtr: new FormControl('', [Validators.required]),
      nextHopCtr: new FormControl('', [Validators.required]),
      interfaceCtr: new FormControl('')
    });
    this.firewallRuleForm = new FormGroup({
      categoryFirewallRuleCtr: new FormControl({ value: 'rule', disabled: false }),
      nameFirewallRuleCtr: new FormControl({ value: '', disabled: false }),
      stateCtr: new FormControl({ value: 'present', disabled: false }),
      actionCtr: new FormControl('pass'),
      interfaceFirewallCtr: new FormControl({ value: '', disabled: false }),
      protocolCtr: new FormControl({ value: 'any', disabled: false }),
      sourceCtr: new FormControl({ value: 'any', disabled: false }),
      sourcePortCtr: new FormControl({ value: 'any', disabled: false }),
      sourceCustomPortCtr: new FormControl({ value: 'any', disabled: true }),
      destinationCtr: new FormControl({ value: 'any', disabled: false }),
      destinationPortCtr: new FormControl({ value: 'any', disabled: false }),
      destCustomPortCtr: new FormControl({ value: '', disabled: true }),
      targetCtr: new FormControl({ value: '', disabled: true }),
      targetPortCtr: new FormControl({ value: 'any', disabled: true }),
      targetCustomPortCtr: new FormControl({ value: '', disabled: true }),
    });
    this.domainMemberForm = new FormGroup({
      joinDomainCtr: new FormControl(false),
      ouPathCtr: new FormControl(''),
    })
    this.roleServicesForm = new FormGroup({
      rolesCtr: new FormControl('')
    })

    this.ospfForm = new FormGroup({
      networksCtr: new FormControl('', [networksValidation('multi')]),
      bgpStateCtr: new FormControl(''),
      bgpMetricTypeCtr: new FormControl(''),
      connectedStateCtr: new FormControl(''),
      connectedMetricTypeCtr: new FormControl(''),
      staticStateCtr: new FormControl(''),
      staticMetricTypeCtr: new FormControl('')
    })

    this.bgpForm = new FormGroup({
      ipCtr: new FormControl(''),
      asnCtr: new FormControl(''),
      neighborIpCtr: new FormControl('', [networksValidation('single')]),
      neighborAsnCtr: new FormControl(''),
      bgpConnectedStateCtr: new FormControl(''),
      bgpConnectedMetricCtr: new FormControl('', [Validators.pattern('^[0-9]*$')]),
      bgpOspfStateCtr: new FormControl(''),
      bgpOspfMetricCtr: new FormControl('', [Validators.pattern('^[0-9]*$')])
    })

    this.dhcpForm = new FormGroup({
      nameDHCPCtr: new FormControl(''),
      authoritativeCtr: new FormControl(true),
      subnetCtr: new FormControl('', [ipSubnetValidation(true)]),
      leaseCtr: new FormControl('', [Validators.pattern('^[0-9]*$')]),
      dnsServerCtr: new FormControl('', [networksValidation('single')]),
      ntpServerCtr: new FormControl('', [networksValidation('single')]),
    })

    this.isViewMode = this.data.mode == 'view';
    this.nodeAddForm = new FormGroup({
      nameCtr: new FormControl('', [
        Validators.required, Validators.minLength(3), Validators.maxLength(50),
        validateNameExist(() => this.nodes, this.data.mode, this.data.genData.id)
      ]),
      notesCtr: new FormControl(''),
      iconCtr: new FormControl(''),
      categoryCtr: new FormControl({ value: '', disabled: this.isViewMode }),
      infrastructureCtr: new FormControl({ value: '', disabled: this.isViewMode }),
      deviceCtr: new FormControl(''),
      templateCtr: new FormControl(''),
      hardwareCtr: new FormControl(''),
      folderCtr: new FormControl(''),
      parentFolderCtr: new FormControl(''),
      roleCtr: new FormControl(''),
      domainCtr: new FormControl(''),
      hostnameCtr: new FormControl('', Validators.required),
      configTemplateCtr: new FormControl({ value: '', disabled: this.isViewMode }),
      loginProfileCtr: new FormControl(''),
      hardwareInfoCtr: new FormControl(''),
      uuidCtr: new FormControl(''),
      webConsoleCtr: new FormControl(''),
      featuresCtr: new FormControl(''),
      softwareCtr: new FormControl(''),
      serviceCtr: new FormControl(''),
      runningConfigCtr: new FormControl(''),
      changeCtr: new FormControl(''),
      tasksCtr: new FormControl(''),
    }, { validators: hostnameValidator });
    this.selectNotification$ = this.store.select(selectNotification).subscribe((notification: any) => {
      if (notification?.type == 'success') {
        this.dialogRef.close();
      }
    });
    this.selectIcons$ = this.store.select(selectIcons).subscribe((icons: any) => {
      this.icons = icons;
      this.iconCtr.setValidators([autoCompleteValidator(this.icons)]);
      this.filteredIcons = this.helpers.filterOptions(this.iconCtr, this.icons);
    });
    this.selectDevices$ = this.store.select(selectDevices).subscribe((devices: any) => {
      this.devices = devices;
      this.deviceCtr.setValidators([Validators.required, autoCompleteValidator(this.devices)]);
      this.filteredDevices = this.helpers.filterOptions(this.deviceCtr, this.devices);
      const deviceCategories = devices.find((device: any) => device.id === this.data.genData.device_id)
                                      .category.map((deviceCategory: any) => deviceCategory.name);
      this.configTemplateAddsType = this.helpers.getConfigAddsTypeByDeviceCategory(deviceCategories);
      this.filteredAddActions = this.helpers.filterOptions(this.addTypeCtr, this.configTemplateAddsType);
      this.addTypeCtr?.setValue(this.configTemplateAddsType[0]);
      this.addTypeCtr?.setValidators([Validators.required, autoCompleteValidator(this.configTemplateAddsType)]);
      this.helpers.setAutoCompleteValue(this.addTypeCtr, this.configTemplateAddsType, this.configTemplateAddsType[0].id);
    });
    this.selectTemplates$ = this.store.select(selectTemplates).subscribe((templates: any) => {
      this.templates = templates;
      this.templateCtr.setValidators([Validators.required, autoCompleteValidator(this.templates, 'display_name')]);
      this.filteredTemplates = templates;
      this.filteredTemplates = this.helpers.filterOptions(this.templateCtr, this.filteredTemplatesByDevice, 'display_name');
    });
    this.selectHardwares$ = this.store.select(selectHardwares).subscribe((hardwares: any) => {
      this.hardwares = hardwares;
      this.hardwareCtr.setValidators([Validators.required, autoCompleteValidator(this.hardwares)]);
      this.filteredHardwares = this.helpers.filterOptions(this.hardwareCtr, this.hardwares);
    });
    this.selectDomains$ = this.store.select(selectDomains).subscribe((domains: any) => {
      this.domains = domains;
      this.domainCtr.setValidators([Validators.required, autoCompleteValidator(this.domains)]);
      this.filteredDomains = this.helpers.filterOptions(this.domainCtr, this.domains);
    });
    this.selectConfigTemplates$ = this.store.select(selectConfigTemplates).subscribe((configTemplates: any) => {
      this.configTemplates = configTemplates;
      this.configTemplateCtr?.setValidators([autoCompleteValidator(this.configTemplates)]);
      this.filteredConfigTemplates = this.helpers.filterOptions(this.configTemplateCtr, this.configTemplates);
    });
    this.selectLoginProfiles$ = this.store.select(selectLoginProfiles).subscribe((loginProfiles: any) => {
      this.loginProfiles = loginProfiles;
      this.loginProfileCtr.setValidators([autoCompleteValidator(this.loginProfiles)]);
      this.filteredLoginProfiles = this.helpers.filterOptions(this.loginProfileCtr, this.loginProfiles);
    });
    this.selectNodes$ = this.store.select(selectLogicalNodes).subscribe(nodes => this.nodes = nodes);
    this.interfaceService.getByNode(this.data.genData.id).subscribe(response => {
      const interfaceData = response.result;
      if (this.agGridInterfaces) {
        this.agGridInterfaces.api.setRowData(interfaceData);
      } else {
        this.rowDeployInterfacesData$ = of(interfaceData);
      }
      this.listNodeIP = interfaceData.filter((ip: any) => ip.category !== 'management')
      this.ipCtr.setValidators([autoCompleteValidator(this.listNodeIP, 'ip')]);
      this.filteredNodeIP = this.helpers.filterOptions(this.ipCtr, this.listNodeIP, 'ip');
    })
    this.configTemplateService.getWinRoles().subscribe(data => {
      this.rolesAndService = data;
      this.rolesCtr.setValidators([Validators.required, autoCompleteValidator(this.rolesAndService)]);
    });
    this.selectIsHypervisorConnect$ = this.store.select(selectIsHypervisorConnect).subscribe(isHypervisorConnect => {
      if (isHypervisorConnect) {
        this.isHypervisorConnect = isHypervisorConnect
        this.connectionCategory = RemoteCategories.HYPERVISOR
      }
    })

    this.selectIsDatasourceConnect$ = this.store.select(selectIsDatasourceConnect).subscribe(isDatasourceConnect => {
      if (isDatasourceConnect) {
        this.isDatasourceConnect = isDatasourceConnect
        this.connectionCategory = RemoteCategories.DATASOURCE
      }
    })

    this.selectIsConfiguratorConnect$ = this.store.select(selectIsConfiguratorConnect).subscribe(isConfiguratorConnect => {
      if (isConfiguratorConnect) {
        this.isConfiguratorConnect = isConfiguratorConnect
        this.connectionCategory = RemoteCategories.CONFIGURATOR
      }
    })

    if (this.data.mode === 'view') {
      const connection = this.serverConnectionService.getConnection(this.connectionCategory);
      const connectionId = connection ? connection?.id : 0;
      if (connectionId !== 0) {
        this.nodeService.getDeployData(this.data.genData.id, connectionId).subscribe((respData: any) => {
          const resp = respData.result;
          if (this.agGridDeployInterfaces) {
            this.agGridDeployInterfaces.api.setRowData(resp.interfaces);
          } else {
            this.rowDataInterfaces$ = of(resp.interfaces);
          }
          this.uuidCtr?.setValue(resp?.uuid)
          if (resp?.info?.Hardware) {
            let hardwareInfo = [];
            for (const [key, value] of Object.entries(resp?.info?.Hardware)) {
              hardwareInfo.push(`${key}: ${value}`)
            }
            this.hardwareInfoCtr?.setValue(hardwareInfo)
          }
          this.serviceCtr?.setValue(resp?.running_services)
          if (resp?.installed_features) {
            const features = resp?.installed_features.map((val: any) => val.name)
            this.featuresCtr?.setValue(features)
          }
          this.runningConfigCtr?.setValue(resp?.deploy_config)
        })
      } else {
        this.toastr.info('Could not get Instance information due to no connection.', 'Info')
      }

    }
  }

  ngAfterViewInit(): void {
    if (this.data.mode !== 'add') {
      this.editor.getEditor().setOptions({
        tabSize: 2,
        useWorker: false,
        fontSize: '16px'
      });
      this.editor.mode = 'json';
      this.editor.setTheme('textmate');
      const data = {
        config_id: this.data.genData.default_config_id,
        node_id: this.data.genData.id
      }
      this.configTemplateService.getNodeDefaultConfiguration(data).subscribe(res => {
        this.defaultConfig = res.configuration;
        this.editor.value = JSON.stringify(this.defaultConfig, null, 2);
      })
    }
  }

  get nameCtr() { return this.nodeAddForm.get('nameCtr'); }
  get notesCtr() { return this.nodeAddForm.get('notesCtr'); }
  get iconCtr() { return this.helpers.getAutoCompleteCtr(this.nodeAddForm.get('iconCtr'), this.icons); }
  get categoryCtr() { return this.nodeAddForm.get('categoryCtr'); }
  get infrastructureCtr() { return this.nodeAddForm.get('infrastructureCtr'); }
  get deviceCtr() { return this.helpers.getAutoCompleteCtr(this.nodeAddForm.get('deviceCtr'), this.devices); }
  get templateCtr() { return this.helpers.getAutoCompleteCtr(this.nodeAddForm.get('templateCtr'), this.templates); }
  get hardwareCtr() { return this.helpers.getAutoCompleteCtr(this.nodeAddForm.get('hardwareCtr'), this.hardwares); }
  get folderCtr() { return this.nodeAddForm.get('folderCtr'); }
  get parentFolderCtr() { return this.nodeAddForm.get('parentFolderCtr'); }
  get roleCtr() { return this.helpers.getAutoCompleteCtr(this.nodeAddForm.get('roleCtr'), ROLES); }
  get domainCtr() { return this.helpers.getAutoCompleteCtr(this.nodeAddForm.get('domainCtr'), this.domains); }
  get hostnameCtr() { return this.nodeAddForm.get('hostnameCtr'); }
  get configTemplateCtr() { return this.nodeAddForm.get('configTemplateCtr'); }
  get loginProfileCtr() { return this.helpers.getAutoCompleteCtr(this.nodeAddForm.get('loginProfileCtr'), this.loginProfiles); }
  get hardwareInfoCtr() { return this.nodeAddForm.get('hardwareInfoCtr'); }
  get uuidCtr() { return this.nodeAddForm.get('uuidCtr'); }
  get webConsoleCtr() { return this.nodeAddForm.get('webConsoleCtr'); }
  get featuresCtr() { return this.nodeAddForm.get('featuresCtr'); }
  get softwareCtr() { return this.nodeAddForm.get('softwareCtr'); }
  get serviceCtr() { return this.nodeAddForm.get('serviceCtr'); }
  get runningConfigCtr() { return this.nodeAddForm.get('runningConfigCtr'); }
  get changeCtr() { return this.nodeAddForm.get('changeCtr'); }
  get tasksCtr() { return this.nodeAddForm.get('tasksCtr'); }
  get addTypeCtr() { return this.helpers.getAutoCompleteCtr(this.actionsAddForm.get('addTypeCtr'), this.configTemplateAddsType) }
  get routeCtr() { return this.configForm.get('routeCtr'); }
  get nextHopCtr() { return this.configForm.get('nextHopCtr'); }
  get interfaceCtr() { return this.configForm.get('interfaceCtr'); }
  get categoryFirewallRuleCtr() { return this.firewallRuleForm.get('categoryFirewallRuleCtr'); }
  get nameFirewallRuleCtr() { return this.firewallRuleForm.get('nameFirewallRuleCtr'); }
  get stateCtr() { return this.firewallRuleForm.get('stateCtr'); }
  get actionCtr() { return this.firewallRuleForm.get('actionCtr'); }
  get interfaceFirewallCtr() { return this.firewallRuleForm.get('interfaceFirewallCtr'); }
  get protocolCtr() { return this.firewallRuleForm.get('protocolCtr'); }
  get sourceCtr() { return this.firewallRuleForm.get('sourceCtr'); }
  get sourcePortCtr() { return this.firewallRuleForm.get('sourcePortCtr'); }
  get sourceCustomPortCtr() { return this.firewallRuleForm.get('sourceCustomPortCtr'); }
  get destinationCtr() { return this.firewallRuleForm.get('destinationCtr'); }
  get destinationPortCtr() { return this.firewallRuleForm.get('destinationPortCtr'); }
  get destCustomPortCtr() { return this.firewallRuleForm.get('destCustomPortCtr'); }
  get targetCtr() { return this.firewallRuleForm.get('targetCtr'); }
  get targetPortCtr() { return this.firewallRuleForm.get('targetPortCtr'); }
  get targetCustomPortCtr() { return this.firewallRuleForm.get('targetCustomPortCtr'); }
  get joinDomainCtr() { return this.domainMemberForm.get('joinDomainCtr'); }
  get ouPathCtr() { return this.domainMemberForm.get('ouPathCtr'); }
  get rolesCtr() { return this.helpers.getAutoCompleteCtr(this.roleServicesForm.get('rolesCtr'), this.rolesAndService); }
  get networksCtr() { return this.ospfForm.get('networksCtr'); }
  get bgpStateCtr() { return this.ospfForm.get('bgpStateCtr'); }
  get bgpMetricTypeCtr() { return this.ospfForm.get('bgpMetricTypeCtr'); }
  get connectedStateCtr() { return this.ospfForm.get('connectedStateCtr'); }
  get connectedMetricTypeCtr() { return this.ospfForm.get('connectedMetricTypeCtr'); }
  get staticStateCtr() { return this.ospfForm.get('staticStateCtr'); }
  get staticMetricTypeCtr() { return this.ospfForm.get('staticMetricTypeCtr'); }

  get ipCtr() { return this.helpers.getAutoCompleteCtr(this.bgpForm.get('ipCtr'), this.listNodeIP); }
  get asnCtr() { return this.bgpForm.get('asnCtr'); }
  get neighborIpCtr() { return this.bgpForm.get('neighborIpCtr'); }
  get neighborAsnCtr() { return this.bgpForm.get('neighborAsnCtr'); }
  get bgpConnectedStateCtr() { return this.bgpForm.get('bgpConnectedStateCtr'); }
  get bgpConnectedMetricCtr() { return this.bgpForm.get('bgpConnectedMetricCtr'); }
  get bgpOspfStateCtr() { return this.bgpForm.get('bgpOspfStateCtr'); }
  get bgpOspfMetricCtr() { return this.bgpForm.get('bgpOspfMetricCtr'); }

  get nameDHCPCtr() { return this.dhcpForm.get('nameDHCPCtr') }
  get authoritativeCtr() { return this.dhcpForm.get('authoritativeCtr') }
  get subnetCtr() { return this.dhcpForm.get('subnetCtr') }
  get leaseCtr() { return this.dhcpForm.get('leaseCtr') }
  get dnsServerCtr() { return this.dhcpForm.get('dnsServerCtr') }
  get ntpServerCtr() { return this.dhcpForm.get('ntpServerCtr') }

  ngOnInit(): void {
    this.roleCtr.setValidators([Validators.required, autoCompleteValidator(this.ROLES)]);
    this.filteredRoles = this.helpers.filterOptions(this.roleCtr, this.ROLES);
    this.helpers.setAutoCompleteValue(this.iconCtr, this.icons, this.data.genData.icon_id);
    this.nameCtr?.setValue(this.data.genData.name);
    this.notesCtr?.setValue(this.data.genData.notes);
    this.categoryCtr?.setValue(this.data.genData.category);
    this.disableItems(this.categoryCtr?.value);
    if (this.data.mode !== 'add') {
      this.infrastructureChecked = this.data.genData.infrastructure
    }
    this.helpers.setAutoCompleteValue(this.deviceCtr, this.devices, this.data.genData.device_id);
    this.filteredTemplatesByDevice = this.templates.filter((template: any) => template.device_id == this.data.genData.device_id);
    this.filteredTemplates = this.helpers.filterOptions(this.templateCtr, this.filteredTemplatesByDevice, 'display_name');
    this.helpers.setAutoCompleteValue(this.templateCtr, this.templates, this.data.genData.template_id);
    this.helpers.setAutoCompleteValue(this.hardwareCtr, this.hardwares, this.data.genData.hardware_id);
    this.folderCtr?.setValue(this.data.genData.folder);
    if (!this.isViewMode) {
      this.folderCtr?.setValidators([Validators.required])
    }
    this.parentFolderCtr?.setValue(this.data.genData.parent_folder);
    this.helpers.setAutoCompleteValue(this.roleCtr, ROLES, this.data.genData.role);
    this.helpers.setAutoCompleteValue(this.domainCtr, this.domains, this.data.genData.domain_id);
    this.hostnameCtr?.setValue(this.data.genData.hostname);
    this.helpers.setAutoCompleteValue(this.loginProfileCtr, this.loginProfiles, this.data.genData.login_profile_id);
    if (this.data.genData.configs) {
      this.configTemplateCtr?.setValue(this.data.genData.configs.map((item: any) => item.id));
    }
    this.helpers.validateAllFormFields(this.nodeAddForm);
  }

  ngOnDestroy(): void {
    this.selectIcons$.unsubscribe();
    this.selectDevices$.unsubscribe();
    this.selectTemplates$.unsubscribe();
    this.selectHardwares$.unsubscribe();
    this.selectDomains$.unsubscribe();
    this.selectConfigTemplates$.unsubscribe();
    this.selectLoginProfiles$.unsubscribe();
    this.selectNodes$.unsubscribe();
    this.selectNotification$.unsubscribe();
  }

  onRangeGridReady(params: GridReadyEvent) {
    this.rangeGridApi = params.api;
    this.rangeGridApi.sizeColumnsToFit();
  }

  onReservationGridReady(params: GridReadyEvent) {
    this.reservationGridApi = params.api;
    this.reservationGridApi.sizeColumnsToFit();
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
        this.rangeRowData.splice(params.rowData.index, 1);
        this.rangeGridApi.applyTransaction({ remove: [params.rowData] });
        this.toastr.success('Deleted range successfully', 'Success')
      }
    });
    return this.rangeRowData;
  }

  onDeleteReservation(params: any) {
    const dialogData = {
      title: 'User confirmation needed',
      message: 'You sure you want to delete this item?',
      submitButtonName: 'OK'
    }
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, { disableClose: true, width: '400px', data: dialogData, autoFocus: false });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.reservationRowData.splice(params.rowData.index, 1);
        this.reservationGridApi.applyTransaction({ remove: [params.rowData] });
        this.toastr.success('Deleted range successfully', 'Success')
      }
    });
    return this.reservationRowData;
  }

  addRange() {
    const jsonData = {
      name: '',
      start: '',
      stop: ''
    }
    this.rangeGridApi.applyTransaction({ add: [jsonData] });
  }

  addReservation() {
    const jsonData = {
      name: '',
      ip_address: '',
      mac_address: ''
    }
    this.reservationGridApi.applyTransaction({ add: [jsonData] });
  }

  setterValueNetwork(params: ValueSetterParams) {
    return this.helpers.setterValue(params)
  }

  private disableItems(category: string) {
    if (category == 'hw') {
      this.deviceCtr?.disable();
      this.templateCtr?.disable();
      this.hardwareCtr?.enable();
    } else {
      this.deviceCtr?.enable();
      this.templateCtr?.enable();
      this.hardwareCtr?.disable();
    }
  }

  onCategoryChange($event: MatRadioChange) {
    this.disableItems($event.value);
  }

  disableTemplate(deviceId: string) {
    this.filteredTemplatesByDevice = this.templates.filter(template => template.device.id == deviceId);
    this.filteredTemplates = this.helpers.filterOptions(this.templateCtr, this.filteredTemplatesByDevice, 'display_name');
    this.templateCtr?.setValue('');
    if (this.filteredTemplatesByDevice.length > 0) {
      this.templateCtr?.enable();
    } else {
      this.templateCtr?.disable();
    }
  }

  changeDevice() {
    this.disableTemplate(this.deviceCtr?.value.id);
  }

  selectDevice($event: MatAutocompleteSelectedEvent) {
    this.disableTemplate($event.option.value.id);
  }

  onCancel() {
    this.dialogRef.close();
  }

  addNode() {
    const jsonDataValue = {
      name: this.nameCtr?.value,
      notes: this.notesCtr?.value,
      icon_id: this.iconCtr?.value.id,
      category: this.categoryCtr?.value,
      infrastructure: this.infrastructureCtr?.value ? this.infrastructureCtr?.value : false,
      device_id: this.deviceCtr?.value.id,
      template_id: this.templateCtr?.value.id,
      hardware_id: this.hardwareCtr?.value ? this.hardwareCtr?.value.id : undefined,
      folder: this.folderCtr?.value,
      parent_folder: this.parentFolderCtr?.value,
      role: this.roleCtr?.value.id,
      domain_id: this.domainCtr?.value.id,
      hostname: this.hostnameCtr?.value,
      login_profile_id: this.loginProfileCtr?.value.id,
      project_id: this.data.projectId,
      logical_map: (this.data.mode == 'add') ? {
        map_style: {
          height: this.data.selectedMapPref.node_size,
          width: this.data.selectedMapPref.node_size,
          text_size: this.data.selectedMapPref.text_size,
          text_color: this.data.selectedMapPref.text_color,
          text_halign: this.data.selectedMapPref.text_halign,
          text_valign: this.data.selectedMapPref.text_valign,
          text_outline_color: this.data.selectedMapPref.text_outline_color,
          text_outline_width: this.data.selectedMapPref.text_outline_width,
          text_bg_color: this.data.selectedMapPref.text_bg_color,
          text_bg_opacity: this.data.selectedMapPref.text_bg_opacity,
          "background-color": "rgb(255,255,255)",
          "background-image": "",
          "background-fit": "contain"
        },
        position: this.data.newNodePosition
      } : undefined,
      physical_map: (this.data.mode == 'add') ? {
        map_style: {
          height: this.data.selectedMapPref.node_size,
          width: this.data.selectedMapPref.node_size,
          text_size: this.data.selectedMapPref.text_size,
          text_color: this.data.selectedMapPref.text_color,
          text_halign: this.data.selectedMapPref.text_halign,
          text_valign: this.data.selectedMapPref.text_valign,
          text_outline_color: this.data.selectedMapPref.text_outline_color,
          text_outline_width: this.data.selectedMapPref.text_outline_width,
          text_bg_color: this.data.selectedMapPref.text_bg_color,
          text_bg_opacity: this.data.selectedMapPref.text_bg_opacity,
          "background-color": "rgb(255,255,255)",
          "background-image": "",
          "background-fit": "contain"
        },
        position: this.data.newNodePosition
      } : undefined,
    }
    const jsonData = this.helpers.removeLeadingAndTrailingWhitespace(jsonDataValue);
    this.store.dispatch(addNewNode({ node: jsonData }));
  }

  updateNode() {
    const jsonDataValue = {
      name: this.nameCtr?.value,
      notes: this.notesCtr?.value,
      icon_id: this.iconCtr?.value.id,
      category: this.categoryCtr?.value,
      infrastructure: this.infrastructureCtr?.value ? this.infrastructureCtr?.value : false,
      device_id: this.deviceCtr?.value.id,
      template_id: this.templateCtr?.value.id,
      hardware_id: this.hardwareCtr?.value ? this.hardwareCtr?.value.id : undefined,
      folder: this.folderCtr?.value,
      parent_folder: this.parentFolderCtr?.value,
      role: this.roleCtr?.value.id,
      domain_id: this.domainCtr?.value.id,
      hostname: this.hostnameCtr?.value,
      login_profile_id: this.loginProfileCtr?.value.id ? this.loginProfileCtr?.value.id : null,
      project_id: this.data.genData.project_id,
      is_add_log: true
    }
    const jsonData = this.helpers.removeLeadingAndTrailingWhitespace(jsonDataValue);
    const isUpdateConfigDefault = JSON.stringify(this.defaultConfig, null, 2) !== this.editor.value;
    let configDefaultNode;
    if (isUpdateConfigDefault) {
      const isNodeConfigDataFormatted = this.helpers.validateJSONFormat(this.editor.value)
      const isValidJsonForm = this.helpers.validateFieldFormat(this.editor.value)
      const isValidJsonFormBGP = this.helpers.validationBGP(this.editor.value)
      const isDCHPFormValid = this.helpers.validateDHCPData(this.editor.value)
      if (isNodeConfigDataFormatted && isValidJsonForm && isValidJsonFormBGP && isDCHPFormValid) {
        configDefaultNode = {
          node_id: this.data.genData.id,
          config_id: this.data.genData.default_config_id,
          ...JSON.parse(this.editor.value)
        }
      }
    }
    this.store.dispatch(updateNode({
      id: this.data.genData.id,
      data: jsonData,
      configTemplate: this.configTemplateCtr?.value,
      configDefaultNode,
      mapCategory: this.data.mapCategory
    }));
  }

  changeViewToEdit() {
    this.configTemplateCtr?.enable();
    this.categoryCtr?.enable();
    this.infrastructureCtr?.enable();
    this.data.mode = 'update';
    this.isViewMode = false;
    this.folderCtr?.setValidators([Validators.required])
    this.folderCtr?.updateValueAndValidity()
  }

  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
  }

  showAddConfigForm() {
    this.showFormAdd(this.addTypeCtr?.value.id);
  }

  selectAddType($event: MatAutocompleteSelectedEvent) {
    this.showFormAdd($event.option.value.id)
  }

  disableItemsConfig(category: string) {
    if (category === 'port_forward') {
      this.actionCtr?.disable();
      this.protocolCtr?.disable();
      this.sourcePortCtr?.disable();
      this.targetCtr?.enable();
      this.targetPortCtr?.enable();
    } else {
      this.actionCtr?.enable();
      this.protocolCtr?.enable();
      this.sourcePortCtr?.enable();
      this.targetCtr?.disable();
      this.targetPortCtr?.disable();
      this.targetCustomPortCtr?.disable();
    }
  }

  onCategoryChangeConfig($event: any) {
    this.disableItemsConfig($event.value)
  }

  onChangeSourcePort($event: any) {
    if ($event.value === "other") {
      this.sourceCustomPortCtr?.enable();
    } else {
      this.sourceCustomPortCtr?.disable();
    }
  }

  onChangeDestinationPort($event: any) {
    if ($event.value === "other") {
      this.destCustomPortCtr?.enable();
    } else {
      this.destCustomPortCtr?.disable();
    }
  }

  onChangeTargetPort($event: any) {
    if ($event.value === "other") {
      this.targetCustomPortCtr?.enable();
    } else {
      this.targetCustomPortCtr?.disable();
    }
  }

  addRoute() {
    const jsonDataValue = {
      config_type: "static_route",
      config_id: this.data.genData.default_config_id,
      name: this.data.genData.name,
      description: this.data.genData.description,
      route: this.routeCtr?.value,
      next_hop: this.nextHopCtr?.value,
      interface: this.interfaceCtr?.value,
      node_id: this.data.genData.id
    }
    const jsonData = this.helpers.removeLeadingAndTrailingWhitespace(jsonDataValue);
    this.configTemplateService.addConfiguration(jsonData).pipe(
      catchError(err => {
        this.toastr.error('Add Route failed', 'Error');
        return throwError(() => err);
      })
    ).subscribe((response) => {
      this._setEditorData(response.result)
      this.toastr.success('Add Route successfully', 'Success');
      this.configTemplateService.getAll().subscribe((data: any) => this.store.dispatch(retrievedConfigTemplates({ data: data.result })));
    });
  }

  addFirewallRule() {
    const jsonDataValue = {
      config_type: "firewall",
      config_id: this.data.genData.default_config_id,
      category: this.categoryFirewallRuleCtr?.value,
      name: this.nameFirewallRuleCtr?.value,
      state: this.stateCtr?.value,
      action: this.actionCtr?.value,
      interface: this.interfaceFirewallCtr?.value,
      protocol: this.protocolCtr?.value,
      source: this.sourceCtr?.value,
      source_port: this.sourcePortCtr?.value,
      source_port_custom: this.sourceCustomPortCtr?.value,
      destination: this.destinationCtr?.value,
      dest_port: this.destinationPortCtr?.value,
      dest_port_custom: this.destCustomPortCtr?.value,
      target: this.targetCtr?.value,
      target_port: this.targetPortCtr?.value,
      target_port_custom: this.targetCustomPortCtr?.value,
      node_id: this.data.genData.id
    }
    const jsonData = this.helpers.removeLeadingAndTrailingWhitespace(jsonDataValue);
    this.configTemplateService.addConfiguration(jsonData).pipe(
      catchError(err => {
        this.toastr.error('Add Firewall Rule failed', 'Error');
        return throwError(() => err);
      })
    ).subscribe((response) => {
      this._setEditorData(response.result)
      this.toastr.success('Add Firewall Rule successfully', 'Success');
      this.configTemplateService.getAll().subscribe((data: any) => this.store.dispatch(retrievedConfigTemplates({ data: data.result })));
    });
  }

  addDomainMembership() {
    const jsonDataValue = {
      config_type: "domain_membership",
      config_id: this.data.genData.default_config_id,
      join_domain: this.joinDomainCtr?.value,
      ou_path: this.ouPathCtr?.value,
      node_id: this.data.genData.id
    }
    const jsonData = this.helpers.removeLeadingAndTrailingWhitespace(jsonDataValue);
    this.configTemplateService.addConfiguration(jsonData).pipe(
      catchError(err => {
        this.toastr.error('Add Domain Membership failed', 'Error');
        return throwError(() => err);
      })
    ).subscribe((response) => {
      this._setEditorData(response.result)
      this.toastr.success('Add Domain Membership successfully', 'Success');
      this.configTemplateService.getAll().subscribe((data: any) => this.store.dispatch(retrievedConfigTemplates({ data: data.result })));
    });
  }

  addRoleServices() {
    const jsonData = {
      config_type: "role_services",
      config_id: this.data.genData.default_config_id,
      role_services: this.rolesCtr?.value,
      node_id: this.data.genData.id
    }
    this.configTemplateService.addConfiguration(jsonData).pipe(
      catchError(err => {
        this.toastr.error('Add Roles & Service failed', 'Error')
        return throwError(() => err);
      })
    ).subscribe((response) => {
      this._setEditorData(response.result)
      this.toastr.success('Add Roles & Service successfully', 'Success');
      this.configTemplateService.getAll().subscribe((data: any) => this.store.dispatch(retrievedConfigTemplates({ data: data.result })));
    });
  }

  addOSPF() {
    const jsonDataValue = {
      config_type: "ospf",
      config_id: this.data.genData.default_config_id,
      networks: this.helpers.processNetworksField(this.networksCtr?.value),
      bgp_state: this.bgpStateCtr?.value,
      bgp_metric_type: parseInt(this.bgpMetricTypeCtr?.value),
      connected_state: this.connectedStateCtr?.value,
      connected_metric_type: parseInt(this.connectedMetricTypeCtr?.value),
      static_state: this.staticStateCtr?.value,
      static_metric_type: parseInt(this.staticMetricTypeCtr?.value),
      node_id: this.data.genData.id
    }
    const jsonData = this.helpers.removeLeadingAndTrailingWhitespace(jsonDataValue);
    this.configTemplateService.addConfiguration(jsonData).pipe(
      catchError(err => {
        this.toastr.error('Add OPSF failed', 'Error');
        return throwError(() => err);
      })
    ).subscribe((response) => {
      this._setEditorData(response.result);
      this.toastr.success('Add OPSF successfully', 'Success');
      this.configTemplateService.getAll().subscribe((data: any) => this.store.dispatch(retrievedConfigTemplates({ data: data.result })));
    });
  }

  addBGP() {
    const jsonDataValue = {
      config_type: "bgp",
      config_id: this.data.genData.default_config_id,
      ip_address: this.ipCtr?.value.ip || this.ipCtr?.value,
      asn: this.asnCtr?.value,
      neighbor_ip: this.neighborIpCtr?.value,
      neighbor_asn: this.neighborAsnCtr?.value,
      bgp_connected_state: this.bgpConnectedStateCtr?.value,
      bgp_connected_metric: parseInt(this.bgpConnectedMetricCtr?.value),
      bgp_ospf_state: this.bgpOspfStateCtr?.value,
      bgp_ospf_metric: parseInt(this.bgpOspfMetricCtr?.value),
      node_id: this.data.genData.id
    }
    const jsonData = this.helpers.removeLeadingAndTrailingWhitespace(jsonDataValue);
    this.configTemplateService.addConfiguration(jsonData).pipe(
      catchError(err => {
        this.toastr.error('Add BGP failed', 'Error');
        return throwError(() => err);
      })
    ).subscribe((response) => {
      this._setEditorData(response.result)
      this.toastr.success('Add BGP successfully', 'Success');
      this.configTemplateService.getAll().subscribe((data: any) => this.store.dispatch(retrievedConfigTemplates({ data: data.result })));
    });
  }

  addDHCP() {
    let ranges: RangeModel[] = [];
    let ipReservations: IpReservationModel[] = [];
    this.rangeGridApi.forEachNode(rangeNode => ranges.push(rangeNode.data));
    this.reservationGridApi.forEachNode(ipReservationNode => ipReservations.push(ipReservationNode.data))
    const isRangesExistEmptyValue = ranges.some(range => range.name === '' || range.start === '' || range.stop === '')
    if (isRangesExistEmptyValue) {
      this.toastr.warning('All fields in the Range table are required!', 'Warning')
    } else {
      const isIpReservationExistEmptyValue = ipReservations.some(ipReservation => ipReservation.name === '' &&
        ipReservation.ip_address === '')
      if (isIpReservationExistEmptyValue) {
        this.toastr.warning('All fields in the IP Reservation table are required!', 'Warning')
      } else {
        const jsonDataValue = {
          config_type: 'dhcp_server',
          config_id: this.data.genData.default_config_id,
          name: this.nameDHCPCtr?.value,
          authoritative: this.authoritativeCtr?.value,
          subnet: this.subnetCtr?.value,
          lease: parseInt(this.leaseCtr?.value),
          dns_server: this.dnsServerCtr?.value,
          ntp_server: this.ntpServerCtr?.value,
          ranges: ranges,
          ip_reservations: ipReservations,
          node_id: this.data.genData.id
        }
        const jsonData = this.helpers.removeLeadingAndTrailingWhitespace(jsonDataValue)
        this.configTemplateService.addConfiguration(jsonData).pipe(
          catchError(error => {
            this.toastr.error('Add a new DHCP failed', 'Error');
            return throwError(() => error)
          })
        ).subscribe(response => {
          this._setEditorData(response.result)
          this.toastr.success('Add a new DHCP successfully', 'Success');
          this.configTemplateService.getAll().subscribe((data: any) => this.store.dispatch(retrievedConfigTemplates({data: data.result})));
        })
      }
    }
  }

  showFormAdd(addType: string) {
    switch (addType) {
      case 'add_route':
        this.isAddRoute = true;
        this.isAddFirewallRule = false;
        this.isAddDomainMembership = false;
        this.isAddRolesAndService = false;
        this.isAddOSPF = false;
        this.isAddBGP = false;
        this.isAddDHCP = false;
        this.dialogRef.updateSize('1000px')
        break;
      case 'add_firewall_rule':
        this.isAddRoute = false;
        this.isAddFirewallRule = true;
        this.isAddDomainMembership = false;
        this.isAddRolesAndService = false;
        this.isAddOSPF = false;
        this.isAddBGP = false;
        this.isAddDHCP = false;
        this.dialogRef.updateSize('1000px')
        break;
      case 'add_domain_membership':
        this.isAddRoute = false;
        this.isAddFirewallRule = false;
        this.isAddDomainMembership = true;
        this.isAddRolesAndService = false;
        this.isAddOSPF = false;
        this.isAddBGP = false;
        this.isAddDHCP = false;
        this.dialogRef.updateSize('1000px')
        break;
      case 'add_roles_service':
        this.isAddRoute = false;
        this.isAddFirewallRule = false;
        this.isAddDomainMembership = false;
        this.isAddRolesAndService = true;
        this.isAddOSPF = false;
        this.isAddBGP = false;
        this.isAddDHCP = false;
        this.dialogRef.updateSize('1000px')
        break;
      case 'add_ospf':
        this.isAddRoute = false;
        this.isAddFirewallRule = false;
        this.isAddDomainMembership = false;
        this.isAddRolesAndService = false;
        this.isAddOSPF = true;
        this.isAddBGP = false;
        this.isAddDHCP = false;
        this.dialogRef.updateSize('1000px')
        break;
      case 'add_bgp':
        this.isAddRoute = false;
        this.isAddFirewallRule = false;
        this.isAddDomainMembership = false;
        this.isAddRolesAndService = false;
        this.isAddOSPF = false;
        this.isAddBGP = true;
        this.isAddDHCP = false;
        this.dialogRef.updateSize('1000px')
        break;
      case 'add_dhcp':
        this.isAddDHCP = true;
        this.isAddRoute = false;
        this.isAddFirewallRule = false;
        this.isAddDomainMembership = false;
        this.isAddRolesAndService = false;
        this.isAddOSPF = false;
        this.isAddBGP = false;
        this.dialogRef.updateSize('1200px')
        break;
      default:
        this.isAddRoute = false;
        this.isAddFirewallRule = false;
        this.isAddDomainMembership = false;
        this.isAddRolesAndService = false;
        this.isAddOSPF = false;
        this.isAddBGP = false;
        this.isAddDHCP = false;
    }
  }

  private _setEditorData(data: any) {
    this.defaultConfig = data;
    this.editor.value = JSON.stringify(this.defaultConfig, null, 2);
  }

  hideAddForm() {
    this.isAddRoute = false;
    this.isAddFirewallRule = false;
    this.isAddDomainMembership = false;
    this.isAddRolesAndService = false;
    this.isAddOSPF = false;
    this.isAddBGP = false;
  }
}
