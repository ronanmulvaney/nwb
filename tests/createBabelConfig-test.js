// @flow
import path from 'path'

import expect from 'expect'

import createBabelConfig from '../src/createBabelConfig'

let babelRuntimePath = path.dirname(require.resolve('@babel/runtime/package'))

let DEFAULT_RUNTIME_CONFIG =
  [require.resolve('@babel/plugin-transform-runtime'), {
    helpers: false,
    polyfill: false,
    regenerator: true,
    moduleName: babelRuntimePath,
    useESModules: true,
  }]

describe('createBabelConfig()', () => {
  context('without any build or user config', () => {
    it('generates default Babel config', () => {
      expect(createBabelConfig()).toEqual({
        presets: [
          [require.resolve('@babel/preset-env'), {loose: true, modules: false}],
          [require.resolve('@babel/preset-stage-2'), {decoratorsLegacy: true, useBuiltIns: true}],
        ],
        plugins: [
          DEFAULT_RUNTIME_CONFIG,
          require.resolve('@babel/plugin-syntax-dynamic-import'),
        ]
      })
    })
  })

  context('with build config', () => {
    it('generates build-configured Babel config', () => {
      expect(createBabelConfig({
        modules: 'commonjs',
        stage: 0,
      })).toEqual({
        presets: [
          [require.resolve('@babel/preset-env'), {loose: true, modules: 'commonjs'}],
          [require.resolve('@babel/preset-stage-0'), {decoratorsLegacy: true, pipelineProposal: 'minimal', useBuiltIns: true}],
        ],
        plugins: [
          [require.resolve('@babel/plugin-transform-runtime'), {
            helpers: false,
            polyfill: false,
            regenerator: true,
            moduleName: babelRuntimePath,
            useESModules: false,
          }],
          require.resolve('@babel/plugin-syntax-dynamic-import'),
        ],
      })
    })
    it('adds plugins given the "react-prod" preset', () => {
      expect(createBabelConfig({
        presets: ['react-prod'],
      }, {
        stage: false,
      })).toEqual({
        presets: [
          [require.resolve('@babel/preset-env'), {loose: true, modules: false}],
        ],
        plugins: [
          require.resolve('@babel/plugin-transform-react-constant-elements'),
          [require.resolve('babel-plugin-transform-react-remove-prop-types'), {}],
          DEFAULT_RUNTIME_CONFIG,
          require.resolve('@babel/plugin-syntax-dynamic-import'),
        ],
      })
    })
    it('adds the propType removal plugin given removePropTypes config', () => {
      expect(createBabelConfig({
        removePropTypes: true,
      }, {
        stage: false,
      })).toEqual({
        presets: [
          [require.resolve('@babel/preset-env'), {loose: true, modules: false}],
        ],
        plugins: [
          [require.resolve('babel-plugin-transform-react-remove-prop-types'), {}],
          DEFAULT_RUNTIME_CONFIG,
          require.resolve('@babel/plugin-syntax-dynamic-import'),
        ],
      })
    })
    it('prevents moduleName being configured for transform-runtime', () => {
      expect(createBabelConfig({
        setRuntimePath: false,
      })).toEqual({
        presets: [
          [require.resolve('@babel/preset-env'), {loose: true, modules: false}],
          [require.resolve('@babel/preset-stage-2'), {decoratorsLegacy: true, useBuiltIns: true}],
        ],
        plugins: [
          [require.resolve('@babel/plugin-transform-runtime'), {
            helpers: false,
            polyfill: false,
            regenerator: true,
            useESModules: true,
          }],
          require.resolve('@babel/plugin-syntax-dynamic-import'),
        ]
      })
    })
  })

  context('with user config', () => {
    it('generates user-configured Babel config', () => {
      expect(createBabelConfig({}, {
        stage: 0,
        loose: false,
        runtime: true,
        plugins: ['test-plugin'],
        presets: ['test-preset'],
      })).toEqual({
        presets: [
          [require.resolve('@babel/preset-env'), {loose: false, modules: false}],
          [require.resolve('@babel/preset-stage-0'), {decoratorsLegacy: true, pipelineProposal: 'minimal', useBuiltIns: true}],
          'test-preset',
        ],
        plugins: [
          'test-plugin',
          [require.resolve('@babel/plugin-transform-runtime'), {
            moduleName: babelRuntimePath,
          }],
          require.resolve('@babel/plugin-syntax-dynamic-import'),
        ],
      })
    })
    it('chooses runtime transform config', () => {
      ['helpers', 'polyfill'].forEach(runtime => {
        expect(createBabelConfig({}, {
          runtime,
        })).toEqual({
          presets: [
            [require.resolve('@babel/preset-env'), {loose: true, modules: false}],
            [require.resolve('@babel/preset-stage-2'), {decoratorsLegacy: true, useBuiltIns: true}],
          ],
          plugins: [
            [require.resolve('@babel/plugin-transform-runtime'), {
              helpers: false,
              polyfill: false,
              regenerator: true,
              moduleName: babelRuntimePath,
              [runtime]: true,
              useESModules: true,
            }],
            require.resolve('@babel/plugin-syntax-dynamic-import'),
          ]
        })
      })
    })
    it('excludes stage-X preset options when not required', () => {
      expect(createBabelConfig({}, {
        stage: 3,
      })).toEqual({
        presets: [
          [require.resolve('@babel/preset-env'), {loose: true, modules: false}],
          [require.resolve('@babel/preset-stage-3'), {useBuiltIns: true}],
        ],
        plugins: [
          DEFAULT_RUNTIME_CONFIG,
          require.resolve('@babel/plugin-syntax-dynamic-import'),
        ]
      })
    })
  })

  context('with build and user config', () => {
    it('overrides build stage config with user stage config', () => {
      expect(createBabelConfig({stage: 3}, {stage: 1})).toEqual({
        presets: [
          [require.resolve('@babel/preset-env'), {loose: true, modules: false}],
          [require.resolve('@babel/preset-stage-1'), {decoratorsLegacy: true, pipelineProposal: 'minimal', useBuiltIns: true}],
        ],
        plugins: [
          DEFAULT_RUNTIME_CONFIG,
          require.resolve('@babel/plugin-syntax-dynamic-import'),
        ]
      })
    })
    it('cancels default stage config', () => {
      expect(createBabelConfig({}, {stage: false})).toEqual({
        presets: [
          [require.resolve('@babel/preset-env'), {loose: true, modules: false}],
        ],
        plugins: [
          DEFAULT_RUNTIME_CONFIG,
          require.resolve('@babel/plugin-syntax-dynamic-import'),
        ]
      })
    })
    it('cancels default runtime config', () => {
      expect(createBabelConfig({}, {runtime: false})).toEqual({
        presets: [
          [require.resolve('@babel/preset-env'), {loose: true, modules: false}],
          [require.resolve('@babel/preset-stage-2'), {decoratorsLegacy: true, useBuiltIns: true}],
        ],
        plugins: [
          require.resolve('@babel/plugin-syntax-dynamic-import'),
        ]
      })
    })
  })
})
