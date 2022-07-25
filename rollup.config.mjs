import { promises as fs } from 'fs';

const srcDir = 'src';
const destDir = 'dist';

const srcFiles = await fs.readdir(new URL(`./${srcDir}`, import.meta.url));

export default {
  input: srcFiles.filter((file) => file.endsWith('.mjs')).map((x) => `${srcDir}/${x}`),
  output: {
    dir: destDir,
    format: 'cjs',
    entryFileNames: '[name].cjs',
    // create a module for each module in the input, instead of trying to chunk them together.
    preserveModules: true,
    // do not add `Object.defineProperty(exports, '__esModule', { value: true })`
    esModule: false,
    // use const instead of var when creating statements
    preferConst: true,
    // do not add _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }
    interop: false,
  }
};
