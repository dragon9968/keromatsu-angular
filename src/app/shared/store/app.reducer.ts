import { ReducerKeys } from "../enums/reducer-keys.enum";
import { configTemplateReducer } from "./config-template/config-template.reducer";
import { deviceReducer } from "./device/device.reducer";
import { domainReducer } from "./domain/domain.reducer";
import { hardwareReducer } from "./hardware/hardware.reducer";
import { iconReducer } from "./icon/icon.reducer";
import { loginProfileReducer } from "./login-profile/login-profile.reducer";
import { mapOptionReducer } from "./map-option/map-option.reducer";
import { mapPrefReducer } from "./map-pref/map-pref.reducer";
import { mapReducer } from "./map/map.reducer";
import { mapEditReducer } from "./map-edit/map-edit.reducer";
import { projectReducer } from "./project/project.reducer";
import { templateReducer } from "./template/template.reducer";

export const reducers = {
    [ReducerKeys.MAP]: mapReducer,
    [ReducerKeys.PROJECT]: projectReducer,
    [ReducerKeys.ICON]: iconReducer,
    [ReducerKeys.DEVICE]: deviceReducer,
    [ReducerKeys.TEMPLATE]: templateReducer,
    [ReducerKeys.HARDWARE]: hardwareReducer,
    [ReducerKeys.DOMAIN]: domainReducer,
    [ReducerKeys.CONFIG_TEMPLATE]: configTemplateReducer,
    [ReducerKeys.LOGIN_PROFILE]: loginProfileReducer,
    [ReducerKeys.MAP_PREF]: mapPrefReducer,
    [ReducerKeys.MAP_EDIT]: mapEditReducer,
    [ReducerKeys.MAP_OPTION]: mapOptionReducer,
}