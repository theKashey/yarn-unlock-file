#!/usr/bin/env node

import sade from "sade";
import * as  minimatch from "minimatch";
import {
  getAllDirectDependencies, getDependenciesFor,
  getDirectDependencies,
  getDirectDevDependencies,
} from "./get-dependencies";
import {reduceDeps} from "./dependency-traverse";
import {getPackageLevels} from "./levels";
import {getPackageDatabase} from "./package-utils";
import {runner} from "./cli-runner";

const program = sade("yarn-unlock-file", false);

program
  .version(require("../package.json").version);
program
  .option("-o, --only <glob>", "updates ONLY dependencies matching mask")
  .example('all # unlocks indirect dependencies of dependencies')
  .example('dev -u @material # unlocks all dependencies with a given prefix found across dev dependencies')
  .example('direct -o @material # unlocks only indirect dependencies with a given prefix')

program
  .command("all", "keeps only direct package dependencies")
  .example('all # unlocks all indirect dependencies')
  .action(options => runner('all', () => getAllDirectDependencies(), options))

program
  .command("dev", "unlock only dependencies of dev dependencies")
  .example('dev # unlocks indirect dependencies of dev dependencies')
  .action(options => runner('dev', (database) => reduceDeps(database, getAllDirectDependencies(), getDirectDevDependencies()), options))

program
  .command("direct", "unlock only dependencies of direct dependencies")
  .example('direct # unlocks indirect dependencies of direct dependencies')
  .action(options => runner('direct', (database) => reduceDeps(database, getAllDirectDependencies(), getDirectDependencies()), options))

program
  .command("matching <glob>", "unlock dependencies from a parent matching given glob")
  .example('matching react # unlocks indirect dependencies react')
  .example('matching react* # unlocks indirect dependencies of any package starting from react*')
  .action((glob, options) => runner('direct', (database) => {
        const topDeps = Array.from(database.keys()).filter(minimatch.filter(glob));
        console.log('matched:', topDeps.join(', '));
        return (
          reduceDeps(
            database,
            getAllDirectDependencies(),
            new Set(topDeps))
        )
      },
      options)
  )

program
  .command("levels <mode>", "lists dependencies by level; mode - one of 'all, dev, direct'")
  .option('-l, --level', 'specify level to report')
  .action(async (mode, {level}) => {
    const levels = await getPackageLevels(getPackageDatabase(), getDependenciesFor(mode))
    if (level) {
      console.log(levels[level + 1])
    } else {
      levels.forEach((level, index) => console.log(index + 1, '\t', [...level].join(', ')))
    }
  })

program.parse(process.argv)