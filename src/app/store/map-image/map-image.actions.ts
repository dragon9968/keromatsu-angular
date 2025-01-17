import { createAction, props } from '@ngrx/store';

export const retrievedImages = createAction(
  'retrievedImages',
  props<{ data: any }>()
);

export const loadMapImages = createAction(
  'loadMapImages',
  props<{ 
    projectId: string,
    mapCategory: any
  }>()
);

export const mapImagesLoadedSuccess = createAction(
  'mapImagesLoadedSuccess',
  props<{ 
    mapImages: any,
    mapCategory: any
  }>()
);

export const addNewMapImage = createAction(
  'addNewMapImage',
  props<{ mapImage: any, mapCategory: any}>()
)

export const mapImageAddedSuccess = createAction(
  'mapImageAddedSuccess',
  props<{ mapImage: any, mapCategory: any }>()
)

export const addNewMapImageToMap = createAction(
  'addNewMapImageToMap',
  props<{ id: number }>()
)

export const selectMapImage = createAction(
  'selectMapImage',
  props<{ id: string }>()
);

export const unSelectMapImage = createAction(
  'unSelectMapImage',
  props<{ id: string }>()
);

export const selectAllMapImage = createAction(
  'selectAllMapImage'
);

export const unSelectAllMapImage = createAction(
  'unSelectAllMapImage'
);

export const linkedMapImagesLoadedSuccess = createAction(
  'linkedMapImagesLoadedSuccess',
  props<{ mapImages: any, mapLinkId: number, position: any }>()
);

export const clearLinkedMapImages = createAction(
  'clearLinkedMapImages'
)

export const removeMapImages = createAction(
  'removeMapImages',
  props<{ ids: number[] }>()
)

export const removeMapImagesSuccess = createAction(
  'removeMapImagesSuccess',
  props<{ ids: number[] }>()
)

export const restoreMapImages = createAction(
  'restoreMapImages',
  props<{ ids: number[] }>()
)

export const restoreMapImagesSuccess = createAction(
  'restoreMapImagesSuccess',
  props<{ ids: number[] }>()
)
