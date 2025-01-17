import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { forkJoin, of } from 'rxjs';
import { map, exhaustMap, catchError, mergeMap, switchMap, tap } from 'rxjs/operators';
import { 
  addGroup, 
  addNodePgToGroup, 
  addNodePgToGroupSuccess, 
  deleteGroups, 
  groupAddedSuccess, 
  groupUpdatedSuccess, 
  groupsDeletedSuccess, 
  groupsLoadedSuccess, 
  loadGroups, 
  updateGroup, 
  updateSelectedNodeInGroup
} from './group.actions';
import { GroupService } from 'src/app/core/services/group/group.service';
import { pushNotification } from '../app/app.actions';
import { reloadGroupBoxes } from '../map/map.actions';
import { HelpersService } from 'src/app/core/services/helpers/helpers.service';

@Injectable()
export class GroupsEffects {

  loadGroups$ = createEffect(() => this.actions$.pipe(
    ofType(loadGroups),
    exhaustMap((data) => this.groupService.getGroupByProjectId(data.projectId)
      .pipe(
        map(res => (groupsLoadedSuccess({ groups: res.result }))),
        catchError((e) => of(pushNotification({
          notification: {
            type: 'error',
            message: 'Load Groups failed!'
          }
        })))
      ))
  )
  );

  addGroup$ = createEffect(() => this.actions$.pipe(
    ofType(addGroup),
    exhaustMap((payload) => this.groupService.add(payload.data)
      .pipe(
        mergeMap(res => this.groupService.get(res.result.id)),
        switchMap((res: any) => [
          groupAddedSuccess({ group: res.result }),
          reloadGroupBoxes(),
          pushNotification({
            notification: {
              type: 'success',
              message: 'Group details added!'
            }
          })
        ]),
        catchError((e) => of(pushNotification({
          notification: {
            type: 'error',
            message: 'Add group failed!'
          }
        })))
      )),
  ));

  updateGroup$ = createEffect(() => this.actions$.pipe(
    ofType(updateGroup),
    exhaustMap((payload) => this.groupService.put(payload.id, payload.data)
      .pipe(
        mergeMap(res => this.groupService.get(payload.id)),
        switchMap((res: any) => [
          groupUpdatedSuccess({ group: res.result }),
          reloadGroupBoxes(),
          updateSelectedNodeInGroup({id: payload.id}),
          pushNotification({
            notification: {
              type: 'success',
              message: 'Group details updated!'
            }
          })
        ]),
        catchError((e) => of(pushNotification({
          notification: {
            type: 'error',
            message: 'Update group failed!'
          }
        })))
      )),
  ));

  deleteGroups$ = createEffect(() => this.actions$.pipe(
    ofType(deleteGroups),
    exhaustMap((payload) => forkJoin(payload.ids.map(id => this.groupService.delete(id)))
      .pipe(
        switchMap((res: any) => [
          groupsDeletedSuccess({ ids: payload.ids }),
          reloadGroupBoxes(),
          pushNotification({
            notification: {
              type: 'success',
              message: 'Groups deleted!'
            }
          })
        ]),
        catchError((e) => of(pushNotification({
          notification: {
            type: 'error',
            message: 'Delete groups failed!'
          }
        })))
      )),
  ));

  addNodePgToGroup$ = createEffect(() => this.actions$.pipe(
    ofType(addNodePgToGroup),
    exhaustMap((payload) => this.groupService.put(payload.id, payload.data)
      .pipe(
        mergeMap(res => this.groupService.getGroupByProjectId(payload.projectId)),
        switchMap((res: any) => [
          addNodePgToGroupSuccess({ groupsData: res.result }),
          reloadGroupBoxes(),
          pushNotification({
            notification: {
              type: 'success',
              message: 'Add node/port group to group successfully!'
            }
          })
        ]),
        catchError((e) => of(pushNotification({
          notification: {
            type: 'error',
            message: 'Add node/port group to group failed!'
          }
        })))
      )),
  ));

  updateSelectedNodeInGroup$ = createEffect(() => this.actions$.pipe(
    ofType(updateSelectedNodeInGroup),
    tap((payload) => this.helpersService.updateSelectedNodeInGroup(payload.id))
  ), { dispatch: false });

  constructor(
    private actions$: Actions,
    private groupService: GroupService,
    private helpersService: HelpersService
  ) { }
}
