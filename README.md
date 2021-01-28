# cachekill

Simple command line cache busting tool which fingerprints source files with a md5 content hash (either creating copies or renaming them) and replaces references to those files in target files with the new filenames.

There were already similar packages out there, but either they weren't actively mantained or they lacked some feature I wanted. This one is:
- Fast, by doing all the IO asyncrhonously.
- Modern, by handling promises using async await.
- Up to date with the few dependencies it has.
- Compatible with globs.
- Actively mantained.

![Last Version](https://img.shields.io/github/package-json/v/eneko89/cachekill?label=last%20version&style=for-the-badge)
![Lines of code](https://img.shields.io/tokei/lines/github/eneko89/cachekill?style=for-the-badge)

![Npm downloads](https://img.shields.io/npm/dw/cachekill?label=npm%20downloads&style=for-the-badge)
![Maintenance](https://img.shields.io/maintenance/yes/2021?style=for-the-badge)

## Using cachekill

To install it: `npm install cachekill` (requires Node 10.0.0 or higher)

Run `cachekill --help` for usage information.

    Options:
      -v, --version            Outputs the current version number
      -s, --source <files...>  Source file(s); a fingerprinted copy will be generated for each of them
      -t, --target <files...>  Target file(s); files with references to source files to be replaced
      -l, --length <length>    Length of the fingerprint (between 1-32); longer means less collisions (defaults to 32)
      -r, --rename             Rename source files with the fingerprint instead of generating copies
      -q, --quiet              Supresses console output
      -h, --help               Displays usage information

Both source and target can be a list or files or globs. It will work even in platforms and shells that don't support globbing (like Windows), because `cachekill` has support for expanding globs itself. Just make sure you quote the arguments so the glob expansion will not depend on the shell you run the command.


## Examples

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

All files not ending with `.html` have been fingerprinted and all the occurrences of those in every `.js`, `.css` and `.html` files replaced by the new filenames.

If you run it with `-r` or `--rename` option, files would've been renamed instead of copied:

    └── assets
        ├── img
        │   ├── a-HASH.jpg
        │   └── b-HASH.jpg
        ├── css
        │   └── bundle.min-HASH.css
        ├── js
        │   └── bundle.min-HASH.js
        └── index.html


## License

MIT License (MIT)
