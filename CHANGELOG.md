# Changelog

All notable changes to this project will be documented in this file.

This project adheres to [Semantic Versioning](https://semver.org).

## v3.0.0 (2021-03-24)

- Gets CJS module support back through conditional exports.
  - Since v2.0.0, only ESM was supported.
  - Both ESM and CJS are supported now.
- Adds TypeScript and TypeScript declarations.
- Fixes bug introduced in v2.3.0 when `target` option was made optional.
  - Passing a single strings was ignored, only arrays were being accepted.
  - Only the exported function was affected, not the CLI.

## v2.3.0 (2021-03-07)

- Makes --target files optional, both in CLI and the exported function.

## v2.2.0 (2021-03-04)

- Exports a `cachekill` function to enable programmatic usage in addition to CLI.

## v2.1.0 (2021-02-26)

- Adds a new --pattern argument to specify the format of the fingerprinted filename.

## v2.0.0 (2021-02-18)

- Breaking change: Node >= 14.8.0 is required from now on.
  - Uses the new ECMAScript module syntax (`import`/`export`) instead of `require()`.
  - Uses top level await statements.

## v1.1.0 (2021-02-17)

- Added logging the execution time to the console output.

## v1.0.0 (2021-01-19)

- First stable release.
- Fixes bugs and improves documentation.

## v0.1.0 (2021-01-18)

- First working version.
