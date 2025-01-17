import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { forkJoin, of } from 'rxjs';
import { map, exhaustMap, catchError, switchMap, mergeMap, tap } from 'rxjs/operators';
import { NodeService } from 'src/app/core/services/node/node.service';
import {
  loadNodes,
  nodeUpdatedSuccess,
  nodesLoadedSuccess,
  updateNode,
  addNewNode,
  nodeAddedSuccess,
  bulkEditNode,
  bulkUpdatedNodeSuccess,
  addNewNodeToMap,
  removeNodes,
  removeNodesSuccess,
  restoreNodes,
  restoreNodesSuccess,
  cloneNodeById,
  removeNodeOnMap,
} from './node.actions';
import { ConfigTemplateService } from 'src/app/core/services/config-template/config-template.service';
import { HelpersService } from 'src/app/core/services/helpers/helpers.service';
import { pushNotification } from '../app/app.actions';
import {
  addLogicalInterfacesByNodeId,
  updateNodeInInterfaces
} from '../interface/interface.actions';
import { removeNodesInGroup, restoreNodesInGroup, updateNodeInGroup } from '../group/group.actions';
import { reloadGroupBoxes } from '../map/map.actions';
import { ErrorMessages } from "../../shared/enums/error-messages.enum";

@Injectable()
export class NodesEffects {

  loadNodes$ = createEffect(() => this.actions$.pipe(
    ofType(loadNodes),
    exhaustMap((payload) => this.nodeService.getNodesByProjectId(payload.projectId)
      .pipe(
        map(res => nodesLoadedSuccess({ nodes: res.result })),
        catchError((e) => of(pushNotification({
          notification: {
            type: 'error',
            message: 'Load Nodes failed!'
          }
        })))
      ))
  ));

  addNewNode$ = createEffect(() => this.actions$.pipe(
    ofType(addNewNode),
    exhaustMap(payload => this.nodeService.add(payload.node).pipe(
      mergeMap(res => this.nodeService.get(res.id)),
      switchMap(res => [
        nodeAddedSuccess({ node: res.result }),
        updateNodeInGroup({ node: res.result }),
        addNewNodeToMap({ id: res.result.id }),
        reloadGroupBoxes(),
        pushNotification({
          notification: {
            type: 'success',
            message: 'Node details added!'
          }
        })
      ]),
      catchError(e => of(pushNotification({
        notification: {
          type: 'error',
          message: 'Add new node failed'
        }
      })))
    ))
  ));

  addNewNodeToMap$ = createEffect(() => this.actions$.pipe(
    ofType(addNewNodeToMap),
    tap((payload) => this.helpersService.addNewNodeToMap(payload.id))
  ), { dispatch: false });

  removeNodeOnMap$ = createEffect(() => this.actions$.pipe(
    ofType(removeNodeOnMap),
    tap((payload) => {
      if (payload.mapCategory === 'physical' && (payload.node.category !== 'hw' && !payload.node.infrastructure)) {
        return this.helpersService.removeNodeOnMap(payload.node.id)
      }
    })
  ), { dispatch: false });

  cloneNewNodeById$ = createEffect(() => this.actions$.pipe(
    ofType(cloneNodeById),
    mergeMap(payload => this.nodeService.get(payload.id).pipe(
      switchMap(res => [
        nodeAddedSuccess({ node: res.result }),
        updateNodeInGroup({ node: res.result }),
        addNewNodeToMap({ id: res.result.id }),
        addLogicalInterfacesByNodeId({ nodeId: res.result.id }),
        pushNotification({
          notification: {
            type: 'success',
            message: `Cloned node ${res.result.name} successfully`
          }
        })
      ]),
      catchError(e => of(pushNotification({
        notification: {
          type: 'error',
          message: ErrorMessages.CLONE_NODE_FAILED
        }
      })))
    ))
  ));

  updateNode$ = createEffect(() => this.actions$.pipe(
    ofType(updateNode),
    exhaustMap((payload) => this.nodeService.put(payload.id, payload.data)
      .pipe(
        mergeMap(res => {
          if (payload.configTemplate) {
            const configData = { pk: payload.id, config_ids: payload.configTemplate };
            return this.nodeService.associate(configData);
          } else {
            return of([]);
          }
        }),
        mergeMap(res => {
          if (payload.configDefaultNode) {
            return this.configTemplateService.putConfiguration(payload.configDefaultNode);
          } else {
            return of([]);
          }
        }),
        mergeMap(res => this.nodeService.get(payload.id)),
        map((res: any) => {
          this.helpersService.updateNodeOnMap(`node-${payload.id}`, res.result);
          return res.result;
        }),
        switchMap((node: any) => [
          nodeUpdatedSuccess({ node: node, mapCategory: payload.mapCategory }),
          updateNodeInInterfaces({ node }),
          removeNodeOnMap({ node: node, mapCategory: payload.mapCategory}),
          reloadGroupBoxes(),
          pushNotification({
            notification: {
              type: 'success',
              message: 'Node details updated!'
            }
          })
        ]),
        catchError((e) => of(pushNotification({
          notification: {
            type: 'error',
            message: 'Update node failed!'
          }
        })))
      )),
  ));

  bulkEditNode$ = createEffect(() => this.actions$.pipe(
    ofType(bulkEditNode),
    exhaustMap((payload) => this.nodeService.editBulk(payload.data)
      .pipe(
        mergeMap(res => {
          if (payload.configTemplate) {
            return forkJoin(payload.ids.map((id: any) => {
              const configData = { pk: id, config_ids: payload.configTemplate };
              return this.nodeService.associate(configData);
            }))
          } else {
            return of([]);
          }
        }),
        mergeMap(res => {
          return forkJoin(payload.ids.map((id: any) => {
            return this.nodeService.get(id).pipe(map(nodeData => {
              this.helpersService.updateNodeOnMap(`node-${id}`, nodeData.result);
              return nodeData.result;
            }));
          }))
        }),
        switchMap((nodes: any) => [
          bulkUpdatedNodeSuccess({ nodes }),
          reloadGroupBoxes(),
          pushNotification({
            notification: {
              type: 'success',
              message: 'Bulk Edit nodes successfully!'
            }
          })
        ]),
        catchError((e) => of(pushNotification({
          notification: {
            type: 'error',
            message: 'Bulk Edit nodes failed!'
          }
        })))
      )),
  ));

  removeNodes$ = createEffect(() => this.actions$.pipe(
    ofType(removeNodes),
    exhaustMap(payload => of([])
      .pipe(
        switchMap(res => [
          removeNodesSuccess({ ids: payload.ids, mapCategory: payload.mapCategory }),
          removeNodesInGroup({ ids: payload.ids }),
          reloadGroupBoxes(),
          pushNotification({
            notification: {
              type: 'success',
              message: 'Nodes removed!'
            }
          })
        ]),
        catchError(e => of(pushNotification({
          notification: {
            type: 'error',
            message: 'Remove nodes failed'
          }
        })))
      ))
  ));

  restoreNodes$ = createEffect(() => this.actions$.pipe(
    ofType(restoreNodes),
    exhaustMap(payload => of([])
      .pipe(
        switchMap(res => [
          restoreNodesSuccess({ ids: payload.ids, mapCategory: payload.mapCategory }),
          restoreNodesInGroup({ ids: payload.ids }),
          reloadGroupBoxes(),
          pushNotification({
            notification: {
              type: 'success',
              message: 'Nodes restored!'
            }
          })
        ]),
        catchError(e => of(pushNotification({
          notification: {
            type: 'error',
            message: 'Restore nodes failed'
          }
        })))
      ))
  ));

  constructor(
    private actions$: Actions,
    private nodeService: NodeService,
    private configTemplateService: ConfigTemplateService,
    private helpersService: HelpersService,
  ) { }
}
