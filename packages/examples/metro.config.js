const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')
const rnSourceEntry = path.resolve(workspaceRoot, 'packages/rn/src/index.ts')
const coreSourceEntry = path.resolve(workspaceRoot, 'packages/core/src/index.ts')

const config = getDefaultConfig(projectRoot)

config.watchFolders = Array.from(
  new Set([...(config.watchFolders ?? []), workspaceRoot])
)
config.resolver.nodeModulesPaths = Array.from(
  new Set([
    ...(config.resolver.nodeModulesPaths ?? []),
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules')
  ])
)

/**
 * Development aliasing:
 * Resolve workspace packages to source entrypoints so UI iterations do not
 * require rebuilding `packages/rn/lib` after each TS change.
 */
const defaultResolveRequest = config.resolver.resolveRequest
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@rn-sane-charts/rn') {
    return { type: 'sourceFile', filePath: rnSourceEntry }
  }
  if (moduleName === '@rn-sane-charts/core') {
    return { type: 'sourceFile', filePath: coreSourceEntry }
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform)
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
