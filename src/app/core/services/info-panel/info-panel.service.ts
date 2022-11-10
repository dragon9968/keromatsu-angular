import { Store } from "@ngrx/store";
import { MatDialog } from "@angular/material/dialog";
import { ToastrService } from "ngx-toastr";
import { Injectable, Input } from '@angular/core';
import { Subscription, throwError } from "rxjs";
import { MapService } from "../map/map.service";
import { NodeService } from "../node/node.service";
import { DomainService } from "../domain/domain.service";
import { HelpersService } from "../helpers/helpers.service";
import { UserTaskService } from "../user-task/user-task.service";
import { PortGroupService } from "../portgroup/portgroup.service";
import { InterfaceService } from "../interface/interface.service";
import { DomainUserService } from "../domain-user/domain-user.service";
import { AddUpdatePGDialogComponent } from "../../../map/add-update-pg-dialog/add-update-pg-dialog.component";
import { NodeBulkEditDialogComponent } from "../../../map/bulk-edit-dialog/node-bulk-edit-dialog/node-bulk-edit-dialog.component";
import { AddUpdateNodeDialogComponent } from "../../../map/add-update-node-dialog/add-update-node-dialog.component";
import { InterfaceBulkEditDialogComponent } from "../../../map/bulk-edit-dialog/interface-bulk-edit-dialog/interface-bulk-edit-dialog.component";
import { PortGroupBulkEditDialogComponent } from "../../../map/bulk-edit-dialog/port-group-bulk-edit-dialog/port-group-bulk-edit-dialog.component";
import { AddUpdateInterfaceDialogComponent } from "../../../map/add-update-interface-dialog/add-update-interface-dialog.component";
import { retrievedDomains } from "../../../store/domain/domain.actions";
import { retrievedUserTasks } from "../../../store/user-task/user-task.actions";
import { selectVMStatus } from "../../../store/project/project.selectors";
import { selectIsConnect } from "../../../store/server-connect/server-connect.selectors";
import { selectMapOption } from "../../../store/map-option/map-option.selectors";
import { selectPortGroups } from "../../../store/portgroup/portgroup.selectors";
import { selectDomainUsers } from "../../../store/domain-user/domain-user.selectors";
import { selectNodesByCollectionId } from "../../../store/node/node.selectors";


@Injectable({
  providedIn: 'root'
})
export class InfoPanelService {
  @Input() ur: any;
  @Input() cy: any;
  selectNode$ = new Subscription();
  selectMapOption$ = new Subscription();
  selectPortGroup$ = new Subscription();
  selectDomainUser$ = new Subscription();
  selectVMStatus$ = new Subscription();
  selectIsConnect$ = new Subscription();
  nodes!: any[];
  portGroups!: any[];
  domainUsers!: any[];
  vmStatus!: boolean;
  isGroupBoxesChecked!: boolean;
  isConnect!: boolean;
  statusColorLookup = {
    off: '#FF0000', //red
    on: '#008000', // green
    unknown: '#FFFF00' // yellow
  }

  constructor(
    private store: Store,
    private dialog: MatDialog,
    private toastr: ToastrService,
    private mapService: MapService,
    private helpers: HelpersService,
    private nodeService: NodeService,
    private interfaceService: InterfaceService,
    private portGroupService: PortGroupService,
    private domainService: DomainService,
    private userTaskService: UserTaskService,
    private domainUserService: DomainUserService
  ) {
    this.selectMapOption$ = this.store.select(selectMapOption).subscribe((mapOption: any) => {
      if (mapOption) {
        this.isGroupBoxesChecked = mapOption.isGroupBoxesChecked;
      }
    });
    this.selectNode$ = this.store.select(selectNodesByCollectionId).subscribe(nodes => this.nodes = nodes);
    this.selectPortGroup$ = this.store.select(selectPortGroups).subscribe(portGroups => this.portGroups = portGroups);
    this.selectDomainUser$ = this.store.select(selectDomainUsers).subscribe(domainUsers => this.domainUsers = domainUsers);
    this.selectVMStatus$ = this.store.select(selectVMStatus).subscribe(vmStatus => this.vmStatus = vmStatus);
    this.selectIsConnect$ = this.store.select(selectIsConnect).subscribe(isConnect => this.isConnect = isConnect);
  }

  delete(cy: any, activeNodes: any[], activePGs: any[], activeEdges: any[], activeGBs: any[],
         deletedNodes: any[], deletedInterfaces: any[], tabName: string, id: any) {
    let idName = '';
    if (tabName == 'node') {
      idName = 'node_id';
    } else if (tabName == 'portGroup') {
      idName = 'pg_id';
    } else if (tabName == 'edge') {
      idName = 'interface_id';
    }
    activeEdges.filter(ele => ele.data(idName) === id).forEach((edge: any) => {
      const sourceData = cy.getElementById(edge.data('source')).data();
      const targetData = cy.getElementById(edge.data('target')).data();
      if ('temp' in sourceData || 'temp' in targetData) {
        return
      } else {
        this.ur?.do('removeEdge', edge);
        const index = activeEdges.findIndex(ele => ele.data(idName) === id);
        activeEdges.splice(index, 1);
        // TODO: this.tool_panel.update_components();
      }
    });

    activeNodes.concat(activePGs, activeGBs)
      .filter(ele => ele.data(idName) === id)
      .forEach((node: any) => {
        // Remove the interface is connecting to the Port Group or Node
        const interfacesDeleted = this.getEdgesConnectingToNode(node);
        for (let i = 0; i < activeEdges.length; i++) {
          const data = activeEdges[i].data();
          if (interfacesDeleted.includes(data.interface_id)) {
            activeEdges.splice(i, 1);
            i--;
          }
        }
        this.ur?.do("removeNode", node)
        if (this.isGroupBoxesChecked) {
          cy.nodes().filter('[label="group_box"]').forEach((gb: any) => {
            if (gb.children().length == 0) {
              this.ur?.do("removeNode", gb)
            }
          });
        }
        if (idName === 'node_id') {
          const indexNode = activeNodes.findIndex(ele => ele.data(idName) === id);
          activeNodes.splice(indexNode, 1);
        } else if (idName === 'pg_id') {
          const indexNode = activePGs.findIndex(ele => ele.data(idName) === id);
          activePGs.splice(indexNode, 1);
        }
        activeGBs.splice(0);
        // TODO: this.tool_panel.update_components();
      });
  }

  openEditInfoPanelForm(cy: any, tabName: string, id: any, ids: any[]) {
    if (tabName == 'edge') {
      if (ids.length > 0 && id == undefined) {
        const dialogData = {
          genData: { ids: ids },
          cy
        };
        this.dialog.open(InterfaceBulkEditDialogComponent, { width: '600px', data: dialogData});
      } else if (ids.length === 0 && id) {
        this.interfaceService.get(id).subscribe(interfaceData => {
          const dialogData = {
            mode: 'update',
            genData: interfaceData.result,
            cy
          }
          this.dialog.open(AddUpdateInterfaceDialogComponent, {width: '600px', data: dialogData});
        });
      }
    } else if (tabName == 'portGroup') {
      if (ids.length > 0 && id == undefined) {
        const dialogData = {
          genData: { ids: ids },
          cy
        }
        this.dialog.open(PortGroupBulkEditDialogComponent, {width: '600px', data: dialogData});
      } else if (ids.length === 0 && id) {
        this.portGroupService.get(id).subscribe(pgData => {
          const dialogData = {
            mode: 'update',
            genData: pgData.result,
            cy
          }
          this.dialog.open(AddUpdatePGDialogComponent, {width: '600px', data: dialogData});
        });
      }
    } else if (tabName == 'node') {
      if (ids.length > 0 && id == undefined) {
        const dialogData = {
          genData: { ids: ids },
          cy
        }
        this.dialog.open(NodeBulkEditDialogComponent, {width: '600px', data: dialogData});
      } else if (ids.length === 0 && id) {
        this.nodeService.get(id).subscribe(nodeData => {
          const dialogData = {
            mode: 'update',
            genData: nodeData.result,
            cy
          }
          this.dialog.open(AddUpdateNodeDialogComponent, {width: '600px', data: dialogData});
        });
      }
    } else {
      this.toastr.success("The info panel doesn't open yet");
    }
  }

  getEdgesConnectingToNode(node: any) {
    const interfacesDeleted: any[] = [];
    node.connectedEdges().forEach((ele: any) => {
      const data = ele.data();
      if (data && !data.new) {
        data.deleted = true;
        interfacesDeleted.push({
          'name': data.id,
          'interface_id': data.interface_id
        });
      }
    });
    return interfacesDeleted.map(ele => ele.interface_id);
  }

  deleteDomain(domain: any, collectionId: any) {
    const isDomainInNode = this.nodes.some(ele => ele.domain_id === domain.id);
    const isDomainInPG = this.portGroups.some(ele => ele.domain_id === domain.id);
    const domainName = domain.name;
    if (isDomainInNode && isDomainInPG) {
      this.toastr.error(`Port groups and nodes are still associated with domain ${domainName}`);
    } else if (isDomainInNode) {
      this.toastr.error(`Nodes are still associated with this domain ${domainName}`);
    } else if (isDomainInPG) {
      this.toastr.error(`Port groups are still associated with domain ${domainName}`)
    } else {
      this.domainUsers
        .filter(ele => ele.domain_id === domain.id)
        .map(ele => {
          return this.domainUserService.delete(ele.id).subscribe(response => {
            this.toastr.success(`Deleted domain user ${ele.username}`);
          })
        });
      this.domainService.delete(domain.id).subscribe(response => {
        this.toastr.success(`Deleted domain ${domainName}`);
        this.domainService.getDomainByCollectionId(collectionId).subscribe(
          (data: any) => this.store.dispatch(retrievedDomains({data: data.result}))
        );
      })
    }
  }

  deleteUserTask(userTaskId: number) {
    this.userTaskService.delete(userTaskId).subscribe({
      next: () => {
        this.userTaskService.getAll().subscribe(data => {
          this.store.dispatch(retrievedUserTasks({data: data.result}));
        })
        this.toastr.success('Deleted Row', 'Success');
      },
      error: error => {
        this.toastr.error(error.error.message, 'Error');
        throwError(error.message);
      }
    })
  }

  rerunTask(userTaskIds: any[]) {
    this.userTaskService.rerunTask({pks: userTaskIds}).subscribe( {
      next: value => {
          this.userTaskService.getAll().subscribe(data => {
            this.store.dispatch(retrievedUserTasks({data: data.result}));
          })
          value.result.map((message: string) => {
            this.toastr.success(`Rerun task - ${message} `, 'Success');
          })
      },
      error: err => {
        this.toastr.error(err.error.message, 'Error');
        throwError(err.message);
      }
    })
  }

  revokeTask(userTaskIds: any[]) {
    this.userTaskService.revokeTask({pks: userTaskIds}).subscribe({
      next: value => {
        this.userTaskService.getAll().subscribe(data => {
          this.store.dispatch(retrievedUserTasks({data: data.result}));
        })
        value.result.map((message: string) => {
          this.toastr.success(`Revoke task - ${message} `, 'Success');
        })
      },
      error: err => {
        this.toastr.error('Revoke task failed', 'Error');
        throwError(err.message);
      }
    })
  }

  postTask(userTaskIds: any[]) {
    this.userTaskService.postTask({pks: userTaskIds}).subscribe({
      next: value => {
        this.userTaskService.getAll().subscribe(data => {
          this.store.dispatch(retrievedUserTasks({data: data.result}));
        })
        value.result.map((message: string) => {
          this.toastr.success(`Post task - ${message} `, 'Success');
        })
      },
      error: err => {
        this.toastr.error('Post task failed', 'Error');
        throwError(err.message);
      }
    })
  }

  refreshTask() {
    this.userTaskService.refreshTask().subscribe({
      next: response => {
        this.toastr.success(response.message, 'Success');
        this.updateTaskList();
      },
      error: err => {
        this.toastr.error(err.error.message, 'Error');
      }
    })
  }

  updateTaskList() {
    this.userTaskService.getAll().subscribe(data => {
      this.store.dispatch(retrievedUserTasks({data: data.result}));
    })
  }

  delayedAlert(nodeName: string, nodeStatus: any) {
    const ele = this.cy.nodes().filter(`[name='${nodeName}']`)[0];
    if (!ele) {
      return;
    }
    // set the VM Power and Status value in the tooltip
    ele.style({'background-opacity': '1'});
    ele.style({'border-width': '10px'});
    ele.style({'border-opacity': '1'});
    const d = nodeStatus;
    if (d.state == "on" && d.status == "running") {
      ele.data('color', this.statusColorLookup.on);
      ele.style({'border-color': this.statusColorLookup.on});
    } else if (d.state == "on" && d.status == "notRunning") {
      ele.data("color", this.statusColorLookup.unknown);
      ele.style({'border-color': this.statusColorLookup.unknown});
    } else if (d.state == "off") {
      ele.data('color', this.statusColorLookup.off);
      ele.style({'border-color': this.statusColorLookup.off});
    } else if (!(d.state == false)) {
      ele.style({'background-opacity': '0'});
      ele.style({'border-opacity': '0'});
    } else {
      ele.style({'background-opacity': '0'});
      ele.style({'border-opacity': '0'});
    }
  }

  removeVMStatusOnMap() {
    const nodes = this.cy.nodes().filter('[icon]');
    nodes.style('border-opacity', 0);
    nodes.style('border-width', 0);
    nodes.style('background-opacity', 0);
  }

  changeVMStatusOnMap(collectionId: number, connectionId: number) {
    this.mapService.getVMStatus(collectionId, connectionId).subscribe(vmStatus => {
      for (const [key, value] of Object.entries(vmStatus)) {
        this.delayedAlert(key, value);
      }
    })
  }

  initVMStatus(collectionId: number, connectionId: number) {
    if (this.isConnect && this.vmStatus) {
      this.changeVMStatusOnMap(collectionId, connectionId);
    } else {
      this.removeVMStatusOnMap();
    }
  }
}
