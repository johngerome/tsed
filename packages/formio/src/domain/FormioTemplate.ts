import {FormioActionItem, FormioForm, FormioRole} from "./FormioModels";

export interface FormioTemplate {
  roles?: Record<string, FormioRole>;
  forms: Record<string, FormioForm>;
  resources: Record<string, FormioForm>;
  actions: Record<string, FormioActionItem>;
}
