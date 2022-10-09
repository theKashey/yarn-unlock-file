#!/usr/bin/env node

import * as minimatch from 'minimatch';
import sade from 'sade';

import { runner } from './cli-runner';
import { reduceDependencies } from './dependency-traverse';
import {
  getAllDirectDependencies,
  getDependenciesFor,
  getDirectDependencies,
  getDirectDevDependencies,
} from './get-dependencies';
import { getPackageLevels } from './levels';
import { getPackageDatabase } from './package-utils';

const program = sade('yarn-unlock-file', false);

program.version(require('../package.json').version);

program
  .example('all # unlocks indirect dependencies of dependencies')
  .example('dev -u @material # unlocks all dependencies with a given prefix found across dev dependencies')
  .example('direct -o @material # unlocks only indirect dependencies with a given prefix')
  .example('all --min-level=2 # unlocks indirect dependencies of dependencies of dependencies');

program
  .command('all', 'keeps only direct package dependencies')
  .option('-o, --only <glob>', 'updates ONLY dependencies matching mask')
  .option('--min-level <number>', 'updates ONLY dependencies below given level', 1)
  .option('--dry-run', 'returns a report without updating lock file')
  .example('all # unlocks all indirect dependencies')
  .action((options) => runner('all', () => getAllDirectDependencies(), options));

program
  .command('dev', 'unlock only dependencies of dev dependencies')
  .option('-o, --only <glob>', 'updates ONLY dependencies matching mask')
  .option('--min-level <number>', 'updates ONLY dependencies below given level', 2)
  .option('--dry-run', 'returns a report without updating lock file')
  .example('dev # unlocks indirect dependencies of dev dependencies')
  .action((options) =>
    runner(
      'dev',
      (database) => reduceDependencies(database, getAllDirectDependencies(), getDirectDevDependencies()),
      options
    )
  );

program
  .command('direct', 'unlock only dependencies of direct dependencies')
  .option('-o, --only <glob>', 'updates ONLY dependencies matching mask')
  .option('--min-level <number>', 'updates ONLY dependencies below given level', 2)
  .option('--dry-run', 'returns a report without updating lock file')
  .example('direct # unlocks indirect dependencies of direct dependencies')
  .action((options) =>
    runner(
      'direct',
      (database) => reduceDependencies(database, getAllDirectDependencies(), getDirectDependencies()),
      options
    )
  );

program
  .command('matching <glob>', 'unlock dependencies from a parent matching given glob')
  // .option('--keep [mode]', 'keep [all, dev, direct] dependencies', 'all')
  .option('--min-level <number>', 'updates ONLY dependencies below given level')
  .option('--dry-run', 'returns a report without updating lock file')
  .example('matching react # unlocks indirect dependencies react')
  .example('matching material/* # unlocks indirect dependencies of any package starting from material-ui')
  .example('matching react-redux --min-level=2 # unlocks dependencies of dependencies react-redux')
  .action((glob, options) =>
    runner(
      'direct',
      (database) => {
        const topDeps = Array.from(database.keys()).filter(minimatch.filter(glob));

        if (topDeps.length) {
          console.log('matched:', topDeps.join(', '));
        } else {
          console.error('nothing matched', glob);
        }

        return reduceDependencies(database, getDependenciesFor(options.keep || 'all'), new Set(topDeps), {
          keepOriginals: true,
        });
      },
      options
    )
  );

program
  .command('levels <mode>', "lists dependencies by level; mode - one of 'all, dev, direct' or packageName")
  .option('-l, --level', 'specify level to report')
  .example('levels direct # display dependencies levels for own dependencies')
  .example('levels sade # display dependencies levels of a given package')
  .action(async (mode, { level }) => {
    const levels = await getPackageLevels(
      getPackageDatabase(),
      ['all', 'dev', 'direct'].includes(mode) ? getDependenciesFor(mode) : new Set([])
    );

    if (level) {
      console.log(levels[level + 1]);
    } else {
      levels.forEach((level, index) => console.log(index + 1, '\t', [...level].join(', ')));
    }
  });

program.parse(process.argv);
