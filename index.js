#!/usr/bin/env node

const path = require('path');
const globby = require('globby');
const crypto = require('crypto');
const fs = require('fs').promises;
const program = require('commander');
const replace = require('replace-in-file');

program
  .version('1.0.4', '-v, --version', 'Outputs the current version number')
  .requiredOption('-s, --source <files...>', 'Source file(s); a fingerprinted copy will be generated for each of them')
  .requiredOption('-t, --target <files...>', 'Target file(s); files with references to source files to be replaced')
  .option('-l, --length <length>', 'Length of the fingerprint (between 1-32); longer means less colisions (defaults to 32)')
  .option('-r, --rename', 'Rename source files with the fingerprint instead of generating copies; ignores --directory')
  .option('-q, --quiet', 'Supresses console output')
  .helpOption('-h, --help', 'Displays usage information')
  .parse(process.argv)

const options = program.opts();
const log = options.quiet ? () => {} : console.log;

cachekill(
  globby.sync(options.source),
  globby.sync(options.target),
  options.length,
  options.rename
);

/**
 * Fingerprints sourceFiles (either creating copies or renaming them) with a md5
 * content hash and replaces references to those files in targetFiles with the
 * new source filenames.
 *
 * @param {stirng[]} sourceFiles      Files to fingerprint.
 * @param {string[]} targetFiles      Files with references to sourceFiles.
 * @param {number}   [hashLength =32] Length of the resulting hash (sliced md5).
 * @param {boolean}  [rename=false]   Rename instead of copying source files.
 */
async function cachekill(sourceFiles, targetFiles, hashLength = 32, rename = false) {
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
    const newBase = `${parsedPath.name}-${hash}${parsedPath.ext}`;
    const newPath = `${parsedPath.dir}${path.sep}${newBase}`;

    sourceBases.push({ newBase, base: parsedPath.base });
    sourcePaths.push({ newPath, path: filePath });
  }

  if (rename) {
    await replaceReferences(sourceBases, targetFiles);
  } else {
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
}

/**
 * Replaces the old file bases with the new ones in targetFiles.
 *
 * @param {Object[]} sourceBases           New and old and file bases.
 * @param {string}   sourceBases[].base    Old file base, e.g., name.js.
 * @param {string}   sourceBases[].newBase New file base, e.g., name-HASH.js.
 * @param {string[]} targetFiles
 */
async function replaceReferences(sourceBases, targetFiles) {
  await replace({
    from: sourceBases.map(obj => obj.base),
    to: sourceBases.map(obj => obj.newBase),
    files: targetFiles
  });
  log(`${targetFiles.length} target file(s) updated`);
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
