#!/usr/bin/env node

import path from'path';
import crypto from 'crypto';
import glob from 'fast-glob';
import program from 'commander';
import replace from 'replace-in-file';
import { promises as fs } from 'fs';
import { performance } from 'perf_hooks';

const startTime = performance.now();

program
  .version('2.1.0', '-v, --version', 'Outputs the current version number')
  .requiredOption('-s, --source <files...>', 'Source file(s); a fingerprinted copy will be generated for each of them')
  .requiredOption('-t, --target <files...>', 'Target file(s); files with references to source files to be replaced')
  .option('-l, --length <length>', 'Length of the fingerprint (between 1-32); longer means less colisions (defaults to 32)')
  .option('-p, --pattern <pattern>', 'Pattern for the fingerprinted filenames; defaults to {name}-{hash}{ext}')
  .option('-r, --rename', 'Rename source files with the fingerprint instead of generating copies; ignores')
  .option('-q, --quiet', 'Supresses console output')
  .helpOption('-h, --help', 'Displays usage information')
  .parse(process.argv)

const options = program.opts();
const log = options.quiet ? () => {} : console.log;

cachekill(
  await glob(options.source),
  await glob(options.target),
  options.length,
  options.rename,
  options.pattern
);

/**
 * Fingerprints sourceFiles (either creating copies or renaming them) with a md5
 * content hash and replaces references to those files in targetFiles with the
 * new source filenames.
 *
 * @param {stirng[]} sourceFiles                    Files to fingerprint.
 * @param {string[]} targetFiles                    Files with references to
 *                                                  sourceFiles to replace.
 * @param {number}   [hashLength=32]                Length of the resulting hash
 *                                                  (sliced md5 hash, max 32).
 * @param {boolean}  [rename=false]                 If true, renames source files
 *                                                  instead of generating copies.
 * @param {string}   [pattern='{name}-{hash}{ext}'] Format of the new or renamed
 *                                                  files. It must contain {name},
 *                                                  {hash} and {ext} placeholders.
 */
async function cachekill(sourceFiles, targetFiles, hashLength = 32,
                         rename = false, pattern = '{name}-{hash}{ext}') {
  const sourceBases = [];
  const sourcePaths = [];
  const operation = rename ? fs.rename : fs.copyFile;

  // Make sure that sourceFiles are sorted in a reverse alphabetical order,
  // so files with common filename endings don't get wrongly replaced. E.g.:
  // ['file.js', 'other-file.js'] --> ['other-file.js', 'file.js'].
  sourceFiles.sort().reverse();

  for (const filePath of sourceFiles) {
    const hash = await getHash(filePath, hashLength);

    const parsedPath = path.parse(filePath);
    const newBase = pattern
      .replace('{name}', parsedPath.name)
      .replace('{hash}', hash)
      .replace('{ext}', parsedPath.ext);
    const newPath = `${parsedPath.dir}${path.sep}${newBase}`;

    sourceBases.push({ newBase, base: parsedPath.base });
    sourcePaths.push({ newPath, path: filePath });
  }

  if (rename) {
    await replaceReferences(sourceBases, targetFiles);
  } else {
    // If files get copied instead or renamed and there are source files that
    // are targets too, we need to update those targets, so we do the filename
    // replacements in the copied files and not in the original ones.
    for (const obj of sourcePaths) {
      const index = targetFiles.indexOf(obj.path);
      if (index !== -1) {
        targetFiles[index] = obj.newPath;
      }
    }
  }

  for (const obj of sourcePaths) {
    await operation(obj.path, obj.newPath);
    log(rename ? 'renamed:' : 'copied:', obj.path, '-->', obj.newPath);
  }

  if (!rename) {
    await replaceReferences(sourceBases, targetFiles);
  }

  const elapsedTime = Math.round(performance.now() - startTime);
  log(`${targetFiles.length} target file(s) updated in ${elapsedTime}ms`);
}

/**
 * Replaces the old file bases with the new ones in targetFiles.
 *
 * @param {Object[]} sourceBases           New and old and file bases.
 * @param {string}   sourceBases[].base    Old file base, e.g., name.js.
 * @param {string}   sourceBases[].newBase New file base, e.g., name-HASH.js.
 * @param {string[]} targetFiles           Target files to update.
 */
async function replaceReferences(sourceBases, targetFiles) {
  await replace({
    from: sourceBases.map(obj => obj.base),
    to: sourceBases.map(obj => obj.newBase),
    files: targetFiles
  });
}

/**
 * Generates a md5 hash of the file in filePath.
 *
 * @param  {stirng} filePath        Path to the file to process.
 * @param  {number} [hashLength=32] Length of the resulting hash.
 * @return {string}                 Hash in hex notation.
 */
async function getHash(filePath, hashLength = 32) {
  const hash = crypto.createHash('md5');
  hash.update(await fs.readFile(filePath));
  return hash.digest('hex').slice(0, hashLength);
}
