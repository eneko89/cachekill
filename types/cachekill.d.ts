/**
 * @typedef  {object} SourcePaths
 * @property {string} SourcePaths.path    Original file path: path/file.js
 * @property {string} SourcePaths.newPath Path of the fingerprinted file:
 *                                        path/file-HASH.js.
 */
declare type SourcePaths = {
    path: string;
    newPath: string;
};
/**
 * @typedef  {object} Result
 * @property {SourcePaths[]} sourcePaths   Paths of processed sources files.
 * @property {string[]}      [targetPaths] Paths of processed target files.
 */
declare type Result = {
    sourcePaths: SourcePaths[];
    targetPaths?: string[];
};
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
export declare function cachekill(sourceFiles: string | string[], targetFiles?: string | string[], hashLength?: number, rename?: boolean, pattern?: string): Promise<Result>;
export {};
