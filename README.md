# cachekill

Simple command line cache busting tool which fingerprints source files with a md5 content hash (either creating copies or renaming them) and replaces references to those files in target files with the new source filenames.

There were already similar packages out there, but either they weren't actively mantained, they lacked some feature I wanted or weren't as fast as they could be. This tool aims to be fast, concise, written in modern JS and actively mantained.


## Using cachekill

To install it: `npm install cachekill` (requires Node 10.0.0 or higher)

Run `cachekill --help` for usage information.

    Options:
      -v, --version            Outputs the current version number
      -s, --source <files...>  Source file(s); a fingerprinted copy will be generated for each of them
      -t, --target <files...>  Target file(s); files with references to source files to be replaced
      -l, --length <length>    Length of the fingerprint (between 1-32); longer means less colisions (defaults to 32)
      -r, --rename             Rename source files with the fingerprint instead of generating copies; ignores --directory
      -q, --quiet              Supresses console output
      -h, --help               Displays usage information.

Both source and target files suport globbing.


## Examples

Take this folder structure as a starting point:

    ├── assets
    │   ├── img
    │   │   ├── a.jpg
    │   │   └── b.jpg
    │   ├── css
    │   │   └── bundle.min.css
    │   └── js
    │       └── bundle.min.js
    └── index.html

After running `cachekill -s assets/{js,css}/*.min.{js,css} assets/img/*  -t index.html`, you'd have:

    ├── assets
    │   ├── img
    │   │   ├── a.jpg
    │   │   ├── a-HASH.jpg
    │   │   ├── b.jpg
    │   │   └── b-HASH.jpg
    │   ├── css
    │   │   ├── bundle.min.css
    │   │   └── bundle.min-HASH.css
    │   └── js
    │       ├── bundle.min.js
    │       └── bundle.min-HASH.js
    └── index.html

All the occurrences of `a.jpg`, `b.jpg`, `bundle.min.css` and `bundle.min.js` in `index.html` (e.g., src of image and script tags) would've been replaced by `a-HASH.jpg`, `b-HASH.jpg`, `bundle.min-HASH.css` and `bundle.min-HASH.js`

If you run it with `-r` or `--rename` option, files would've been renamed instead of copied:

    ├── assets
    │   ├── img
    │   │   ├── a-HASH.jpg
    │   │   └── b-HASH.jpg
    │   ├── css
    │   │   └── bundle.min-HASH.css
    │   └── js
    │       └── bundle.min-HASH.js
    └── index.html


## License

MIT License (MIT)
