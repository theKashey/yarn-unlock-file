# yarn-unlock file

because there is _yarn.lock_ you want to _unlock_ - [Yarnlocking🔓 your dependencies](https://dev.to/thekashey/yarnlocking-your-dependencies-59n0)

---

## Problem statement

When you install a package information about the particular versions used is saved into a `lock file`.
This makes future installs deterministic, as it will always install the same package versions.

However, this also creates a problem - first install and later update can work differently.

- update: Basically if you already have any package matching allowed range of semver - it will be used.
- first install: latest version of packages matching sem-version will be installed

This leads into a problem when package authors might need _cascade updates_ and package consumers might be left
unprotected from being locked into obsolete versions of transitive dependnecies.

This is discussed as a feature request in yarnpkg/yarn#4986 (opened 11/2017).

> when you install a package A that has a dependency on some other package B,
> and B fixes a security issue and creates a new version for the fix,
> yarn upgrade is not going to update B for you
> until A releases a newer version and you upgrade to it.
> As of writing, there is no direct way to make yarn upgrade indirect dependencies as well.

The purpose of this package is to provide a way to "unlock" indirect dependencies without wiping the whole yarn.lock

> working for any yarn-based project including monorepos

# Usage

Yarn.lock has its purpose and updating everything at once can lead to hard-to-debug and correct failures.
This is why this package provides multiple options to handle different needs

## Unlock dev dependencies

This command will update transitive dependencies created by `devDependencies` only.
This is a _safe_ command and you should consider running it on schedule

```bash
npx yarn-unlock-file dev
yarn # dont forget to regenerate lock file
```

#### Understanding the change

```bash
npx yarn-unlock-file dev --dry-run
# will diplay information about packages to be unlocked
npx yarn-unlock-file dev --min-level 1
# will unlock direct dev dependencies (level 1)
```

## Unlock direct dependencies

The sibling command will update all direct dependencies. The ones used for the actual end artifact.
With the proper testing in place this can be considered as _safe_ command as well.

```bash
npx yarn-unlock-file direct
yarn # dont forget to regenerate lock file
```

## Unlock all

This is **unsafe** command, as it potentially unlocks too much

```bash
npx yarn-unlock-file all
yarn # dont forget to regenerate lock file
```

## Unlock selective

Unlocks dependencied of a given one (by glob pattern).
But default it will not touch all project dependnecies. Behavior can be controlled via `--keep [all, dev, direct]` flag.

```bash
# update all material-ui deps
npx yarn-unlock-file matching "@material-ui/*"
# and material-ui as well, because it is not a dev dep
npx yarn-unlock-file matching "@material-ui/*" --keep dev
# many react libraries. This will update them to the allowed semver interval
npx yarn-unlock-file matching "react-**"
yarn # dont forget to regenerate lock file
```

## Note

⚠️all commands except `all` have `min-level` option configured to `2` to never affect your direct dependencies.

- Set `--min-level 1` to perform more broad updates
- Set `--min-level [more-than-1]` to perform more secure

# Extra API

Given commands also support a few extra arguments to scope down the update

## --only prefix

the following command will update only material-ui packages

```bash
npx yarn-unlock-file all --only @material
```

## levels

The following command will print dependencies separated into levels buckets

```bash
## prints first-level dependencies
npx yarn-unlock-file levels 1
## prints third-level dependencies
npx yarn-unlock-file levels 3
```

> 💡 Would it be nice to address only specific level of dependencies for unlocking?

# API

This package exposes a low level API as well
But for now - lets keep it undocumented. Use CLI.

# See also

- inspired by https://www.npmjs.com/package/yarn-unlock-indirect-dependencies
- following [ncu](https://github.com/raineorshine/npm-check-updates) ideas

# License

MIT
