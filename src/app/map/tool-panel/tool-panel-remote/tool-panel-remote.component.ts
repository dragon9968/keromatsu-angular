import { Store } from "@ngrx/store";
import { MatDialog } from "@angular/material/dialog";
import { ToastrService } from "ngx-toastr";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { interval, Observable, Subject, Subscription, takeUntil } from "rxjs";
import { MapService } from "../../../core/services/map/map.service";
import { NodeService } from "../../../core/services/node/node.service";
import { ProjectService } from "src/app/project/services/project.service";
import { CMRemoteService } from "../../context-menu/cm-remote/cm-remote.service";
import { InfoPanelService } from "../../../core/services/info-panel/info-panel.service";
import { ServerConnectService } from "../../../core/services/server-connect/server-connect.service";
import { NODE_TASKS } from "../../../shared/contants/node-tasks.constant";
import { NODE_TOOLS } from "../../../shared/contants/node-tools.constant";
import { PORT_GROUP_TASKS } from "../../../shared/contants/port-group-tasks.constant";
import { selectVMStatus } from "../../../store/project/project.selectors";
import { selectIsConnect } from "../../../store/server-connect/server-connect.selectors";
import { retrievedVMStatus } from "../../../store/project/project.actions";
import { ErrorMessages } from "../../../shared/enums/error-messages.enum";
import { HelpersService } from "../../../core/services/helpers/helpers.service";
import { autoCompleteValidator } from "../../../shared/validations/auto-complete.validation";
import { NodeToolsDialogComponent } from "../../deployment-dialog/deployment-node-dialog/node-tools-dialog/node-tools-dialog.component";
import { UpdateFactsNodeDialogComponent } from "../../deployment-dialog/deployment-node-dialog/update-facts-node-dialog/update-facts-node-dialog.component";
import { DeleteNodeDeployDialogComponent } from "../../deployment-dialog/deployment-node-dialog/delete-node-deploy-dialog/delete-node-deploy-dialog.component";
import { AddDeletePGDeployDialogComponent } from "../../deployment-dialog/deployment-pg-dialog/add-delete-pg-deploy-dialog/add-delete-pg-deploy-dialog.component";
import { CreateNodeSnapshotDialogComponent } from "../../deployment-dialog/deployment-node-dialog/create-node-snapshot-dialog/create-node-snapshot-dialog.component";
import { DeleteNodeSnapshotDialogComponent } from "../../deployment-dialog/deployment-node-dialog/delete-node-snapshot-dialog/delete-node-snapshot-dialog.component";
import { RevertNodeSnapshotDialogComponent } from "../../deployment-dialog/deployment-node-dialog/revert-node-snapshot-dialog/revert-node-snapshot-dialog.component";
import { AddUpdateNodeDeployDialogComponent } from "../../deployment-dialog/deployment-node-dialog/add-update-node-deploy-dialog/add-update-node-deploy-dialog.component";

@Component({
  selector: 'app-tool-panel-remote',
  templateUrl: './tool-panel-remote.component.html',
  styleUrls: ['./tool-panel-remote.component.scss']
})
export class ToolPanelRemoteComponent implements OnInit, OnDestroy {

  @Input() cy: any;
  @Input() activeNodes: any;
  @Input() activePGs: any
  vmStatusChecked = false;
  selectVMStatus$ = new Subscription();
  selectIsConnect$ = new Subscription();
  collectionId!: any;
  isConnect = false;
  destroy$: Subject<boolean> = new Subject<boolean>();

  connection = { name: '', id: 0 }
  connectionName = '';
  connectionCategory = '';
  connectionServer = '';
  connectionDatacenter = '';
  connectionCluster = '';
  connectionSwitch = '';
  connectionSwitchType = '';
  userName = '';
  nodeTaskForm: FormGroup;
  nodeTaskList = NODE_TASKS;
  filteredNodeTasks!: Observable<any>[];
  errorMessages = ErrorMessages;
  nodeToolForm: FormGroup;
  nodeTools = NODE_TOOLS;
  filteredTools!: Observable<any>[];
  portGroupTaskFrom: FormGroup;
  portGroupTaskList = PORT_GROUP_TASKS;
  filteredTasks!: Observable<any>[];

  constructor(
    private store: Store,
    private dialog: MatDialog,
    private toastr: ToastrService,
    private mapService: MapService,
    private nodeService: NodeService,
    private helpersService: HelpersService,
    private projectService: ProjectService,
    private cmRemoteService: CMRemoteService,
    private infoPanelService: InfoPanelService,
    private serverConnectionService: ServerConnectService,
  ) {
    this.collectionId = this.projectService.getCollectionId();
    this.selectIsConnect$ = this.store.select(selectIsConnect).subscribe(isConnect => {
      if (isConnect !== undefined) {
        this.isConnect = isConnect;
        const connection = this.serverConnectionService.getConnection();
        this.connection = connection ? connection : { name: '', id: 0 };
        this._updateConnectionInfo(this.connection);
      }
    })
    this.selectVMStatus$ = this.store.select(selectVMStatus).subscribe(vmStatusChecked => {
      this.vmStatusChecked = vmStatusChecked;
      if (this.isConnect && vmStatusChecked) {
        this.infoPanelService.changeVMStatusOnMap(this.collectionId, this.connection.id);
      } else {
        this.infoPanelService.removeMapStatusOnMap();
      }
    })
    this.nodeTaskForm = new FormGroup({
      nodeTaskCtr: new FormControl('')
    });
    this.filteredNodeTasks = this.helpersService.filterOptions(this.nodeTaskCtr, this.nodeTaskList);
    this.nodeToolForm = new FormGroup({
      toolCtr: new FormControl('')
    });
    this.filteredTools = this.helpersService.filterOptions(this.toolCtr, this.nodeTools);
    this.portGroupTaskFrom = new FormGroup({
      pgTaskCtr: new FormControl('')
    });
    this.filteredTasks = this.helpersService.filterOptions(this.pgTaskCtr, this.portGroupTaskList);
  }

  get nodeTaskCtr() { return this.helpersService.getAutoCompleteCtr(this.nodeTaskForm.get('nodeTaskCtr'), this.nodeTaskList); }
  get toolCtr() { return this.helpersService.getAutoCompleteCtr(this.nodeToolForm.get('toolCtr'), this.nodeTools); }
  get pgTaskCtr() { return this.helpersService.getAutoCompleteCtr(this.portGroupTaskFrom.get('pgTaskCtr'), this.portGroupTaskList); }

  ngOnInit(): void {
    this.nodeTaskCtr?.setValue(this.nodeTaskList[0]);
    this.nodeTaskCtr?.setValidators([Validators.required, autoCompleteValidator(this.nodeTaskList)]);
    this.helpersService.setAutoCompleteValue(this.nodeTaskCtr, this.nodeTaskList, this.nodeTaskList[0].id);
    this.toolCtr?.setValue(this.nodeTools[0]);
    this.toolCtr?.setValidators([Validators.required, autoCompleteValidator(this.nodeTools)]);
    this.helpersService.setAutoCompleteValue(this.toolCtr, this.nodeTools, this.nodeTools[0].id);
    this.pgTaskCtr?.setValue(this.portGroupTaskList[0]);
    this.pgTaskCtr?.setValidators([Validators.required, autoCompleteValidator(this.portGroupTaskList)]);
    this.helpersService.setAutoCompleteValue(this.pgTaskCtr, this.portGroupTaskList, this.portGroupTaskList[0].id);
    interval(30000).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      if (this.connection && this.connection.id !== 0 && this.vmStatusChecked) {
        this.infoPanelService.changeVMStatusOnMap(this.collectionId, this.connection.id);
      }
    });
  }

  ngOnDestroy(): void {
    this.selectVMStatus$.unsubscribe();
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }

  toggleVMStatus($event: any) {
    if ($event.checked) {
      this.store.dispatch(retrievedVMStatus({ vmStatus: $event.checked }));
    }
    else {
      this.store.dispatch(retrievedVMStatus({ vmStatus: $event.checked }));
    }
  }

  refreshVMStatus() {
    this.infoPanelService.changeVMStatusOnMap(this.collectionId, this.connection.id);
  }

  private _updateConnectionInfo(connection: any) {
    if (connection.category && connection.parameters) {
      this.connectionName = connection.name;
      this.connectionCategory = connection.category;
      this.connectionServer = connection.parameters?.server;
      this.connectionDatacenter = connection.parameters?.datacenter;
      this.connectionCluster = connection.parameters?.cluster;
      this.connectionSwitch = connection.parameters?.switch;
      this.connectionSwitchType = connection.parameters?.switch_type;
      this.userName = connection.parameters?.username;
    }
  }

  goNodeTask() {
    const nodeTaskId = this.nodeTaskCtr?.value.id;
    let dialogData, activeNodeIds, collectionId, connection, pks, jsonData;
    switch (nodeTaskId) {
      case 'deploy_node':
        dialogData = {
          jobName: 'deploy_node',
          activeNodes: this.activeNodes
        };
        this.dialog.open(AddUpdateNodeDeployDialogComponent,{ width: '600px', data: dialogData, autoFocus: false });
        break;
      case 'delete_node':
        dialogData = {
          activeNodes: this.activeNodes
        };
        this.dialog.open(DeleteNodeDeployDialogComponent,{ width: '600px', data: dialogData, autoFocus: false });
        break;
      case 'update_node':
        dialogData = {
          jobName: 'update_node',
          activeNodes: this.activeNodes
        };
        this.dialog.open(AddUpdateNodeDeployDialogComponent,{ width: '600px', data: dialogData, autoFocus: false });
        break;
      case 'power_on_node':
        activeNodeIds = this.activeNodes.map((ele: any) => ele.data('node_id')).join(',');
        this.cmRemoteService.add_task('node', 'power_on_node', activeNodeIds);
        break;
      case 'power_off_node':
        activeNodeIds = this.activeNodes.map((ele: any) => ele.data('node_id')).join(',');
        this.cmRemoteService.add_task('node', 'power_off_node', activeNodeIds);
        break;
      case 'restart_node':
        activeNodeIds = this.activeNodes.map((ele: any) => ele.data('node_id')).join(',');
        this.cmRemoteService.add_task('node', 'restart_node', activeNodeIds);
        break;
      case 'create_snapshot':
        dialogData = {
          activeNodes: this.activeNodes
        };
        this.dialog.open(CreateNodeSnapshotDialogComponent,{ width: '600px', data: dialogData, autoFocus: false });
        break;
      case 'delete_snapshot':
        collectionId = this.projectService.getCollectionId();
        connection = this.serverConnectionService.getConnection();
        pks = this.activeNodes.map((ele: any) => ele.data('node_id'));
        jsonData = {
          pks: pks,
          collection_id: collectionId,
          connection_id: connection ? connection?.id : 0
        }
        this.nodeService.getSnapshots(jsonData).subscribe(response => {
          const dialogData = {
            activeNodes: this.activeNodes,
            names: response
          };
          this.dialog.open(DeleteNodeSnapshotDialogComponent, { width: '600px', data: dialogData, autoFocus: false });
        })
        break;
      case 'revert_snapshot':
        collectionId = this.projectService.getCollectionId()
        connection = this.serverConnectionService.getConnection();
        pks = this.activeNodes.map((ele: any) => ele.data('node_id'));
        jsonData = {
          pks: pks,
          collection_id: collectionId,
          connection_id: connection ? connection?.id : 0
        }
        this.nodeService.getSnapshots(jsonData).subscribe(response => {
          const dialogData = {
            activeNodes: this.activeNodes,
            names: response
          };
          this.dialog.open(RevertNodeSnapshotDialogComponent, { width: '600px', data: dialogData, autoFocus: false });
        })
        break;
      case 'update_facts':
        dialogData = {
          activeNodes: this.activeNodes
        };
        this.dialog.open(UpdateFactsNodeDialogComponent,{ width: '600px', data: dialogData, autoFocus: false });
        break;
      default:
        this.toastr.warning('Please select a node before adding the task', 'Warning');
    }
  }

  goNodeTool() {
    const nodeToolId = this.toolCtr?.value.id;
    let dialogData;
    switch (nodeToolId) {
      case 'ping_test':
        dialogData = {
          pks: this.activeNodes.map((node: any) => node.data('node_id')),
          jobName: 'ping_test',
        }
        this.dialog.open(NodeToolsDialogComponent, { width: '450px', data: dialogData, autoFocus: false } )
        break;
      case 'shell_command':
        dialogData = {
          pks: this.activeNodes.map((node: any) => node.data('node_id')),
          jobName: 'shell_command',
        }
        this.dialog.open(NodeToolsDialogComponent, { width: '450px', data: dialogData, autoFocus: false })
        break;
      default:
        this.toastr.warning('Please select a node before adding the tool task', 'Warning');
    }
  }

  goPGTask() {
    const portGroupTaskId = this.pgTaskCtr?.value.id;
    let dialogData;
    switch (portGroupTaskId) {
      case 'deploy_pg':
        dialogData = {
          jobName: 'create_pg',
          activePGs: this.activePGs,
          message: 'Deploy this port group?'
        };
        this.dialog.open(AddDeletePGDeployDialogComponent, { width: '450px', data: dialogData, autoFocus: false });
        break;
      case 'delete_pg':
        dialogData = {
          jobName: 'delete_pg',
          activePGs: this.activePGs,
          message: 'Delete port group(s)?'
        };
        this.dialog.open(AddDeletePGDeployDialogComponent, { width: '450px', data: dialogData, autoFocus: false });
        break;
      case 'update_pg':
        dialogData = {
          jobName: 'update_pg',
          activePGs: this.activePGs,
          message: 'Update port group(s)?'
        };
        this.dialog.open(AddDeletePGDeployDialogComponent, { width: '450px', data: dialogData, autoFocus: false });
        break;
      default:
        this.toastr.warning('Please select a port group before adding the task', 'Warning');
    }
  }
}
