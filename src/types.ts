/** The global Ladda config */
export interface Config {
  idField?: string ;
  useProductionBuild?: boolean
}

/** The config a user passes into ladda from the outside into the build method */
export type ExternalConfig = EntityConfigs & {
  __config: Config
};

/** The API returned by the builder, ready for use */
export interface Api {
  [name: string]: EntityApi;
}

export enum Operation {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  COMMAND = 'COMMAND',
  NO_OPERATION = 'NO_OPERATION'
}

// TODO Need to distinguish between the config before application of the defaults and after
export interface ApiFunctionConfig {
  updateOnCreate?: <T>(args: any[], newValue: T, cachedValues: T[]) => T[]
  fnName?: string
  operation?: Operation
  invalidates?: string[]
  alwaysGetFreshData?: boolean
  byId?: boolean
  byIds?: boolean
  idFrom?: 'ARGS' | 'ENTITY' | (() => string)
}

export type ApiFunction<R=unknown, A extends any[] = any[]> = {
  (...args:A):Promise<R>
} & ApiFunctionConfig;

export interface EntityApi {
  [apiFnName: string]: ApiFunction
}

export interface Entity {
  name: string
  api: EntityApi
  ttl: number
  invalidates: string[]
  invalidatesOn?: Operation[]
  viewOf?: string
}

export interface View extends Entity{
  viewOf: string
}

export interface EntityConfigs {
  [entityName: string]: Entity
}

export interface CacheValue<T> {
  value: T
  timestamp: number
}

export interface Value {
  __ladda__id:string
}

export interface Plugin {
  // This should be positional parameters
  (pluginParams: PluginParams): PluginDecorator
}

export interface PluginParams {
  addChangeListener: (listener: ChangeListener) => () => ChangeListener[]
  config: Config,
  entityConfigs: EntityConfigs
}

export interface PluginDecorator {
  <T extends ApiFunction>(cfg:{entity: Entity, fn: T}):T
}

export interface Change {
  operation: Operation,
  entity: string,
  apiFn: string,
  values: any[],
  args: any[]
}

export interface ChangeListener {
  (change: Change):void
}
