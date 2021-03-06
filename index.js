import path from'path';
import glob from 'fast-glob';
import crypto from 'crypto';
import replace from 'replace-in-file';
import { promises as fs } from 'fs';

/**
 * @typedef  {object} SourcePaths
 * @property {string} SourcePaths.path    Original file path: path/file.js
 * @property {string} SourcePaths.newPath Path of the fingerprinted file:
 *                                        path/file-HASH.js.
 */

/**
 * @typedef  {object} SourceBases
 * @property {string} SourceBases.base    Original filename: file.js.
 * @property {string} SourceBases.newBase Name of the fingerprinted file:
 *                                        file-HASH.js.
 */

/**
 * @typedef  {object} Result
 * @property {SourcePaths[]} sourcePaths   Paths of processed sources files.
 * @property {string[]}      [targetPaths] Paths of processed target files.
 */

/**
 * Fingerprints sourceFiles (either creating copies or renaming them) with a md5
 * content hash and replaces references to those files in targetFiles with the
 * new source filenames.
 *
 * @param {stirng[]} sourceFiles                    Paths or globs of files to
 *                                                  fingerprint.
 * @param {string[]} targetFiles                    Paths or globs of files with
 *                                                  references to sourceFiles.
 * @param {number}   [hashLength=32]                Length of the resulting hash
 *                                                  (sliced md5 hash, max 32).
 * @param {boolean}  [rename=false]                 If true, renames source files
 *                                                  instead of generating copies.
 * @param {string}   [pattern='{name}-{hash}{ext}'] Format of the new or renamed
 *                                                  files. It must contain {name},
 *                                                  {hash} and {ext} placeholders.
 * @return {Promise<Result>}                        A relation of the processed
 *                                                  source and target files.
 */
export async function cachekill(sourceFiles, targetFiles, hashLength = 32,
                                rename = false, pattern = '{name}-{hash}{ext}') {
  const sourceBases = [];
  const sourcePaths = [];
  const sources = await glob(sourceFiles);
  const targets = Array.isArray(targetFiles)
                  && targetFiles.length
                  && await glob(targetFiles);

  // Make sure that source files are sorted in a reverse alphabetical order,
  // so files with common filename endings don't get wrongly replaced. E.g.:
  // ['file.js', 'other-file.js'] --> ['other-file.js', 'file.js'].
  sources.sort().reverse();

  for (const filePath of sources) {
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

  if (targets) {
    if (rename) {
      await replaceReferences(sourceBases, targets);
    } else {
      // If files get copied instead of renamed and there are source files
      // that are targets too, we need to update those targets, so we do the
      // filename replacements in the copied files and not in the originals.
      for (const obj of sourcePaths) {
        const index = targets.indexOf(obj.path);
        if (index !== -1) {
          targets[index] = obj.newPath;
        }
      }
    }
  }

  const operation = rename ? fs.rename : fs.copyFile;
  for (const obj of sourcePaths) {
    await operation(obj.path, obj.newPath);
  }

  // If files got copied instead of renamed, replacement of references
  // must be done after generating the copies, not in the originals.
  if (targets && !rename) {
    await replaceReferences(sourceBases, targets);
  }

  return { sourcePaths, targetPaths: targets || null };
}

/**
 * Replaces the old file bases with the new ones in target files.
 *
 * @param {SourceBases[]} sourceBases New and old file bases.
 * @param {string[]}      targets     Paths to target files.
 */
async function replaceReferences(sourceBases, targets) {
  await replace({
    from: sourceBases.map(obj => obj.base),
    to: sourceBases.map(obj => obj.newBase),
    files: targets
  });
}

/**
 * Generates a md5 hash of the file in filePath.
 *
 * @param  {stirng} filePath        Path to the file to process.
 * @param  {number} [hashLength=32] Length of the resulting hash.
 * @return {Promise<string>}        Hash in hex notation.
 */
async function getHash(filePath, hashLength = 32) {
  const hash = crypto.createHash('md5');
  hash.update(await fs.readFile(filePath));
  return hash.digest('hex').slice(0, hashLength);
}
