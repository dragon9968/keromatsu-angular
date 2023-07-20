import { createReducer, on } from '@ngrx/store';
import { MapState } from 'src/app/store/map/map.state';
import { retrievedMap, retrievedIsMapOpen, retrievedIsFinishLoadedElements } from './map.actions';

const initialState = {} as MapState;

export const mapReducer = createReducer(
  initialState,
  on(retrievedMap, (state, { data }) => ({
    ...state,
    mapItems: data.map_items,
    mapProperties: data.map_properties,
    defaultPreferences: data.map_properties.default_preferences.map_style,
    nodes: data.map_items.nodes,
    interfaces: data.map_items.interfaces,
    groupBoxes: data.map_items.group_boxes
  })),
  on(retrievedIsMapOpen, (state, { data }) => ({
    ...state,
    isMapOpen: data,
  })),
  on(retrievedIsFinishLoadedElements, (state, { IsFinishLoadedElements }) => ({
    ...state,
    IsFinishLoadedElements,
  })),
);
