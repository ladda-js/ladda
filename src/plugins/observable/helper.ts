import { Entity, EntityConfigs, View } from '../../types';

export interface Container {
  invalidatedBy: string[]
  views: unknown[]
  parents: unknown[]
}

export interface Relationships {
  [entityName: string]: Container
}

const getOrCreateContainer = (entityName: string, relationships: Relationships) => {
  let container = relationships[entityName];
  if (!container) {
    container = { views: [], parents: [], invalidatedBy: [] };
    relationships[entityName] = container;
  }
  return container;
};

function isView(e: Entity): e is View {
  return 'viewOf' in e;
}

const getParentViews = (
  configs: EntityConfigs,
  entityName: string,
  res: string[] = []
): string[] => {
  const config = configs[entityName];
  if (isView(config) && config.viewOf) {
    const parent = config.viewOf;
    return getParentViews(configs, parent, [...res, parent]);
  }
  return res;
};

const analyzeViews = (configs: EntityConfigs, entityName: string, rels: Relationships) => {
  const container = getOrCreateContainer(entityName, rels);
  const parents = getParentViews(configs, entityName);
  container.parents = [...container.parents, ...parents];
  parents.forEach((parent) => {
    getOrCreateContainer(parent, rels).views.push(entityName);
  });
  return rels;
};

const analyzeInvalidations = (configs: EntityConfigs, rels: Relationships) => {
  Object.keys(rels).forEach((entityName) => {
    const invalidates = configs[entityName].invalidates || [];
    invalidates.forEach((invalidatedEntityName) => {
      rels[invalidatedEntityName].invalidatedBy.push(entityName);
    });
  });
  return rels;
};

export const analyzeEntityRelationships = (entityConfigs: EntityConfigs) => {
  const relationships: Relationships = Object.keys(entityConfigs)
    .reduce((rels, entityName: string) => analyzeViews(entityConfigs, entityName, rels), {});
  return analyzeInvalidations(entityConfigs, relationships);
};
