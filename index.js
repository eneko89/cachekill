#!/usr/bin/env node

const path = require('path');
const globby = require('globby');
const crypto = require('crypto');
const fs = require('fs').promises;
const program = require('commander');
const replace = require('replace-in-file');


program
  .version('0.1.0', '-v, --version', 'Outputs the current version number')
  .requiredOption('-s, --source <files...>', 'Source file(s); a fingerprinted copy will be generated for each of them')
  .requiredOption('-t, --target <files...>', 'Target file(s); files with references to source files to be replaced')
  .option('-l, --length <length>', 'Length of the fingerprint (between 1-32); longer means less colisions (defaults to 32)')
  .option('-r, --rename', 'Rename source files with the fingerprint instead of generating copies; ignores --directory')
  .option('-q, --quiet', 'Supresses console output')
  .helpOption('-h, --help', 'Displays usage information')
  .parse(process.argv)

const options = program.opts();

if (options.quiet) {
  console.log = () => {};
}

cachekill(
  globby.sync(options.source),
  globby.sync(options.target),
  options.length,
  options.rename
);

async function cachekill(sourceFiles, targetFiles,
                         hashLength = 32, rename = false) {
  let from = [];
  let to = [];

  sourceFiles.sort().reverse();

  for (let filePath of sourceFiles) {
    const hash = await getHash(filePath, hashLength);
    const parsedPath = path.parse(filePath);
    const newBase = `${parsedPath.name}-${hash}${parsedPath.ext}`;
    const newPath = `${parsedPath.dir}${path.sep}${newBase}`;
    const operation = rename ? fs.rename : fs.copyFile;

    await operation(filePath, newPath);
    console.log(rename ? 'renamed:' : 'copied:', filePath, '-->', newPath);

    from.push(parsedPath.base);
    to.push(newBase);
  }

  await replace({ from, to, files: targetFiles });
  console.log(`${targetFiles.length} target file(s) updated`);
}

async function getHash(filePath, hashLength = 32) {
  const hash = crypto.createHash('md5');
  const fileContent = await fs.readFile(filePath);
  hash.update(fileContent);
  return hash.digest('hex').slice(0, hashLength);
}
