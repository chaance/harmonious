// Forked and simplified from https://github.com/jaredpalmer/tsdx
import { DEFAULT_EXTENSIONS, createConfigItem } from '@babel/core';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import path from 'path';
import { rollup, RollupOptions, OutputOptions } from 'rollup';
import sourceMaps from 'rollup-plugin-sourcemaps';
import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';
import { paths } from './constants';
import {
  createProgressEstimator,
  external,
  normalizeOpts,
  logError,
  cleanDistFolder,
  parseArgs,
} from './utils';
import { ScriptOpts, NormalizedOpts } from './types';
import babel from '@rollup/plugin-babel';
import { getBabelConfig } from './config/babel';
import * as fs from 'fs-extra';

// shebang cache map thing because the transform only gets run once
let shebang: any = {};

export async function createRollupConfig(
  opts: ScriptOpts,
  buildCount: number
): Promise<RollupOptions> {
  const shouldMinify =
    opts.minify !== undefined ? opts.minify : opts.env === 'production';

  const outputName = [
    `${paths.packageDist}/${opts.name}`,
    opts.format,
    opts.format === 'esm' ? '' : opts.env,
    shouldMinify ? 'min' : '',
    'js',
  ]
    .filter(Boolean)
    .join('.');

  let tsconfig: string | undefined;
  let tsconfigJSON;
  try {
    tsconfig = opts.tsconfig || path.join(paths.projectRoot, 'tsconfig.json');
    tsconfigJSON = await fs.readJSON(tsconfig);
  } catch (e) {
    tsconfig = undefined;
  }

  // console.log('👉' + opts.name, [
  //   path.resolve(paths.packageRoot, 'src'),
  //   path.resolve(paths.packageRoot, 'types'),
  //   path.resolve(paths.projectRoot, 'types'),
  //   paths.packageDist,
  // ]);

  return {
    // Tell Rollup the entry point to the package
    input: opts.input,
    // Tell Rollup which packages to ignore
    external: (id: string) => external(id),
    // Establish Rollup output
    output: {
      // Set filenames of the consumer's package
      file: outputName,
      // Pass through the file format
      format: opts.format,
      // Do not let Rollup call Object.freeze() on namespace import objects
      // (i.e. import * as namespaceImportObject from...) that are accessed
      // dynamically.
      freeze: false,
      // Respect tsconfig esModuleInterop when setting __esModule.
      esModule: tsconfigJSON ? tsconfigJSON.esModuleInterop : false,
      name: opts.name,
      sourcemap: true,
      globals: { react: 'React', 'react-native': 'ReactNative' },
      exports: 'named',
    },
    plugins: [
      resolve({
        mainFields: [
          'module',
          'main',
          opts.target !== 'node' ? 'browser' : undefined,
        ].filter(Boolean) as string[],
      }),
      opts.format === 'umd' &&
        commonjs({
          // use a regex to make sure to include eventual hoisted packages
          include: /\/node_modules\//,
        }),
      json(),
      {
        // Custom plugin that removes shebang from code because newer
        // versions of bublé bundle their own private version of `acorn`
        // and I don't know a way to patch in the option `allowHashBang`
        // to acorn. Taken from microbundle.
        // See: https://github.com/Rich-Harris/buble/pull/165
        transform(code: string) {
          let reg = /^#!(.*)/;
          let match = code.match(reg);

          shebang[opts.name] = match ? '#!' + match[1] : '';

          code = code.replace(reg, '');

          return {
            code,
            map: null,
          };
        },
      },
      typescript({
        typescript: require('typescript'),
        cacheRoot: path.join(
          paths.projectCache,
          `build/${opts.name}/${opts.format}`
        ),
        tsconfig,
        tsconfigDefaults: {
          exclude: [
            '**/*.spec.ts',
            '**/*.test.ts',
            '**/*.spec.tsx',
            '**/*.test.tsx',
            'node_modules',
            'bower_components',
            'jspm_packages',
            paths.packageDist,
          ],
        },
        tsconfigOverride: {
          allowJs: true,
          include: [
            path.resolve(paths.packageRoot, 'src'),
            path.resolve(paths.packageRoot, 'types'),
            path.resolve(paths.projectRoot, 'types'),
          ],
          compilerOptions: {
            outDir: paths.packageDist,

            // We run multiple builds for each package, but we only need to
            // output type declarations once.
            ...(buildCount > 0
              ? { declaration: false, declarationMap: false }
              : {}),
          },
        },
        check: !opts.transpileOnly,
      }),
      babel({
        babelHelpers: 'bundled',
        extensions: [...DEFAULT_EXTENSIONS, 'ts', 'tsx'],
        passPerPreset: true,
        ...getBabelConfig({
          targets: opts.target === 'node' ? { node: '8' } : undefined,
          cacheConfigItems: true,
        }),
      }),
      opts.env !== undefined &&
        replace({
          'process.env.NODE_ENV': JSON.stringify(opts.env),
        }),
      sourceMaps(),
      shouldMinify &&
        terser({
          output: { comments: false },
          compress: {
            keep_infinity: true,
            pure_getters: true,
            passes: 10,
          },
          ecma: 5,
          toplevel: opts.format === 'cjs',
          warnings: true,
        }),
    ],
  };
}

async function build() {
  const opts = await normalizeOpts(parseArgs());
  const buildConfigs = await createBuildConfigs(opts);

  await cleanDistFolder();

  const logger = await createProgressEstimator();
  const promise = writeCjsEntryFile(opts.name).catch(logError);

  logger(promise, 'Creating entry file');

  try {
    const promise = Promise.all(
      buildConfigs.map(async (inputOptions) => {
        let bundle = await rollup(inputOptions);
        await bundle.write(inputOptions.output as OutputOptions);
      })
    );
    logger(promise, 'Building modules');
    await promise;

    // The typescript rollup plugin let's tsc handle dumping the declaration
    // file. Ocassionally its methods for determining where to dump it
    // results in it ending up in a sub-directory rather than adjacent to
    // the bundled code, which we don't want. Unclear exactly why, but this
    // script moves it back after rollup is done.
    // https://github.com/ezolenko/rollup-plugin-typescript2/issues/136
    await moveDeclarationFileToDistRoot(opts.name);
  } catch (error) {
    logError(error);
    process.exit(1);
  }
}

build();

////////////////////////////////////////////////////////////////////////////////

export function writeCjsEntryFile(name: string) {
  const contents = `'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./${name}.cjs.production.min.js');
} else {
  module.exports = require('./${name}.cjs.development.js');
}`;
  return fs.outputFile(path.join(paths.packageDist, 'index.js'), contents);
}

export async function createBuildConfigs(
  opts: NormalizedOpts
): Promise<RollupOptions[]> {
  const allInputs = opts.input.flatMap((input: string) =>
    createAllFormats(opts, input).map((options: ScriptOpts, index: number) => ({
      ...options,
      // We want to know if this is the first run for each entryfile
      // for certain plugins (e.g. css)
      writeMeta: index === 0,
    }))
  );

  return await Promise.all(
    allInputs.map(async (options: ScriptOpts, index) => {
      return await createRollupConfig(options, index);
    })
  );
}

function createAllFormats(
  opts: NormalizedOpts,
  input: string
): [ScriptOpts, ...ScriptOpts[]] {
  return [
    {
      ...opts,
      format: 'cjs',
      env: 'development',
      input,
    },
    {
      ...opts,
      format: 'cjs',
      env: 'production',
      input,
    },
    {
      ...opts,
      format: 'esm',
      env: 'development',
      input,
    },
    {
      ...opts,
      format: 'esm',
      env: 'production',
      input,
    },
  ].filter(Boolean) as [ScriptOpts, ...ScriptOpts[]];
}

async function cleanEmptyFoldersRecursively(dir: string) {
  // lstat does not follow symlinks
  let fileStats = await fs.lstat(dir);
  if (!fileStats.isDirectory()) {
    return;
  }
  let fileNames = await fs.readdir(dir);
  if (fileNames.length) {
    let recursiveRemovalPromises = fileNames.map((fileName) =>
      cleanEmptyFoldersRecursively(path.join(dir, fileName))
    );
    await Promise.all(recursiveRemovalPromises);
    fileNames = await fs.readdir(dir);
  }

  if (!fileNames.length) {
    await fs.rmdir(dir);
  }
}

async function moveDeclarationFileToDistRoot(packageName: string) {
  let misplacedDeclarationFile = path.resolve(
    paths.packageDist,
    `${packageName}/src/index.d.ts`
  );
  if (fs.existsSync(misplacedDeclarationFile)) {
    await fs.move(
      misplacedDeclarationFile,
      path.resolve(paths.packageDist, 'index.d.ts')
    );

    // Clean up any empty directories left behind
    await cleanEmptyFoldersRecursively(path.resolve(paths.packageDist));
  }
}
