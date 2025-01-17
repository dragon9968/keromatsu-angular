import { createReducer, on } from '@ngrx/store';
import { TemplateState } from 'src/app/store/template/template.state';
import { retrievedTemplates, retrievedTemplatesByDevice } from './template.actions';

const initialState = {} as TemplateState;

export const templateReducer = createReducer(
  initialState,
  on(retrievedTemplates, (state, { data }) => ({
    ...state,
    templates: data,
  })),
  on(retrievedTemplatesByDevice, (state, { templatesByDevice }) => ({
    ...state,
    templatesByDevice: templatesByDevice,
  })),
);