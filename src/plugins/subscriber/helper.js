
const getOrCreateContainer = (type, relationships) => {
  let container = relationships[type];
  if (!container) {
    // eslint-disable-next-line no-multi-assign
    container = relationships[type] = { views: [], parents: [], invalidatedBy: [] };
  }
  return container;
};

const getParentViews = (configs, type, res = []) => {
  const config = configs[type];
  if (config.viewOf) {
    const parent = config.viewOf;
    return getParentViews(configs, parent, [...res, parent]);
  }
  return res;
};

const analyzeViews = (configs, type, rels) => {
  const container = getOrCreateContainer(type, rels);
  const parents = getParentViews(configs, type);
  container.parents = [...container.parents, ...parents];
  parents.forEach((parent) => {
    getOrCreateContainer(parent, rels).views.push(type);
  });
  return rels;
};

const analyzeInvalidations = (configs, rels) => {
  Object.keys(rels).forEach((type) => {
    const invalidates = configs[type].invalidates || [];
    const rel = rels[type];
    invalidates.forEach((invalidatedType) => {
      rels[invalidatedType].invalidatedBy = [...rel.parents, type, ...rel.views];
    });
  });
  return rels;
};

export const analyzeEntityRelationships = (entityConfigs) => {
  const relationships = Object.keys(entityConfigs).reduce((rels, type) => {
    return analyzeViews(entityConfigs, type, rels);
  }, {});
  return analyzeInvalidations(entityConfigs, relationships);
};

