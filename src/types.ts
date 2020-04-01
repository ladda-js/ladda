/** The global Ladda config */
export interface Config {
  idField: string ;
  useProductionBuild: boolean
}

/** The config a user passes into ladda from the outside into the build method */
export type ExternalConfig = PartialEntityConfigs & {
  __config: Partial<Config>
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

/**
 * Config object for the Api function
 */
export interface PartialApiFunctionConfig {
  updateOnCreate?: <T>(args: any[], newValue: T, cachedValues: T[]) => T[]
  fnName?: string
  operation?: Operation
  invalidates?: string[]
  alwaysGetFreshData?: boolean
  byId?: boolean
  byIds?: boolean
  idFrom?: 'ARGS' | 'ENTITY' | (() => string)
}

/**
 * Config object with defaults applied
 */
export interface ApiFunctionConfig {
  updateOnCreate?: <T>(args: any[], newValue: T, cachedValues: T[]) => T[]
  fnName: string
  operation: Operation
  invalidates: string[]
  alwaysGetFreshData?: boolean
  byId: boolean
  byIds: boolean
  idFrom: 'ARGS' | 'ENTITY' | (() => string)
}

export interface ApiCall<R, A extends any[]> {
  (...args: A):Promise<R>
}

export type PartialApiFunction<R=unknown, A extends any[] = any[]> =
  ApiCall<R, A> & PartialApiFunctionConfig;

export type ApiFunction<R=unknown, A extends any[] = any[]> =
  ApiCall<R, A> & ApiFunctionConfig;

export interface PartialEntityApi {
  [apiFnName: string]: PartialApiFunction
}

export interface EntityApi {
  [apiFnName: string]: ApiFunction
}

/**
 * The required fields as configured by user
 */
export interface PartialEntity {
  name: string
  api: EntityApi
  ttl?: number
  invalidates?: string[]
  invalidatesOn?: Operation[]
  viewOf?: string
}

/**
 * The entity configuration object with defaults applied
 */
export interface Entity extends PartialEntity{
  ttl: number
  invalidates: string[]
  invalidatesOn: Operation[]
  viewOf?: string
}

export interface View extends Entity{
  viewOf: string
}

export interface PartialEntityConfigs {
  [entityName: string]: PartialEntity
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
  <R, A extends any[]>(cfg:{entity: Entity, fn: ApiFunction<R, A>}):ApiCall<R, A>
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
