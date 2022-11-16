export enum ApiPaths {
  ASSETS = '/assets',
  LOGIN = '/api/v1/security/login',
  REFRESH_TOKEN = '/api/v1/security/refresh',
  LOGOUT = '/api/v1/logout',
  GET_MAP_DATA = '/api/v1/map/get_data',
  PROJECTS = '/api/v1/project/',
  ICONS = '/api/v1/icon/',
  ICONS_ADD = '/api/v1/icon/add_icon',
  DEVICES = '/api/v1/device/',
  DEVICE_CATEGORY = '/api/v1/device_category/',
  TEMPLATES = '/api/v1/template/',
  HARDWARES = '/api/v1/hardware/',
  DOMAINS = '/api/v1/domain/',
  DOMAINS_BULK_EDIT = '/api/v1/domain/bulk_edit',
  DOMAINS_EXPORT = '/api/v1/domain/export',
  DOMAINS_CREATE_USERS = '/api/v1/domain/create_user',
  DOMAINS_VALIDATE = '/api/v1/domain/validate',
  CONFIG_TEMPLATES = '/api/v1/configtemplate/',
  LOGIN_PROFILES = '/api/v1/loginprofile/',
  NODE = '/api/v1/node/',
  NODE_SNAPSHOTS = '/api/v1/node/get_snapshots',
  CLONE_NODE = '/api/v1/node/clone/',
  VALIDATE_NODE = '/api/v1/node/validate',
  PORTGROUP = '/api/v1/portgroup/',
  PORTGROUP_EXPORT  = '/api/v1/portgroup/export',
  MAP_PREF = '/api/v1/mappref/',
  GEN_NODE_DATA = '/api/v1/node/gen_data',
  GEN_PG_DATA = '/api/v1/portgroup/gen_data',
  INTERFACE = '/api/v1/interface/',
  GEN_INTERFACE_DATA = '/api/v1/interface/gen_data',
  INTERFACE_BY_PKS = '/api/v1/interface/data_by_pks',
  TASK = '/api/v1/task/add',
  USER_TASK = '/api/v1/user_task/',
  USER_TASK_RERUN = '/api/v1/user_task/rerun_task',
  USER_TASK_REVOKE = '/api/v1/user_task/revoke_task',
  USER_TASK_POST_TASK = '/api/v1/user_task/post_task',
  USER_TASK_REFRESH_TASK = '/api/v1/user_task/refresh',
  PORTGROUP_RANDOMIZE_SUBNET = '/api/v1/portgroup/randomize_subnet/',
  PORTGROUP_RANDOMIZE_SUBNET_BULK = '/api/v1/portgroup/randomize_subnet_bulk',
  PORTGROUP_VALIDATE = '/api/v1/portgroup/validate',
  INTERFACE_RANDOMIZE_IP = '/api/v1/interface/randomize_ip/',
  INTERFACE_RANDOMIZE_IP_BULK = '/api/v1/interface/randomize_ip_bulk',
  INTERFACE_VALIDATE = '/api/v1/interface/validate',
  SAVE_MAP = '/api/v1/map/save',
  USER = '/api/v1/user/',
  SEARCH = '/api/v1/search/map',
  DOMAIN_USER = '/api/v1/domainuser/',
  GROUP = '/api/v1/group/',
  UPDATE_GROUP = '/api/v1/group/update',
  SERVER_CONNECT = '/api/v1/server_connect/',
  CONNECT_TO_SERVER = '/api/v1/server_connect/connection',
  VM_STATUS = '/api/v1/map/vm_status',
  SAVE_VM_STATUS = '/api/v1/map/save_vm_status',
  ADD_PROJECT = '/api/v1/project/add',
  ASSOCIATE_PROJECT = '/api/v1/project/associate',
  NODE_CLONE = '/api/v1/node/clone_bulk',
  NODE_EXPORT = '/api/v1/node/export/',
  ASSOCIATE = '/api/v1/node/associate',
  CLEAR_PARAMETERS = '/api/v1/server_connect/clear_parameters',
  CONNECTION_EXPORT = '/api/v1/server_connect/export',
  PING_TEST = '/api/v1/server_connect/ping_test',
  LOGIN_CHECK = '/api/v1/server_connect/login_check',
  LOGIN_PROFILE_EXPORT_CSV = '/api/v1/loginprofile/export_csv',
  LOGIN_PROFILE_EXPORT_JSON = '/api/v1/loginprofile/export_json',
  HARDWARE_EXPORT = '/api/v1/hardware/export/',
  ICONS_UPDATE = '/api/v1/icon/update_icon/',
  ICONS_EXPORT = '/api/v1/icon/export',
  MAP_PREF_EXPORT = '/api/v1/mappref/export',
  ADD_CONFIG_TEMPLATES = '/api/v1/configtemplate/add_configuration',
  GET_WINROLES = '/api/v1/configtemplate/get_winroles',
  CONFIG_TEMPLATES_EXPORT = '/api/v1/configtemplate/export',
  DELETE_CONFIG_TEMPLATES = '/api/v1/configtemplate/delete_configuration/',
  DEVICES_ADD = '/api/v1/device/add',
  DEVICES_UPDATE = '/api/v1/device/update',
  DEVICES_EXPORT = '/api/v1/device/export',
  TEMPLATES_EXPORT = '/api/v1/template/export',
  MAP_IMAGE = '/api/v1/mapimage/',
}
