import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { catchError, delay, ReplaySubject, Subject, Subscription, throwError } from 'rxjs';
import { retrievedIsMapOpen, retrievedMap } from '../store/map/map.actions';
import { environment } from 'src/environments/environment';
import * as cytoscape from 'cytoscape';
import { HelpersService } from '../core/services/helpers/helpers.service';
import { selectInterfaces, selectMapFeature } from '../store/map/map.selectors';
import { retrievedIcons } from '../store/icon/icon.actions';
import { retrievedDevices } from '../store/device/device.actions';
import { retrievedTemplates } from '../store/template/template.actions';
import { retrievedHardwares } from '../store/hardware/hardware.actions';
import { retrievedDomains } from '../store/domain/domain.actions';
import { retrievedConfigTemplates } from '../store/config-template/config-template.actions';
import { retrievedLoginProfiles } from '../store/login-profile/login-profile.actions';
import { DeviceService } from '../core/services/device/device.service';
import { ConfigTemplateService } from '../core/services/config-template/config-template.service';
import { MatDialog } from '@angular/material/dialog';
import { AddUpdateNodeDialogComponent } from './add-update-node-dialog/add-update-node-dialog.component';
import { selectMapEdit } from '../store/map-edit/map-edit.selectors';
import { selectMapPref } from '../store/map-style/map-style.selectors';
import { ToastrService } from 'ngx-toastr';
import { AddUpdatePGDialogComponent } from './add-update-pg-dialog/add-update-pg-dialog.component';
import { AddUpdateInterfaceDialogComponent } from './add-update-interface-dialog/add-update-interface-dialog.component';
import { retrievedPortGroups } from '../store/portgroup/portgroup.actions';
import { selectPortGroups } from '../store/portgroup/portgroup.selectors';
import { MapState } from '../store/map/map.state';
import { CMActionsService } from './context-menu/cm-actions/cm-actions.service';
import { TemplateService } from '../core/services/template/template.service';
import { NodeService } from '../core/services/node/node.service';
import { PortGroupService } from '../core/services/portgroup/portgroup.service';
import { InterfaceService } from '../core/services/interface/interface.service';
import { selectIcons } from '../store/icon/icon.selectors';
import { selectDomains } from '../store/domain/domain.selectors';
import { CMAddService } from './context-menu/cm-add/cm-add.service';
import { CMViewDetailsService } from './context-menu/cm-view-details/cm-view-details.service';
import { CMDeleteService } from './context-menu/cm-delete/cm-delete.service';
import { CMEditService } from './context-menu/cm-edit/cm-edit.service';
import { CMGroupBoxService } from './context-menu/cm-groupbox/cm-groupbox.service';
import { CMLockUnlockService } from './context-menu/cm-lock-unlock/cm-lock-unlock.service';
import { CMRemoteService } from './context-menu/cm-remote/cm-remote.service';
import { CMMapService } from './context-menu/cm-map/cm-map.service';
import { IconService } from '../core/services/icon/icon.service';
import { HardwareService } from '../core/services/hardware/hardware.service';
import { DomainService } from '../core/services/domain/domain.service';
import { LoginProfileService } from '../core/services/login-profile/login-profile.service';
import { SearchService } from '../core/services/search/search.service';
import { MapService } from '../core/services/map/map.service';
import { selectSearchText } from '../store/map-option/map-option.selectors';
import { CommonService } from 'src/app/map/context-menu/cm-common-service/common.service';
import { ToolPanelStyleService } from 'src/app/core/services/tool-panel-style/tool-panel-style.service';
import { ServerConnectService } from "../core/services/server-connect/server-connect.service";
import { ProjectService } from "../project/services/project.service";
import { retrievedVMStatus } from "../store/project/project.actions";
import { ICON_PATH } from '../shared/contants/icon-path.constant';
import { InfoPanelService } from '../core/services/info-panel/info-panel.service';
import { retrievedInterfacesByIds } from "../store/interface/interface.actions";
import { retrievedMapSelection } from '../store/map-selection/map-selection.actions';
import { selectIsConnect } from "../store/server-connect/server-connect.selectors";
import { MapImageService } from '../core/services/map-image/map-image.service';
import { retrievedMapImages } from '../store/map-image/map-image.actions';
import { RouteSegments } from "../core/enums/route-segments.enum";
import { ContextMenuService } from './context-menu/context-menu.service';
import { retrievedMapEdit } from "../store/map-edit/map-edit.actions";

const navigator = require('cytoscape-navigator');
const gridGuide = require('cytoscape-grid-guide');
const expandCollapse = require('cytoscape-expand-collapse');
const undoRedo = require('cytoscape-undo-redo');
const contextMenus = require('cytoscape-context-menus');
const panzoom = require('cytoscape-panzoom');
const compoundDragAndDrop = require('cytoscape-compound-drag-and-drop');
const nodeEditing = require('cytoscape-node-editing');
const konva = require('konva');
const jquery = require('jquery');
const popper = require('cytoscape-popper');


@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements AfterViewInit, OnDestroy {
  cy: any;
  ur: any;
  isOpenToolPanel = true;
  isDisableCancel = true;
  isDisableAddNode = true;
  isDisableAddPG = false;
  isDisableAddImage = false;
  isAddNode = false;
  isAddPublicPG = false;
  isAddPrivatePG = false;
  mapCategory = '';
  collectionId = '0';
  nodes: any;
  interfaces: any;
  groupBoxes: any;
  icons!: any[];
  domains!: any[];
  mapBackgrounds: any;
  mapProperties: any;
  defaultPreferences: any;
  config: any;
  styleExists: any;
  cleared: any;
  eles: any[] = [];
  isCustomizeNode = true;
  isCustomizePG = true;
  deviceId = '';
  templateId = '';
  selectedMapPref: any;
  portGroups!: any[];
  gateways!: any[];
  newEdgeData: any;
  e: any;
  inv: any;
  edgeNode: any;
  edgePortGroup: any;
  isAddEdge: any;
  isAddTunnel: any;
  deletedNodes: any[] = [];
  deletedInterfaces: any[] = [];
  activeNodes: any[] = [];
  activePGs: any[] = [];
  activeEdges: any[] = [];
  activeGBs: any[] = [];
  activeMBs: any[] = [];
  isBoxSelecting = false;
  isSearching = false;
  isSelectedProcessed = false;
  connectionId = 0;
  vmStatus!: boolean;
  boxSelectedNodes = new Set();
  selectMap$ = new Subscription();
  selectMapPref$ = new Subscription();
  selectMapEdit$ = new Subscription();
  selectPortGroups$ = new Subscription();
  selectIcons$ = new Subscription();
  selectDomains$ = new Subscription();
  selectInterfaces$ = new Subscription();
  selectSearchText$ = new Subscription();
  selectIsConnect$ = new Subscription();
  selectMapFeatureSubject: Subject<MapState> = new ReplaySubject(1);
  destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store,
    private helpersService: HelpersService,
    private mapService: MapService,
    private iconService: IconService,
    private deviceService: DeviceService,
    private templateService: TemplateService,
    private hardwareService: HardwareService,
    private domainService: DomainService,
    private configTemplateService: ConfigTemplateService,
    private loginProfileService: LoginProfileService,
    private nodeService: NodeService,
    private portgroupService: PortGroupService,
    private interfaceService: InterfaceService,
    private dialog: MatDialog,
    private toastr: ToastrService,
    private cmAddService: CMAddService,
    private cmActionsService: CMActionsService,
    private cmViewDetailsService: CMViewDetailsService,
    private cmEditService: CMEditService,
    private cmDeleteService: CMDeleteService,
    private cmGroupBoxService: CMGroupBoxService,
    private cmLockUnlockService: CMLockUnlockService,
    private cmRemoteService: CMRemoteService,
    private cmMapService: CMMapService,
    private searchService: SearchService,
    private commonService: CommonService,
    private toolPanelStyleService: ToolPanelStyleService,
    private serverConnectService: ServerConnectService,
    private projectService: ProjectService,
    private infoPanelService: InfoPanelService,
    private mapImageService: MapImageService,
    private contextMenuService: ContextMenuService,
  ) {
    navigator(cytoscape);
    gridGuide(cytoscape);
    expandCollapse(cytoscape);
    undoRedo(cytoscape);
    contextMenus(cytoscape);
    panzoom(cytoscape);
    cytoscape.use(compoundDragAndDrop);
    cytoscape.use(popper);
    nodeEditing(cytoscape, jquery, konva);
    this.selectIcons$ = this.store.select(selectIcons).subscribe((icons: any) => {
      this.icons = icons;
    });
    this.selectDomains$ = this.store.select(selectDomains).subscribe((domains: any) => {
      this.domains = domains;
    });
    this.selectMap$ = this.store.select(selectMapFeature).subscribe({
      next: value => this.selectMapFeatureSubject.next(value),
      error: err => this.selectMapFeatureSubject.error(err),
      complete: () => this.selectMapFeatureSubject.complete()
    });
    this.selectMapPref$ = this.store.select(selectMapPref).subscribe((selectedMapPref: any) => {
      this.selectedMapPref = selectedMapPref;
    });
    this.selectMapEdit$ = this.store.select(selectMapEdit).subscribe((mapEdit: any) => {
      if (mapEdit) {
        this.isAddNode = mapEdit.isAddNode;
        this.templateId = mapEdit.templateId ? mapEdit.templateId : this.templateId;
        this.deviceId = mapEdit.deviceId ? mapEdit.deviceId : this.deviceId;
        this.isCustomizeNode = mapEdit.isCustomizeNode;
        this.isAddPublicPG = mapEdit.isAddPublicPG;
        this.isAddPrivatePG = mapEdit.isAddPrivatePG;
        this.isCustomizePG = mapEdit.isCustomizePG;
        if (this.isAddNode || this.isAddPublicPG || this.isAddPrivatePG) {
          this._disableMapEditButtons();
        } else {
          this._enableMapEditButtons();
        }
      }
    });
    this.selectPortGroups$ = this.store.select(selectPortGroups).subscribe((portGroups: any) => {
      this.portGroups = portGroups;
    });
    this.selectSearchText$ = this.store.select(selectSearchText).subscribe((searchText: string) => {
      if (searchText?.length > 0) {
        this.searchMap(searchText);
      } else if (searchText?.length == 0) {
        this.clearSearch();
      }
    });
    this.selectInterfaces$ = this.store.select(selectInterfaces).subscribe(interfaces => {
      if (interfaces) {
        const interfaceIds = interfaces.map((ele: any) => ele.data.id);
        this.interfaceService.getDataByPks({ pks: interfaceIds }).subscribe(response => {
          this.store.dispatch(retrievedInterfacesByIds({ data: response.result }));
        })
      }
    });
    this.selectIsConnect$ = this.store.select(selectIsConnect).subscribe(isConnect => {
      if (isConnect !== undefined) {
        const connection = this.serverConnectService.getConnection();
        this.connectionId = connection ? connection?.id : 0;
      }
    })
    this.route.queryParams.subscribe((params: Params) => {
      this.mapCategory = params['category'];
      this.collectionId = params['collection_id'];
      this.mapService.getMapData(params['category'], params['collection_id']).subscribe((data: any) => this.store.dispatch(retrievedMap({ data })));
    });
    this.iconService.getAll().subscribe((data: any) => this.store.dispatch(retrievedIcons({ data: data.result })));
    this.deviceService.getAll().subscribe((data: any) => this.store.dispatch(retrievedDevices({ data: data.result })));
    this.templateService.getAll().subscribe((data: any) => this.store.dispatch(retrievedTemplates({ data: data.result })));
    this.hardwareService.getAll().subscribe((data: any) => this.store.dispatch(retrievedHardwares({ data: data.result })));
    this.domainService.getDomainByCollectionId(this.collectionId).subscribe((data: any) => this.store.dispatch(retrievedDomains({ data: data.result })));
    this.configTemplateService.getAll().subscribe((data: any) => this.store.dispatch(retrievedConfigTemplates({ data: data.result })));
    this.loginProfileService.getAll().subscribe((data: any) => this.store.dispatch(retrievedLoginProfiles({ data: data.result })));
    this.portgroupService.getByCollectionId(this.collectionId).subscribe((data: any) => this.store.dispatch(retrievedPortGroups({ data: data.result })));
    this.mapImageService.getAll().subscribe((data: any) => this.store.dispatch(retrievedMapImages({ data: data.result })));
    this.projectService.get(+this.collectionId).subscribe((data: any) => {
      if (this.connectionId !== 0) {
        this.vmStatus = data.result.configuration.vm_status;
        this.store.dispatch(retrievedVMStatus({ vmStatus: data.result.configuration.vm_status }));
      }
    })
    this.store.dispatch(retrievedIsMapOpen({ data: true }));
  }

  ngAfterViewInit(): void {
    this.selectMapFeatureSubject.pipe(delay(1)).subscribe((map: MapState) => {
      if (map.mapProperties && map.defaultPreferences) {
        this.nodes = map.nodes;
        this.interfaces = map.interfaces;
        this.groupBoxes = map.groupBoxes;
        this.mapBackgrounds = map.mapBackgrounds;
        this.mapProperties = map.mapProperties;
        this.defaultPreferences = map.defaultPreferences;
        this._initCytoscape();
        this._initMouseEvents();
        this._initContextMenu();
        this._initUndoRedo();
      }
    });
  }

  ngOnDestroy(): void {
    this.selectMap$.unsubscribe();
    this.selectMapPref$.unsubscribe();
    this.selectMapEdit$.unsubscribe();
    this.selectPortGroups$.unsubscribe();
    this.selectIcons$.unsubscribe();
    this.selectDomains$.unsubscribe();
    this.selectSearchText$.unsubscribe();
    this.cy?.nodes().forEach((ele: any) => {
      this.helpersService.removeBadge(ele);
    });
    this.store.dispatch(retrievedIsMapOpen({ data: false }));
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
    this.store.dispatch(retrievedMapEdit({ data: undefined }))
    this.deviceId = '';
    this.templateId = '';
  }

  private _disableMapEditButtons() {
    this.isDisableAddNode = true;
    this.isDisableAddPG = true;
    this.isDisableAddImage = true;
    this.isDisableCancel = false;
  }

  private _enableMapEditButtons() {
    this.isDisableAddNode = !(!!this.templateId && !!this.deviceId);
    this.isDisableAddPG = false;
    this.isDisableAddImage = false;
    this.isDisableCancel = true;
  }

  private _dragFreeOnNode($event: any) {
    const node = $event.target;
    node._private['data'] = { ...node._private['data'] };
    const data = node.data();
    if (data && data.category != 'bg_image') {
      if (data.new) {
        data.new = true;
        data.updated = false;
        data.deleted = false;
      } else {
        data.new = false;
        data.updated = true;
        data.deleted = false;
      }

    }
    if (data.label && data.label == 'group_box') {
      const expandCollapse = this.cy.expandCollapse('get');
      let gbNodes;
      if (!data.collapsedChildren) {
        const d = '"' + data.id + '"';
        gbNodes = this.cy.nodes().filter(`[domain=${d}]`);
      } else {
        gbNodes = expandCollapse.getCollapsedChildrenRecursively($event.target);
      }

      if (gbNodes.length) {
        gbNodes.forEach((node: any) => {
          if (node.group() == 'nodes') {
            const data = node.data();
            if (!data.new) {
              data.updated = true;
            }
          }
        });
      }
    }
    this.store.dispatch(retrievedMapSelection({ data: true }));
  }

  private _zoom() { }

  private _tapNode($event: any) {
    const targetData = $event.target.data();
    if (this.isAddEdge) {
      if (
        targetData.temp
        || $event.target.group() != 'nodes'
        || targetData.label == 'group_box'
        || (this.edgeNode && targetData.elem_category != 'port_group')
        || (this.edgePortGroup && targetData.elem_category == 'port_group')
      ) {
        return this._unqueueEdge();
      }
      let src: any;
      let targ: any;
      if (this.edgePortGroup) {
        src = "'" + this.edgePortGroup.data().id + "'";
        targ = "'" + targetData.id + "'";
      } else {
        src = "'" + this.edgeNode.data().id + "'";
        targ = "'" + targetData.id + "'";
      }
      const el = this.cy.edges().filter(`[source=${src}][target=${targ}]`).length
      if (el > 0) {
        return this.toastr.warning("The edge already exists.");
      }
      this._addNewEdge($event);
    } else if (this.isAddTunnel) {
      if (
        targetData.temp
        || $event.target.group() != 'nodes'
        || targetData.label == 'group_box'
        || targetData.elem_category == 'port_group'
      ) {
        return this._unqueueEdge();
      }
      this._addNewEdge($event);
    }
  }

  private _selectNode($event: any) {
    const t = $event.target;
    const d = t.data();
    if (this.isBoxSelecting || this.isSearching) { return; }

    if (this.isAddNode || this.isAddPublicPG || this.isAddPrivatePG) {
      this.isAddNode = false;
      this.isAddPublicPG = false;
      this.isAddPrivatePG = false;
      t.unselect();
      return;
    }
    if (d.label == 'map_background') {
      this.activeMBs.push(t);
    } else if (d.label == 'group_box') {
      this.isBoxSelecting = true;
      this.activeGBs.push(t);
      t.children().forEach((ele: any) => {
        ele.select();
        this.boxSelectedNodes.add(ele);
      })
      this._boxSelect();
      this.isBoxSelecting = false;
      this.isSelectedProcessed = false;
      this.boxSelectedNodes.clear();
    } else {
      if (d.elem_category == 'node' && !this.activeNodes.includes(t)) {
        this.activeNodes.push(t);
      } else if (d.elem_category == 'port_group' && !this.activePGs.includes(t)) {
        this.activePGs.push(t);
      }
      if (!d.new) {
        if (this.activeNodes.length == 0) {
          this.activeNodes.splice(0);
        }
        if (this.activePGs.length == 0) {
          this.activePGs.splice(0);
        }
      }
    }
    this.contextMenuService.showContextMenu(this.cy, this.activeNodes, this.activePGs, this.activeEdges, this.activeGBs, this.activeMBs, this.connectionId);
    this.store.dispatch(retrievedMapSelection({ data: true }));
  }

  private _selectEdge($event: any) {
    const t = $event.target;
    const d = t.data()
    if (this.isBoxSelecting || this.isSearching) { return; }
    if (t.isEdge() && !this.activeEdges.includes(t)) {
      this.activeEdges.push(t);
    }
    if (!d.new) {
      if (this.activeEdges.length == 0) {
        this.activeEdges.splice(0);
      }
    }
    this.contextMenuService.showContextMenu(this.cy, this.activeNodes, this.activePGs, this.activeEdges, this.activeGBs, this.activeMBs, this.connectionId);
    this.store.dispatch(retrievedMapSelection({ data: true }));
  }

  private _unselectNode($event: any) {
    const t = $event.target;
    if (t.data('label') == 'map_background') {
      if (this.activeMBs.includes(t)) {
        const index = this.activeMBs.indexOf(t);
        this.activeMBs.splice(index, 1);
      }
    } else if (t.data('label') == 'group_box') {
      if (this.activeGBs.includes(t)) {
        const index = this.activeGBs.indexOf(t);
        this.activeGBs.splice(index, 1);
      }
      this.activeNodes.splice(0);
      this.activePGs.splice(0);
      this.activeEdges.splice(0);
    } else if (t.data('elem_category') == 'port_group') {
      if (this.activePGs.includes(t)) {
        const index = this.activePGs.indexOf(t);
        this.activePGs.splice(index, 1);
      }
    } else {
      if (this.activeNodes.includes(t)) {
        const index = this.activeNodes.indexOf(t);
        this.activeNodes.splice(index, 1);
      }
    }
    this.store.dispatch(retrievedMapSelection({ data: true }));
  }

  private _unselectEdge($event: any) {
    const t = $event.target;
    if (this.activeEdges.includes(t)) {
      const index = this.activeEdges.indexOf(t);
      this.activeEdges.splice(index, 1);
    }
    this.store.dispatch(retrievedMapSelection({ data: true }));
  }

  private _boxStart(_$event: any) {
    this.isBoxSelecting = true;
    this.isSelectedProcessed = false;
    this.boxSelectedNodes.clear();
  }

  private _boxSelect() {
    if (this.isSelectedProcessed || this.boxSelectedNodes.size == 0) return;
    this._processNodeList(this.boxSelectedNodes);
  }

  private _boxCheck($event: any) {
    const t = $event.target;
    this.boxSelectedNodes.add(t);
  }

  private _processNodeList(elms: any) {
    const activeEles = this.activeNodes.concat(this.activePGs, this.activeEdges);
    if (activeEles.length == 0) {
      this.activeNodes.splice(0);
      this.activePGs.splice(0);
      this.activeEdges.splice(0);
    }
    for (let elm of elms) {
      const d = elm.data();
      if (d.elem_category == 'node' && !this.activeNodes.includes(elm)) {
        this.activeNodes.push(elm);
      } else if (d.elem_category == 'port_group' && !this.activePGs.includes(elm)) {
        this.activePGs.push(elm);
      } else if (elm.isEdge() && !this.activeEdges.includes(elm)) {
        this.activeEdges.push(elm);
      }
    }
    this.isSelectedProcessed = true;
    this.isBoxSelecting = false;
  }

  private _click($event: any) {
    const newNodePosition = { x: Number($event.position.x.toFixed(2)), y: Number($event.position.y.toFixed(2)) }
    if (this.isAddNode && this.deviceId && this.templateId) {
      this.nodeService.genData(this.collectionId, this.deviceId, this.templateId)
        .subscribe(genData => {
          const icon = this.helpersService.getOptionById(this.icons, genData.icon_id);
          const icon_src = ICON_PATH + icon.photo;
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
          if (this.isCustomizeNode) {
            this._openAddUpdateNodeDialog(genData, newNodeData, newNodePosition);
          } else {
            this._addNewNode(genData, newNodeData, newNodePosition);
          }
        });
    } else if (this.isAddPublicPG || this.isAddPrivatePG) {
      const category = this.isAddPrivatePG ? 'private' : 'public';
      this.portgroupService.genData(this.collectionId, category)
        .subscribe(genData => {
          const newNodeData = {
            "elem_category": "port_group",
            "zIndex": 999,
            "background-opacity": 1,
            "shape": "ellipse",
            "text-opacity": 0,
          }
          if (this.isCustomizePG) {
            this._openAddUpdatePGDialog(genData, newNodeData, newNodePosition);
          } else {
            this._addNewPortGroup(genData, newNodeData, newNodePosition);
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

  private _keyDown($event: any) {
    if ($event.which === 46) {
      const selecteds = this.cy.$(":selected");
      if (selecteds.length > 0) {
        // this._tool_panel.$edge_delete.click();
        // this._tool_panel.$node_delete.click();
      }
    } else if ($event.ctrlKey && $event.target.nodeName === "BODY") {
      if ($event.which === 90) this.ur.undo();
      else if ($event.which === 89) this.ur.redo();
    }
  }

  private _initCytoscape(): void {
    this.config = {
      default_preferences: {
        ...this.defaultPreferences,
        default_icon_path: "/assets/icons/default_icon.png",
        default_img_path: ICON_PATH,
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
      cleared: this.defaultPreferences?.cleared,
      grid_settings: this.defaultPreferences?.grid_settings ? this.defaultPreferences.grid_settings : null,
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
    this.styleExists = this.config.styleExists;
    this.cleared = this.config.cleared;
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
      style: this.helpersService.generateCyStyle(this.config.default_preferences),
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
    // this.cy.nodeEditing({
    //   resizeToContentCueImage: "/static/img/resizeCue.svg",
    //   isNoControlsMode: (node: any) => {
    //     const z = this.cy.zoom();
    //     const cyW = this.cy.container().clientWidth;
    //     const cyH = this.cy.container().clientHeight;
    //     const nW = node.renderedWidth();
    //     const nH = node.renderedHeight();
    //     return ((nW * nH * z) / (cyW * cyH) < .0005) ? true : false;
    //   }
    // });

  }

  private _initUndoRedo() {
    this.cy.panzoom({});
    this.cy.expandCollapse({
      layoutBy: null,
      fisheye: false,
      undoable: false,
      animate: false
    });
    this.cy.nodes().on('expandcollapse.beforecollapse', ($event: any) => {
      let a = this.cy.nodeEditing('get');
      if (a) {
        a.removeGrapples()
      }
      a = null;
    });
    this.cy.compoundDragAndDrop(this.config.cdnd_enable_options);
    this.cy.elements().forEach((ele: any) => {
      const data = ele.data();
      if (ele.group() == "nodes") {
        if (data.locked) {
          ele.lock();
          this.helpersService.addBadge(this.cy, ele);
        }
      }
    });
    this.ur = this.cy.undoRedo({
      isDebug: this.config['debug_output'],
      stackSizeLimit: 20,
    });
    this.commonService.ur = this.ur;
    this.infoPanelService.ur = this.ur;
    this.infoPanelService.cy = this.cy;
    this.helpersService.deletedInterfaces = this.deletedInterfaces;
    this.helpersService.deletedNodes = this.deletedNodes;
    this.ur.action("removeNode", this.helpersService.removeNode.bind(this), this.helpersService.restoreNode.bind(this));
    this.ur.action("removeEdge", this.helpersService.removeEdge.bind(this), this.helpersService.restoreEdge.bind(this));
    this.ur.action("changeNodeSize", this.toolPanelStyleService.changeNodeSize.bind(this.commonService), this.toolPanelStyleService.restoreNodeSize.bind(this.commonService));
    this.ur.action("changTextColor", this.toolPanelStyleService.changTextColor.bind(this.commonService).bind(this.commonService), this.toolPanelStyleService.restoreTextColor.bind(this.commonService).bind(this.commonService));
    this.ur.action("changeTextSize", this.toolPanelStyleService.changeTextSize.bind(this.commonService).bind(this.commonService), this.toolPanelStyleService.restoreTextSize.bind(this.commonService).bind(this.commonService));
    this.ur.action("changePGColor", this.toolPanelStyleService.changePGColor.bind(this.commonService).bind(this.commonService), this.toolPanelStyleService.restorePGColor.bind(this.commonService).bind(this.commonService));
    this.ur.action("changePGSize", this.toolPanelStyleService.changePGSize.bind(this.commonService).bind(this.commonService), this.toolPanelStyleService.restorePGSize.bind(this.commonService).bind(this.commonService));
    this.ur.action("changeEdgeColor", this.toolPanelStyleService.changeEdgeColor.bind(this.commonService).bind(this.commonService), this.toolPanelStyleService.restoreEdgeColor.bind(this.commonService).bind(this.commonService));
    this.ur.action("changeEdgeSize", this.toolPanelStyleService.changeEdgeSize.bind(this.commonService).bind(this.commonService), this.toolPanelStyleService.restoreEdgeSize.bind(this.commonService).bind(this.commonService));
    this.ur.action("changeArrowScale", this.toolPanelStyleService.changeArrowScale.bind(this.commonService).bind(this.commonService), this.toolPanelStyleService.restoreArrowScale.bind(this.commonService).bind(this.commonService));
    this.ur.action("changeDirection", this.toolPanelStyleService.changeDirection.bind(this.commonService).bind(this.commonService), this.toolPanelStyleService.restoreDirection.bind(this.commonService).bind(this.commonService));
    this.ur.action("changeTextBGColor", this.toolPanelStyleService.changeTextBGColor.bind(this.commonService).bind(this.commonService), this.toolPanelStyleService.restoreTextBGColor.bind(this.commonService).bind(this.commonService));
    this.ur.action("changeTextBGOpacity", this.toolPanelStyleService.changeTextBGOpacity.bind(this.commonService).bind(this.commonService), this.toolPanelStyleService.restoreTextBGOpacity.bind(this.commonService).bind(this.commonService));
    this.ur.action("changeTextVAlign", this.toolPanelStyleService.changeTextVAlign.bind(this.commonService), this.toolPanelStyleService.restoreTextVAlign.bind(this.commonService));
    this.ur.action("changeTextHAlign", this.toolPanelStyleService.changeTextHAlign.bind(this.commonService), this.toolPanelStyleService.restoreTextHAlign.bind(this.commonService));
    this.ur.action("changeGBOpacity", this.toolPanelStyleService.changeGBOpacity.bind(this.commonService).bind(this.commonService), this.toolPanelStyleService.restoreGBOpacity.bind(this.commonService).bind(this.commonService));
    this.ur.action("changeGBColor", this.toolPanelStyleService.changeGBColor.bind(this.commonService).bind(this.commonService), this.toolPanelStyleService.restoreGBColor.bind(this.commonService).bind(this.commonService));
    this.ur.action("changeGBBorderColor", this.toolPanelStyleService.changeGBBorderColor.bind(this.commonService).bind(this.commonService), this.toolPanelStyleService.restoreGBBorderColor.bind(this.commonService).bind(this.commonService));
    this.ur.action("changeGBType", this.toolPanelStyleService.changeGBType.bind(this.commonService).bind(this.commonService), this.toolPanelStyleService.restoreGBType.bind(this.commonService).bind(this.commonService));
  }

  private _initMouseEvents() {
    this.cy.removeAllListeners();
    this.cy.on("dragfreeon", "node", this._dragFreeOnNode.bind(this));
    this.cy.on("zoom", this._zoom.bind(this));
    this.cy.on("tap", "node", this._tapNode.bind(this));
    this.cy.on("select", "node", this._selectNode.bind(this));
    this.cy.on("select", "edge", this._selectEdge.bind(this));
    this.cy.on("unselect", "node", this._unselectNode.bind(this));
    this.cy.on("unselect", "edge", this._unselectEdge.bind(this));
    this.cy.on("boxstart", this._boxStart.bind(this));
    this.cy.on("boxselect", this._boxSelect.bind(this));
    this.cy.on("box", this._boxCheck.bind(this));
    this.cy.on("click", this._click.bind(this));
    this.cy.on("cxttap", "node", () => this.contextMenuService.showContextMenu(this.cy, this.activeNodes, this.activePGs, this.activeEdges, this.activeGBs, this.activeMBs, this.connectionId));
    this.cy.on("cxttap", "edge", () => this.contextMenuService.showContextMenu(this.cy, this.activeNodes, this.activePGs, this.activeEdges, this.activeGBs, this.activeMBs, this.connectionId));
    this.cy.on("nodeediting.resizeend", this._nodeEditing.bind(this));
    this.cy.on('cdnddrop', this._cdndDrop.bind(this));
    this.cy.on("noderesize.resizeend", (_e: any, _type: any) => {
      document.body.style.cursor = "initial";
    });
    document.addEventListener("keydown", this._keyDown.bind(this));
  }

  private _initContextMenu() {
    this.cy.contextMenus({
      menuItems: [
        this.cmGroupBoxService.getMoveToFrontMenu(),
        this.cmGroupBoxService.getMoveToBackMenu(),
        this.cmAddService.getNodeAddMenu(this.queueEdge.bind(this)),
        this.cmAddService.getPortGroupAddMenu(this.queueEdge.bind(this)),
        this.cmAddService.getEdgeAddMenu(),
        this.cmActionsService.getNodeActionsMenu(this.cy, this.activeNodes),
        this.cmActionsService.getPortGroupActionsMenu(this.cy, this.collectionId, this.activePGs),
        this.cmActionsService.getEdgeActionsMenu(this.cy, this.activeEdges),
        this.cmRemoteService.getNodeRemoteMenu(this.activeNodes),
        this.cmRemoteService.getPortGroupRemoteMenu(this.activePGs),
        this.cmViewDetailsService.getMenu(this.activeNodes, this.activePGs, this.activeEdges),
        this.cmEditService.getMenu(this.cy, this.activeNodes, this.activePGs, this.activeEdges),
        this.cmDeleteService.getMenu(this.cy, this.activeNodes, this.activePGs, this.activeEdges, this.activeGBs),
        this.cmLockUnlockService.getLockMenu(this.cy, this.activeNodes, this.activePGs, this.activeMBs),
        this.cmLockUnlockService.getUnlockMenu(this.activeNodes, this.activePGs, this.activeMBs),
        this.cmGroupBoxService.getCollapseMenu(this.cy, this.activeGBs),
        this.cmGroupBoxService.getExpandMenu(this.cy, this.activeGBs),
        this.cmMapService.getSaveChangesMenu(),
        this.cmMapService.getUndoMenu(),
        this.cmMapService.getRedoMenu(),
        this.cmMapService.getDownloadMenu(),
        this.cmMapService.getLockAllMenu(this.cy),
        this.cmMapService.getUnlockAllMenu(this.cy),
        this.cmMapService.getSelectAllMenu(this.cy),
      ],
      submenuIndicator: { src: '/assets/icons/submenu-indicator-default.svg', width: 12, height: 12 }
    });
  }

  private _openAddUpdateNodeDialog(genData: any, newNodeData: any, newNodePosition: any) {
    const dialogData = {
      mode: 'add',
      collectionId: this.collectionId,
      selectedMapPref: this.selectedMapPref,
      cy: this.cy,
      genData,
      newNodeData,
      newNodePosition,
    }
    const dialogRef = this.dialog.open(AddUpdateNodeDialogComponent, { width: '600px', data: dialogData });
    dialogRef.afterClosed().subscribe((_data: any) => {
      this.isAddNode = false;
      this._enableMapEditButtons();
    });
  }

  private _addNewNode(genData: any, newNodeData: any, newNodePosition: any) {
    const jsonData = {
      name: genData.name,
      notes: genData.notes,
      icon_id: genData.icon_id,
      category: genData.category,
      device_id: genData.device_id,
      template_id: genData.template_id,
      hardware_id: genData.hardware_id,
      folder: genData.folder,
      role: genData.role,
      domain_id: genData.domain_id,
      hostname: genData.hostname,
      collection_id: this.collectionId,
      logical_map_position: newNodePosition
    };
    this.nodeService.add(jsonData).pipe(
      catchError((resp: any) => {
        if (resp.status == 422) {
          const errorMsg: any[] = resp.error.message;
          const m = Object.keys(errorMsg).map((key: any) => key + ': ' + errorMsg[key])
          this.toastr.error(m.join(','));
        }
        this.isAddNode = false;
        this._enableMapEditButtons();
        return throwError(() => resp.message);
      })
    ).subscribe((respData: any) => {
      this.nodeService.get(respData.id).subscribe(respData => {
        const cyData = respData.result;
        cyData.id = 'node-' + respData.id;
        cyData.node_id = respData.id;
        cyData.domain = respData.result.domain.name;
        cyData.height = cyData.logical_map_style.height;
        cyData.width = cyData.logical_map_style.width;
        cyData.text_color = cyData.logical_map_style.text_color;
        cyData.text_size = cyData.logical_map_style.text_size;
        cyData.groups = respData.result.groups;
        cyData.icon = ICON_PATH + respData.result.icon.photo;
        this.helpersService.addCYNode(this.cy, { newNodeData: { ...newNodeData, ...cyData }, newNodePosition });
        this.helpersService.reloadGroupBoxes(this.cy);
        this.isAddNode = false;
        this._enableMapEditButtons();
        this.toastr.success('Quick add node successfully!');
      });
    });
  }

  private _openAddUpdatePGDialog(genData: any, newNodeData: any, newNodePosition: any) {
    const dialogData = {
      mode: 'add',
      collectionId: this.collectionId,
      selectedMapPref: this.selectedMapPref,
      cy: this.cy,
      genData,
      newNodeData,
      newNodePosition,
    }
    const dialogRef = this.dialog.open(AddUpdatePGDialogComponent, { width: '600px', data: dialogData });
    dialogRef.afterClosed().subscribe((_data: any) => {
      if (this.isAddPublicPG) this.isAddPublicPG = false;
      if (this.isAddPrivatePG) this.isAddPrivatePG = false;
      this._enableMapEditButtons();
      this.portgroupService.getByCollectionId(this.collectionId).subscribe((data: any) => this.store.dispatch(retrievedPortGroups({ data: data.result })));
    });
  }

  private _addNewPortGroup(genData: any, newNodeData: any, newNodePosition: any) {
    const jsonData = {
      name: genData.name,
      vlan: genData.vlan,
      category: genData.category,
      domain_id: genData.domain_id,
      subnet_allocation: genData.subnet_allocation,
      subnet: genData.subnet,
      collection_id: this.collectionId,
      logical_map_position: newNodePosition
    };
    this.portgroupService.add(jsonData).subscribe((respData: any) => {
      this.portgroupService.get(respData.id).subscribe(respData => {
        const cyData = respData.result;
        cyData.id = 'pg-' + respData.id;
        cyData.pg_id = respData.id;
        cyData.domain = respData.result.domain.name;
        cyData.height = cyData.logical_map_style.height;
        cyData.width = cyData.logical_map_style.width;
        cyData.text_color = cyData.logical_map_style.text_color;
        cyData.text_size = cyData.logical_map_style.text_size;
        cyData.color = cyData.logical_map_style.color;
        cyData.groups = respData.result.groups;
        this.helpersService.addCYNode(this.cy, { newNodeData: { ...newNodeData, ...cyData }, newNodePosition });
        this.helpersService.reloadGroupBoxes(this.cy);
        if (this.isAddPublicPG) this.isAddPublicPG = false;
        if (this.isAddPrivatePG) this.isAddPrivatePG = false;
        this._enableMapEditButtons();
        this.toastr.success('Quick add port group successfully!');
      });
    });
  }

  private _openAddUpdateInterfaceDialog(genData: any, newEdgeData: any) {
    const dialogData = {
      mode: 'add',
      collectionId: this.collectionId,
      portGroups: this.portGroups,
      gateways: this.gateways,
      selectedMapPref: this.selectedMapPref,
      cy: this.cy,
      genData,
      newEdgeData,
    }
    const dialogRef = this.dialog.open(AddUpdateInterfaceDialogComponent, { width: '600px', data: dialogData });
    dialogRef.afterClosed().subscribe((_data: any) => {
      this.inv.remove();
      this.e.remove();
      this.inv = null;
      this.edgePortGroup = null;
      this.edgeNode = null;
      this.isAddEdge = false;
      this._enableMapEditButtons();
    });
  }

  private _addNewEdge($event: any) {
    if (this.isAddEdge) {
      this.cy.unbind('mousemove');
      let targ: any;
      if (this.edgePortGroup) {
        this.edgeNode = $event.target;
        targ = this.edgeNode.data().id;
      } else {
        this.edgePortGroup = $event.target;
        targ = this.edgePortGroup.data().id;
      }
      this.e.move({ target: targ });
      this.newEdgeData.target = targ;
      this.interfaceService.genData(this.edgeNode.data().node_id, this.edgePortGroup.data().pg_id)
        .subscribe(genData => {
          this._openAddUpdateInterfaceDialog(genData, this.newEdgeData);
        });
    } else if (this.isAddTunnel) {
      this.cy.unbind('mousemove');
      this.isDisableCancel = false;
      this.e.move({ target: $event.target.data().id });
      this.inv.remove();
      this.inv = null;
      this.edgeNode = null;
      this.isDisableCancel = true;
      this.isAddTunnel = false;
    }
  }

  queueEdge(target: any, position: any, category: string) {
    const data = target.data();
    if (data.elem_category === 'port_group') {
      this.edgePortGroup = target;
    } else {
      this.edgeNode = target;
    }
    const invisNode = {
      group: "nodes",
      data: {
        id: "tempNode" + this.helpersService.createUUID(),
        temp: true,
        name: "",
        height: "1px",
        width: "1px",
        zIndex: 10,
      },
      selectable: false,
      position,
    }
    this.inv = this.cy.add(invisNode)[0];
    this.inv.style({ 'zIndex': 10 });
    this.newEdgeData = {
      source: data.id,
      target: invisNode.data.id,
      id: 'new_edge_' + this.helpersService.createUUID(),
      name: "",
      category,
      direction: "both",
      curve_style: category == 'tunnel' ? 'bezier' : 'straight',
      color: this.selectedMapPref.edge_color,
      width: this.selectedMapPref.edge_width + "px",
    }
    this.e = this.helpersService.addCYEdge(this.cy, this.newEdgeData)[0];
    if (category == "tunnel") {
      this.isAddTunnel = true
    } else {
      this.isAddEdge = true;
    }
    this.cy.bind('mousemove', (event: any) => {
      this.inv.position(event.position);
    });
  }

  private _unqueueEdge() {
    this.cy.unbind('mousemove');
    this.e.remove()
    this.inv.remove()
    this.edgeNode = null;
    this.edgePortGroup = null;
    this.isAddEdge = false;
    this.isAddTunnel = false
  }



  searchMap(searchText: string) {
    searchText = searchText.trim();
    if (searchText) {
      const jsonData = {
        operator: 'contains',
        value: searchText
      }
      this.searchService.search(jsonData, this.collectionId).subscribe(respData => {
        const nodes = respData.nodes
        const pgs = respData.port_groups
        const interfaces = respData.interfaces
        if (nodes.length >= 0) {
          this.cy.nodes().filter('[node_id]').forEach((ele: any) => {
            if (!(nodes.includes(ele.data('node_id')))) {
              ele.style('opacity', 0.1);
              ele.unselect();
            } else {
              ele.style('opacity', 1.0);
              ele.select();
            }
          })
        }
        if (interfaces.length >= 0) {
          this.cy.edges().filter('[interface_id]').forEach((ele: any) => {
            if (!(interfaces.includes(ele.data('interface_id')))) {
              ele.style('opacity', 0.1);
              ele.unselect();
            } else {
              ele.style('opacity', 1.0);
              ele.select();
            }
          })
        }
        if (pgs.length >= 0) {
          this.cy.nodes().filter('[pg_id]').forEach((ele: any) => {
            if (!(pgs.includes(ele.data('pg_id')))) {
              ele.style('opacity', 0.1);
              ele.unselect();
            } else {
              ele.style('opacity', 1.0);
              ele.select();
            }
          })
        }
      });
    } else {
      this.clearSearch();
    }
  }

  clearSearch() {
    if (this.cy) {
      this.cy.nodes().forEach((ele: any) => {
        if (ele.data('label') != 'group_box') {
          ele.style('opacity', 1.0);
          ele.unselect();
        }
      })
      this.cy.edges().forEach((ele: any) => {
        ele.style('opacity', 1.0);
        ele.unselect();
      })
    }
  }

  openDashboard() {
    this.router.navigate([RouteSegments.DASHBOARD]);
  }
}