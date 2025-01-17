import { createReducer, on } from '@ngrx/store';
import { DomainState } from 'src/app/store/domain/domain.state';
import { domainAddedSuccess, domainUpdatedSuccess, domainsDeletedSuccess, domainsLoadedSuccess } from './domain.actions';

const initialState = {} as DomainState;

export const domainReducer = createReducer(
  initialState,
  on(domainsLoadedSuccess, (state, { domains }) => ({
    ...state,
    domains,
  })),
  on(domainUpdatedSuccess, (state, { domain }) => {
    const domains = state.domains.map((d: any) => (d.id == domain.id) ? { ...d, ...domain } : d);
    return {
      ...state,
      domains,
    };
  }),
  on(domainAddedSuccess, (state, { domain }) => {
    const domains = [ ...state.domains, domain ];
    return {
      ...state,
      domains,
    };
  }),
  on(domainsDeletedSuccess, (state, { ids }) => {
    const domains = state.domains.filter(d => !ids.includes(d.id));
    return {
      ...state,
      domains,
    };
  }),
);