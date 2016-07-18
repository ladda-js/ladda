export function create() {
    return {};
}

export function addEntity(config, entityConfig) {
    config[entityConfig.name] = {
        ...entityConfig
    };
}
