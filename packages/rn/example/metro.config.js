const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const packageRoot = path.resolve(projectRoot, '..');
const workspaceRoot = path.resolve(packageRoot, '../..');
const rnSourceEntry = path.resolve(packageRoot, 'src/index.ts');
const coreSourceEntry = path.resolve(workspaceRoot, 'packages/core/src/index.ts');

/**
 * Resolve this template example against the actual pnpm workspace root.
 * The generated library template expects the library package to own a nested
 * workspace, but this repo keeps all packages in the root pnpm workspace. These
 * explicit folders keep Metro stable after the repository is moved on disk.
 */
const config = getDefaultConfig(projectRoot);

config.watchFolders = Array.from(
  new Set([...(config.watchFolders ?? []), workspaceRoot])
);
config.resolver.nodeModulesPaths = Array.from(
  new Set([
    ...(config.resolver.nodeModulesPaths ?? []),
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(packageRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
  ])
);

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@rn-sane-charts/rn') {
    return { type: 'sourceFile', filePath: rnSourceEntry };
  }
  if (moduleName === '@rn-sane-charts/core') {
    return { type: 'sourceFile', filePath: coreSourceEntry };
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
