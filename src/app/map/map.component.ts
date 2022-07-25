import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { MapModel } from '../shared/models/map.model';
import { retrievedMap } from '../shared/store/map/map.actions';
import { environment } from 'src/environments/environment';
import * as cytoscape from 'cytoscape';
import { MapService } from '../shared/services/map/map.service';
import { HelpersService } from '../shared/services/helpers/helpers.service';
import { selectMapFeature } from '../shared/store/map/map.selectors';
import { retrievedIcons } from '../shared/store/icon/icon.actions';
import { retrievedDevices } from '../shared/store/device/device.actions';
import { retrievedTemplates } from '../shared/store/template/template.actions';
import { retrievedHardwares } from '../shared/store/hardware/hardware.actions';
import { retrievedDomains } from '../shared/store/domain/domain.actions';
import { retrievedConfigTemplates } from '../shared/store/config-template/config-template.actions';
import { retrievedLoginProfiles } from '../shared/store/login-profile/login-profile.actions';
import { IconService } from '../shared/services/icon/icon.service';
import { DeviceService } from '../shared/services/device/device.service';
import { TemplateService } from '../shared/services/template/template.service';
import { HardwareService } from '../shared/services/hardware/hardware.service';
import { DomainService } from '../shared/services/domain/domain.service';
import { ConfigTemplateService } from '../shared/services/config-template/config-template.service';
import { LoginProfileService } from '../shared/services/login-profile/login-profile.service';
import { selectIcons } from '../shared/store/icon/icon.selectors';
import { selectDevices } from '../shared/store/device/device.selectors';
import { selectTemplates } from '../shared/store/template/template.selectors';
import { selectHardwares } from '../shared/store/hardware/hardware.selectors';
import { selectDomains } from '../shared/store/domain/domain.selectors';
import { selectConfigTemplates } from '../shared/store/config-template/config-template.selectors';
import { selectLoginProfiles } from '../shared/store/login-profile/login-profile.selectors';
import { MatDialog } from '@angular/material/dialog';
import { AddUpdateNodeDialogComponent } from './add-update-node-dialog/add-update-node-dialog.component';
import { selectNodeAdd } from '../shared/store/node/node.selectors';
import { NodeService } from '../shared/services/node/node.service';
import { selectMapPref } from '../shared/store/map-pref/map-pref.selectors';
import { ToastrService } from 'ngx-toastr';
var navigator = require('cytoscape-navigator');


@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {
  cy: any;
  isOpenToolPanel = true;
  isDisableCancel = true;
  isDisableAddNode = false;
  isDisableAddPG = false;
  isDisableAddImage = false;
  isAddNode = false;
  mapCategory = '';
  collectionId = '1';
  nodes: any;
  interfaces: any;
  groupBoxes: any;
  mapBackgrounds: any;
  mapProperties: any;
  defaultPreferences: any;
  config: any;
  styleExists: any;
  cleared: any;
  eles: any[] = [];
  icons!: any[];
  devices!: any[];
  templates!: any[];
  hardwares!: any[];
  domains!: any[];
  configTemplates!: any[];
  loginProfiles!: any[];
  isCustomizeNode = true;
  deviceId = '';
  templateId = '';
  selectedDefaultPref: any;
  selectMap$ = new Subscription();
  selectIcons$ = new Subscription();
  selectDevices$ = new Subscription();
  selectTemplates$ = new Subscription();
  selectHardwares$ = new Subscription();
  selectDomains$ = new Subscription();
  selectConfigTemplates$ = new Subscription();
  selectLoginProfiles$ = new Subscription();
  selectNodeAdd$ = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private store: Store,
    private helpers: HelpersService,
    private mapService: MapService,
    private iconService: IconService,
    private deviceService: DeviceService,
    private templateService: TemplateService,
    private hardwareService: HardwareService,
    private domainService: DomainService,
    private configTemplateService: ConfigTemplateService,
    private loginProfileService: LoginProfileService,
    private nodeService: NodeService,
    private dialog: MatDialog,
    private toastr: ToastrService,
  ) {
    navigator(cytoscape);
    this.selectMap$ = this.store.select(selectMapFeature).subscribe((map: MapModel) => {
      if (Object.keys(map).length > 0) {
        this.nodes = map.nodes;
        this.interfaces = map.interfaces;
        this.groupBoxes = map.groupBoxes;
        this.nodes = map.nodes;
        this.mapBackgrounds = map.mapBackgrounds;
        this.mapProperties = map.mapProperties;
        this.defaultPreferences = map.defaultPreferences;
        this._initCytoscape();
        this._initMouseEvents();
      }
    });
    this.selectIcons$ = this.store.select(selectIcons).subscribe((icons: any) => {
      this.icons = icons;
    });
    this.selectDevices$ = this.store.select(selectDevices).subscribe((devices: any) => {
      this.devices = devices;
    });
    this.selectTemplates$ = this.store.select(selectTemplates).subscribe((templates: any) => {
      this.templates = templates;
    });
    this.selectHardwares$ = this.store.select(selectHardwares).subscribe((hardwares: any) => {
      this.hardwares = hardwares;
    });
    this.selectDomains$ = this.store.select(selectDomains).subscribe((domains: any) => {
      this.domains = domains;
    });
    this.selectConfigTemplates$ = this.store.select(selectConfigTemplates).subscribe((configTemplates: any) => {
      this.configTemplates = configTemplates;
    });
    this.selectLoginProfiles$ = this.store.select(selectLoginProfiles).subscribe((loginProfiles: any) => {
      this.loginProfiles = loginProfiles;
    });
    this.store.select(selectMapPref).subscribe((selectedDefaultPref: any) => {
      this.selectedDefaultPref = selectedDefaultPref;
    });
    this.selectNodeAdd$ = this.store.select(selectNodeAdd).subscribe((addNode: any) => {
      if (addNode) {
        if (addNode.isAddNode) {
          this.isDisableAddNode = true;
          this.isDisableAddPG = true;
          this.isDisableAddImage = true;
          this.isDisableCancel = false;
        }
        this.isAddNode = addNode.isAddNode;
        this.deviceId = addNode.deviceId;
        this.templateId = addNode.templateId;
        this.isCustomizeNode = addNode.isCustomizeNode;
      }
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params: Params) => {
      this.mapCategory = params['category'];
      this.collectionId = params['collection_id'];
      this.mapService.getMapData(params['category'], params['collection_id']).subscribe((data: any) => this.store.dispatch(retrievedMap({ data })));
    });
    this.iconService.getAll().subscribe((data: any) => this.store.dispatch(retrievedIcons({ data: data.result })));
    this.deviceService.getAll().subscribe((data: any) => this.store.dispatch(retrievedDevices({ data: data.result })));
    this.templateService.getAll().subscribe((data: any) => this.store.dispatch(retrievedTemplates({ data: data.result })));
    this.hardwareService.getAll().subscribe((data: any) => this.store.dispatch(retrievedHardwares({ data: data.result })));
    this.domainService.getAll().subscribe((data: any) => this.store.dispatch(retrievedDomains({ data: data.result })));
    this.configTemplateService.getAll().subscribe((data: any) => this.store.dispatch(retrievedConfigTemplates({ data: data.result })));
    this.loginProfileService.getAll().subscribe((data: any) => this.store.dispatch(retrievedLoginProfiles({ data: data.result })));
  }

  ngOnDestroy(): void {
    this.selectMap$.unsubscribe();
    this.selectIcons$.unsubscribe();
    this.selectDevices$.unsubscribe();
    this.selectTemplates$.unsubscribe();
    this.selectHardwares$.unsubscribe();
    this.selectDomains$.unsubscribe();
    this.selectConfigTemplates$.unsubscribe();
    this.selectLoginProfiles$.unsubscribe();
  }

  private _dragFreeOnNode() {
    console.log('dragFreeOnNode');
  }

  private _zoom() {
    console.log('zoom');
  }

  private _tapNode() {
    console.log('tapNode');
  }

  private _selectNode() {
    console.log('selectNode');
  }

  private _selectEdge() {
    console.log('selectEdge');
  }

  private _unselectNode() {
    console.log('unselectNode');
  }

  private _unselectEdge() {
    console.log('unselectEdge');
  }

  private _boxStart() {
    console.log('boxStart');
  }

  private _boxSelect() {
    console.log('boxSelect');
  }

  private _boxCheck() {
    console.log('boxCheck');
  }

  private _click($event: any) {
    if (this.isAddNode && this.deviceId && this.templateId) {
      this.nodeService.getGenNodeData(this.collectionId, this.deviceId, this.templateId)
        .subscribe(genData => {
          const icon_src = '/static/img/uploads/' + genData.icon.photo;
          const newNodeData = {
            "elem_category": "node",
            "icon": icon_src,
            "type": genData.role,
            "zIndex": 999,
            "background-image": icon_src,
            "background-opacity": 0,
            "shape": "roundrectangle",
            "text-opacity": 1
          }
          const newNodePosition = { x: $event.position.x, y: $event.position.y }
          if (this.isCustomizeNode) {
            const dialogData = {
              mode: 'add',
              collectionId: this.collectionId,
              icons: this.icons,
              devices: this.devices,
              templates: this.templates,
              hardwares: this.hardwares,
              domains: this.domains,
              configTemplates: this.configTemplates,
              loginProfiles: this.loginProfiles,
              genData: genData,
              selectedDefaultPref: this.selectedDefaultPref,
              newNodeData,
              newNodePosition,
              cy: this.cy
            }
            const dialogRef = this.dialog.open(AddUpdateNodeDialogComponent, { width: '500px', data: dialogData });
            dialogRef.afterClosed().subscribe((_data: any) => {
              this.isAddNode = false;
              this.isDisableAddNode = false;
              this.isDisableAddPG = false;
              this.isDisableAddImage = false;
              this.isDisableCancel = true;
              // this.reloadGroupBoxes();
            });
          } else {
            const jsonData = {
              name: genData.name,
              notes: genData.notes,
              collection_id: genData.collection_id,
              icon_id: genData.icon_id,
              category: genData.category,
              device_id: genData.device_id,
              template_id: genData.template_id,
              hardware_id: null,
              folder: genData.folder,
              role: genData.role,
              domain_id: genData.domain_id,
              hostname: genData.hostname,
              logical_map_position: newNodePosition
            };
            this.nodeService.add(jsonData).subscribe((respData: any) => {
              const node_id = respData.id;
              const cyData = respData.result;
              cyData.id = 'node-' + node_id;
              cyData.node_id = node_id;
              cyData.domain = genData.domain.name;
              this.helpers.addCYNode(this.cy, { newNodeData: { ...newNodeData, ...cyData }, newNodePosition });
              this.toastr.success('Quick add node successfully!');
              // this.reloadGroupBoxes();
            });
          }
        });
    }
  }

  private _nodeEditing() {
    console.log('nodeEditing');
  }

  private _cdndDrop() {
    console.log('cdndDrop');
  }

  private _keyDown() {
    console.log('keyDown');
  }

  private _initCytoscape(): void {
    this.config = {
      default_preferences: {
        ...this.defaultPreferences,
        default_icon_path: "/assets/icons/default_icon.png",
        default_img_path: "/static/img/uploads/",
        public_portgroup_url: '/api/v1/portgroup/gen_data/public',
        private_portgroup_url: '/api/v1/portgroup/gen_data/private',
        node_view_url: '/ap1/v1/node/gen_data',
        enc_node_view_url: '/nodeview/gen_enc_data/',
        save_url: '/api/v1/map/save_data/' + this.mapCategory,
        enclave_save_url: "/enclaveview/save_map/" + this.collectionId,
        enc_to_proj: "/enclaveview/enclave_to_project/",
        enc_to_enc: "/enclaveview/enclave_to_enclave/",
        infra_to_proj: "/infraview/infra_to_project/"
      },
      gb_exists: this.groupBoxes?.length > 0 ? true : false,
      live_packets: false,
      default_domain_id: this.mapProperties.default_domain_id,
      styleExists: this.defaultPreferences.accessed,
      cleared: this.defaultPreferences.cleared,
      grid_settings: this.defaultPreferences.grid_settings ? this.defaultPreferences.grid_settings : null,
      nodes_size_max: 200,
      text_size_max: 200,
      edge_size_max: 50,
      port_group_max: 200,
      grid_spacing_max: 200,
      display_map_overview: true,
      display_map_grid: false,
      grid_space_default: "100",
      display_status: true,
      range_map_refresh_time: 30000,
      search_color: "rgb(255,255,50)",
      debug_output: false,
      grid_on_options: {
        snapToGridOnRelease: true,
        snapToGridDuringDrag: false,
        snapToAlignmentLocationOnRelease: false,
        snapToAlignmentLocationDuringDrag: false,
        distributionGuidelines: false,
        geometricGuideline: false,
        initPosAlignment: false,
        centerToEdgeAlignment: false,
        resize: false,
        parentPadding: false,
        drawGrid: true,
        gridSpacing: "100",
        snapToGridCenter: false,
        zoomDash: true,
        panGrid: true,
        gridStackOrder: 0,
        gridColor: '#c7c7c7',
        lineWidth: 1.0,
        guidelinesTolerance: 2.00,
        guidelinesStyle: {
          strokeStyle: "#8b7d6b",
          geometricGuidelineRange: 400,
          range: 100,
          minDistRange: 10,
          distGuidelineOffset: 10,
          horizontalDistColor: "#ff0000",
          verticalDistColor: "#00ff00",
          initPosAlignmentColor: "#0000ff",
          lineDash: [0, 0],
          horizontalDistLine: [0, 0],
          verticalDistLine: [0, 0],
          nitPosAlignmentLine: [0, 0],
          parentSpacing: -1
        }
      },
      grid_off_options: {
        drawGrid: false,
        snapToGridOnRelease: false,
        snapToGridDuringDrag: false,
      },
      nav_defaults: {
        container: false,
        viewLiveFramerate: 0,
        thumbnailEventFramerate: 30,
        thumbnailLiveFramerate: false,
        dblClickDelay: 200,
        removeCustomContainer: true,
        rerenderDelay: 100,
        zIndex: -999,
      },
      tool_panel: {
        zIndex: -999,
        isRange: true
      },
      info_panel: {
      },
      cdnd_enable_options: {
        grabbedNode: (_node: any) => true,
        dropTarget: (_node: any) => true,
        dropSibling: (_node: any) => true,
        newParentNode: (_grabbedNode: any, _dropSibling: any) => ({}),
        overThreshold: 10,
        outThreshold: 10
      }
    }
    this.styleExists = this.mapProperties.styleExists;
    this.cleared = this.mapProperties.cleared;
    this.eles = JSON.parse(JSON.stringify(this.nodes
      .concat(this.interfaces)
      .concat(this.mapBackgrounds)));
    this.eles.forEach(ele => {
      ele.locked = ele.data.locked
      if (ele.data.elem_category == 'node') {
        ele.data.icon = environment.apiBaseUrl + ele.data.icon;
      }
    });
    this.cy = cytoscape({
      container: document.getElementById("cy"),
      elements: this.eles,
      style: this.helpers.generateCyStyle(this.config.default_preferences),
      layout: (this.styleExists || this.cleared) ? { name: 'preset' } : {
        name: "cose",
        avoidOverlap: true,
        nodeDimensionsIncludeLabels: true,
        spacingFactor: 5,
        fit: true,
        animate: false,
      },
      wheelSensitivity: 0.2,
    });
  }

  private _initMouseEvents() {
    this.cy.removeAllListeners();

    this.cy.on("dragfreeon", "node", this._dragFreeOnNode.bind(this));
    this.cy.on("zoom", this._zoom.bind(this));
    this.cy.on("tap", "node", this._tapNode.bind(this));
    this.cy.on("select", "node", this._selectNode.bind(this)) //3
    this.cy.on("select", "edge", this._selectEdge.bind(this))
    this.cy.on("unselect", "node", this._unselectNode.bind(this))
    this.cy.on("unselect", "edge", this._unselectEdge.bind(this))
    this.cy.on("boxstart", this._boxStart.bind(this)) //1
    this.cy.on("boxselect", this._boxSelect.bind(this)) //4
    this.cy.on("box", this._boxCheck.bind(this)) //2
    this.cy.on("click", this._click.bind(this));
    this.cy.on("nodeediting.resizeend", this._nodeEditing.bind(this));
    this.cy.on('cdnddrop', this._cdndDrop.bind(this));
    this.cy.on("noderesize.resizeend", (_e: any, _type: any) => {
      document.body.style.cursor = "initial";
    });

    document.addEventListener("keydown", this._keyDown.bind(this));
  }
}
