#!/usr/bin/env node

const startTime = performance.now();

import program from 'commander';
import { cachekill } from './index.js';
import { performance } from 'perf_hooks';

program
  .version('2.2.0', '-v, --version', 'Outputs the current version number')
  .requiredOption('-s, --source <files...>', 'Source file(s); a fingerprinted copy will be generated for each of them')
  .requiredOption('-t, --target <files...>', 'Target file(s); files with references to source files to be replaced')
  .option('-l, --length <length>', 'Length of the fingerprint (between 1-32); longer means less colisions (defaults to 32)')
  .option('-p, --pattern <pattern>', 'Pattern for the fingerprinted filenames; defaults to {name}-{hash}{ext}')
  .option('-r, --rename', 'Rename source files with the fingerprint instead of generating copies; ignores')
  .option('-q, --quiet', 'Supresses console output')
  .helpOption('-h, --help', 'Displays usage information')
  .parse(process.argv)

const opts = program.opts();
const result = await cachekill(
  opts.source,
  opts.target,
  opts.length,
  opts.rename,
  opts.pattern
);

if (!opts.quiet) {
  const operation = opts.rename ? 'renamed:' : 'copied:';
  for (const obj of result.sourcePaths) {
    console.log(operation, obj.path, '-->', obj.newPath);
  }
  const elapsedTime = Math.round(performance.now() - startTime);
  const targetCount = result.targetPaths.length;
  console.log(`${targetCount} target file(s) updated in ${elapsedTime}ms`);
}
