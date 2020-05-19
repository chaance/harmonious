import { createConfigItem } from '@babel/core';
import { merge } from 'lodash';
import babelPlugin from 'rollup-plugin-babel';

export const plugin = babelPlugin.custom(() => ({
  // Passed the plugin options.
  options({ custom: customOptions, ...pluginOptions }: any) {
    return {
      // Pull out any custom options that the plugin might have.
      customOptions,

      // Pass the options back with the two custom options removed.
      pluginOptions,
    };
  },
  config(config: any, { customOptions }: any) {
    const defaultPlugins = createConfigItems('plugin', [
      { name: 'babel-plugin-annotate-pure-calls' },
      { name: 'babel-plugin-dev-expression' },
      {
        name: '@babel/plugin-proposal-class-properties',
        loose: true,
      },
      { name: '@babel/plugin-proposal-optional-chaining' },
      { name: '@babel/plugin-proposal-nullish-coalescing-operator' },
      { name: 'babel-plugin-macros' },
    ]);

    const babelOptions = config.options || {};
    babelOptions.presets = babelOptions.presets || [];

    const defaultPresets = createConfigItems('preset', [
      {
        name: '@babel/preset-env',
        targets: customOptions.targets,
        modules: false,
        loose: true,
        exclude: ['transform-async-to-generator', 'transform-regenerator'],
      },
    ]);

    babelOptions.presets = mergeConfigItems(
      'preset',
      defaultPresets,
      babelOptions.presets || []
    );

    // Merge babelrc & our plugins together
    babelOptions.plugins = mergeConfigItems(
      'plugin',
      defaultPlugins,
      babelOptions.plugins || []
    );

    return babelOptions;
  },
}));

export default plugin;

function createConfigItems(type: any, items: any[]) {
  return items.map(({ name, ...options }) => {
    return createConfigItem([require.resolve(name), options], { type });
  });
}

function mergeConfigItems(type: any, ...configItemsToMerge: any[]) {
  const mergedItems: any[] = [];

  configItemsToMerge.forEach((configItemToMerge) => {
    configItemToMerge.forEach((item: any) => {
      const itemToMergeWithIndex = mergedItems.findIndex(
        (mergedItem) => mergedItem.file.resolved === item.file.resolved
      );

      if (itemToMergeWithIndex === -1) {
        mergedItems.push(item);
        return;
      }

      mergedItems[itemToMergeWithIndex] = createConfigItem(
        [
          mergedItems[itemToMergeWithIndex].file.resolved,
          merge(mergedItems[itemToMergeWithIndex].options, item.options),
        ],
        {
          type,
        }
      );
    });
  });

  return mergedItems;
}
