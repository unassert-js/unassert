import { promises as fs } from 'fs';
import { babel } from '@rollup/plugin-babel';
import copy from 'rollup-plugin-copy';
import cleanup from 'rollup-plugin-cleanup';

const srcDir = 'src';
const destDir = 'dist';

const srcFiles = await fs.readdir(new URL(`./${srcDir}`, import.meta.url));

const commonOutput = {
  dir: destDir,
  // create a module for each module in the input, instead of trying to chunk them together.
  preserveModules: true,
  generatedCode: {
    // use const instead of var when creating statements
    constBindings: true,
  },
  banner: `/**
 * unassert
 *   Encourages programming with assertions by providing tools to compile them away.
 *
 * https://github.com/unassert-js/unassert
 *
 * Copyright (c) 2015-${new Date().getFullYear()} Takuto Wada
 * Licensed under the MIT license.
 *   https://github.com/unassert-js/unassert/blob/master/LICENSE
 */`,
}

export default {
  input: srcFiles
    .filter((file) => file.endsWith('.mjs'))
    .map((x) => `${srcDir}/${x}`),
  external: [/@babel\/runtime/, "estraverse", "magic-string"],
  output: [
    {
      ...commonOutput,
      format: 'cjs',
      entryFileNames: '[name].cjs',
      // do not add `Object.defineProperty(exports, '__esModule', { value: true })`
      esModule: false,
    },
    {
      ...commonOutput,
      format: 'esm',
      entryFileNames: '[name].mjs',
    },
  ],
  plugins: [
    babel({
      presets: ['@babel/preset-env'],
      plugins: ['@babel/plugin-transform-runtime'],
      targets: 'node 14.15.0',
      babelHelpers: 'runtime', // None should be generated. If in future they are, we need to add "@babel/runtime" as a dependency.
    }),
    cleanup(),
    copy({
      targets: [
        { src: `${srcDir}/index.d.mts`, dest: destDir },
        { src: `${srcDir}/index.d.mts`, dest: destDir, rename: 'index.d.cts' },
      ],
    }),
  ],
};
