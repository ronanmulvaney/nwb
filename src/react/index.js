// @flow
import path from 'path'

import {modulePath} from '../utils'

function getBaseConfig(): Object {
  return {
    babel: {
      presets: [
        [require.resolve('@babel/preset-react'), {
          development: process.env.NODE_ENV !== 'production'
        }]
      ]
    },
  }
}

function getBaseDependencies() {
  return ['react', 'react-dom']
}

function getBuildConfig(args, options: {useModulePath?: boolean} = {}) {
  let config = getBaseConfig()

  if (process.env.NODE_ENV === 'production') {
    // User-configurable, so handled by createBabelConfig
    config.babel.presets.push('react-prod')
  }

  let aliasPath = options.useModulePath ? modulePath : (alias) => alias

  if (args.inferno || args['inferno-compat']) {
    config.resolve = {
      alias: {
        'react': aliasPath('inferno-compat'),
        'react-dom': aliasPath('inferno-compat'),
      },
    }
  }
  else if (args.preact || args['preact-compat']) {
    // Use the path to preact-compat.js, as using the path to the preact-compat
    // module picks up the "module" build, which prevents hijacking the render()
    // function in the render shim.
    let preactCompathPath = path.join(aliasPath('preact-compat'), 'dist/preact-compat')
    config.resolve = {
      alias: {
        'react': preactCompathPath,
        'react-dom': preactCompathPath,
        'create-react-class': 'preact-compat/lib/create-react-class',
      },
    }
  }

  return config
}

class ReactConfig {
  _args: Object;

  constructor(args: Object) {
    this._args = args
  }

  _getCompatDependencies() {
    if (this._args.inferno || this._args['inferno-compat']) {
      return ['inferno', 'inferno-compat', 'inferno-clone-vnode', 'inferno-create-class', 'inferno-create-element']
    }
    else if (this._args.preact || this._args['preact-compat']) {
      return ['preact', 'preact-compat']
    }
    return []
  }

  _getCompatName() {
    if (this._args.inferno || this._args['inferno-compat']) {
      return 'Inferno (React compat)'
    }
    else if (this._args.preact || this._args['preact-compat']) {
      return 'Preact (React compat)'
    }
    return 'React'
  }

  _getQuickConfig() {
    return {
      defaultTitle: `${this.getName()} App`,
      renderShim: require.resolve('./renderShim'),
      renderShimAliases: {
        'react': modulePath('react'),
        'react-dom': modulePath('react-dom'),
      },
    }
  }

  getName = () => {
    if (/^build/.test(this._args._[0])) {
      return this._getCompatName()
    }
    return 'React'
  }

  getProjectDefaults() {
    return {}
  }

  getProjectDependencies() {
    return getBaseDependencies()
  }

  getProjectQuestions() {
    return null
  }

  getBuildDependencies = () => {
    return this._getCompatDependencies()
  }

  getBuildConfig = () => {
    return getBuildConfig(this._args)
  }

  // TODO Document configuring your main app module for HMR if it differs from src/App.js
  getServeConfig = (hotLoaderModuleTest : RegExp = /[/\\]src[/\\]App.js$/) => {
    let config = getBaseConfig()

    if (this._args.hmr !== false && this._args.hmre !== false) {
      // Use react-hot-loader to handle HMR while keeping component state
      config.babel.plugins = [require.resolve('react-hot-loader/babel')]
      // Ensure injected react-hot-loader/patch can be resolved
      config.resolve = {
        alias: {
          react: modulePath('react'),
          'react-hot-loader': path.dirname(require.resolve('react-hot-loader/package'))
        }
      }
      // Apply react-hot-loader to the module containing the main app component
      config.rules = {
        extra: [{
          id: 'react-hot-loader',
          test: hotLoaderModuleTest,
          loader: require.resolve('react-hot-loader-loader'),
        }]
      }
    }

    return config
  }

  getQuickDependencies = () => {
    let deps = getBaseDependencies()
    if (/^build/.test(this._args._[0])) {
      deps = deps.concat(this._getCompatDependencies())
    }
    return deps
  }

  getQuickBuildConfig = () => {
    return {
      commandConfig: getBuildConfig(this._args, {useModulePath: true}),
      ...this._getQuickConfig(),
    }
  }

  getQuickServeConfig = () => {
    return {
      // Apply react-hot-loader to the shim module importing the entry component
      commandConfig: this.getServeConfig(/[/\\]nwb[/\\]lib[/\\]react[/\\]importModule\.js$/),
      ...this._getQuickConfig(),
    }
  }

  getKarmaTestConfig() {
    return getBaseConfig()
  }
}

export default (args: Object) => new ReactConfig(args)
