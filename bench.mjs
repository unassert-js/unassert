import { runBenchmark } from '@twada/benchmark-commits';
import { parse } from 'acorn';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const __dirname = dirname(fileURLToPath(import.meta.url));
const targetCode = readFileSync(join(__dirname, 'node_modules', 'rimraf', 'rimraf.js'));

const commits = [
  'v1.6.0',
  'master'
];

runBenchmark(commits, async ({ suite, spec, dir }) => {
  let unassertAst;
  if (spec.git === 'v1.6.0') {
    unassertAst = (await import(pathToFileURL(`${dir}/index.js`))).default;
  } else if (spec.git === 'master') {
    unassertAst = (await import(pathToFileURL(`${dir}/src/index.mjs`))).unassertAst;
  } else {
    assert.fail('cannot be here');
  }
  return () => {
    const ast = parse(targetCode, { ecmaVersion: '2022' });
    const modifiedAst = unassertAst(ast);
    assert(modifiedAst);
  };
}).then((suite) => {
  console.log('FINISHED');
});
