# cachekill
![Last Version](https://img.shields.io/github/package-json/v/eneko89/cachekill?style=for-the-badge)
![Lines of code](https://img.shields.io/tokei/lines/github/eneko89/cachekill?style=for-the-badge)
![Npm downloads](https://img.shields.io/npm/dw/cachekill?style=for-the-badge)
![Maintenance](https://img.shields.io/maintenance/yes/2021?style=for-the-badge)

Simple command line cache busting tool which fingerprints source files with a md5 content hash (either creating copies or renaming them) and replaces references to those files in target files with the new filenames.

There were already similar packages out there, but either they weren't actively mantained or they lacked some feature I wanted. This one is:
- Fast, by doing all the IO asyncrhonously.
- Modern, by handling promises using async/await.
- Up to date with the few dependencies it has.
- Compatible with globs.
- Actively mantained.

> :warning:&nbsp; **Warning:** From v2.0.0, cachekill uses ECMAScript module syntax and top level await statements, which are supported unflagged from Node v13.0.0 and v14.8.0 respectively. Upgrade your Node version or stick to v1.1.0 for Node 10.0.0 or higher support.


## Usage through CLI

A local install is enough if you plan to use it within npm scripts:

`npm install cachekill --save-dev` (requires Node 14.8.0 or higher)

Use `npx cachekill` to run it anywere without installing or install it globally with `npm install -g cachekill` if you wish to run it like any other binary in your shell.

Run `cachekill --help` for usage information.

    Options:
      -v, --version            Outputs the current version number
      -s, --source  <files...> Source file(s); a fingerprinted copy will be generated for each of them
      -t, --target  <files...> Target file(s); files with references to source files to be replaced
      -l, --length  <length>   Length of the fingerprint (between 1-32); longer means less collisions (defaults to 32)
      -p, --pattern <pattern>  Pattern for the fingerprinted filenames; defaults to {name}-{hash}{ext}
      -r, --rename             Rename source files with the fingerprint instead of generating copies
      -q, --quiet              Supresses console output
      -h, --help               Displays usage information

Both source and target can be a list of files or globs. It will work even in platforms and shells that don't support globbing (like Windows), because `cachekill` has support for expanding globs itself. Just make sure you quote the arguments so the glob expansion will not depend on the shell you run the command in.

If you use a pattern string to fingerprint source filenames (default one is `{name}-{hash}{ext}`), it must contain `{name}`, `{hash}` and `{ext}` placeholders.


### Examples

Take this folder structure as a starting point:

    └── assets
        ├── img
        │   ├── a.jpg
        │   └── b.jpg
        ├── css
        │   └── bundle.min.css
        ├── js
        │   └── bundle.min.js
        └── index.html

After running `cachekill -s 'assets/**/!(*.html)' -t 'assets/**/*.{js,css,html}'`, you'd have:

    └── assets
        ├── img
        │   ├── a.jpg
        │   ├── a-HASH.jpg
        │   ├── b.jpg
        │   └── b-HASH.jpg
        ├── css
        │   ├── bundle.min.css
        │   └── bundle.min-HASH.css
        ├── js
        │    ├── bundle.min.js
        │    └── bundle.min-HASH.js
        └── index.html

All files not ending with `.html` have been fingerprinted and all the occurrences of those in every `.js`, `.css` and `.html` files replaced by the new filenames. For example, if `bundle.min.css` had a `url('../img/a.jpg')` css rule, now `bundle.min-HASH.css` would have `url('../img/a-HASH.jpg')`.

If you run it with `-r` or `--rename`, files get rewritten instead of copied. Use it with caution, as it is a destructive operation. It's intended to be used with copied files as part of the build process, and not with the original ones:

    └── assets
        ├── img
        │   ├── a-HASH.jpg
        │   └── b-HASH.jpg
        ├── css
        │   └── bundle.min-HASH.css
        ├── js
        │   └── bundle.min-HASH.js
        └── index.html

Simple example of usage as part of the build process with npm scripts:

    "scripts": {
      "build:assets": "copies assets from ./assets to ./dist",
      "build:js": "generates js bundle in ./dist/js",
      "build:css": "generates css bundle in ./dist/css",
    ->"build:fprints": "cachekill -s 'dist/**/!(*.html)' -t 'dist/**/*.{js,css,html}'",
      "build": "rm -rf dist && (npm run build:assets &  npm run build:js & npm run build:css & wait) && npm run build:fprints",
    }


## Usage through API

This package exports a single function named `cachekill` as an ES module.

The equivalent API call for the CLI example above would be:

```javascript
import { cachekill } from 'cachekill';
cachekill('dist/**/!(*.html)', 'dist/**/*.{js,css,html}');
```

This is the signature of the `cachekill` function:

```javascript
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
                                rename = false, pattern = '{name}-{hash}{ext}')
```

Check source code in `index.js` for more details.


## License

MIT License (MIT)
