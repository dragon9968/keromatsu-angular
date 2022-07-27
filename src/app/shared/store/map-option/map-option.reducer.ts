import { createReducer, on } from '@ngrx/store';
import { retrievedMapOption } from './map-option.actions';

const initialState = {} as any;

export const mapOptionReducer = createReducer(
  initialState,
  on(retrievedMapOption, (state, { data }) => ({
    ...state,
    mapOption: data,
  })),
);