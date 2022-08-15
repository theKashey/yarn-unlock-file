#!/usr/bin/env node

import sade from "sade";
import {join} from 'path';
import fs from 'fs';
import * as lockfile from '@yarnpkg/lockfile';
import {PackageDatabase} from "./types";
import {
  extractPackageName,
  getAllDirectDependencies, getDependenciesFor,
  getDirectDependencies,
  getDirectDevDependencies,
  getRoot
} from "./get-dependencies";
import {reduceDeps} from "./dependency-traverse";
import {getPackageLevels} from "./levels";

const program = sade("yarn-unlock-file", false);

program
  .version(require("../package.json").version);

const getLockFileName = () => join(getRoot(), 'yarn.lock');

type YarnPackageDatabase = Array<[string, any]>;

const getPackages = (lockFileName: string): YarnPackageDatabase => {
  const objects = lockfile.parse(fs.readFileSync(lockFileName, 'utf-8')).object;
  return Object.entries(objects);
}

const toPackageDatabase = (yarnPackages: YarnPackageDatabase): PackageDatabase => {
  return yarnPackages.reduce((packages, [name, packageDetails]) => {
    const shortName = extractPackageName(name);
    if (!packages.has(shortName)) {
      packages.set(shortName, {
        dependencies: new Set<string>()
      });
    }
    const deps = packages.get(shortName)!.dependencies;
    Object.keys(packageDetails.dependencies || {}).forEach(dep =>
      deps.add(dep)
    );

    return packages;
  }, new Map())
}

const getPackageDatabase = () => {
  const lockFileName = getLockFileName();
  const packages = getPackages(lockFileName);
  return toPackageDatabase(packages);
}

const runner = async (mode: 'all' | 'dev' | 'direct', resolution: (packages: PackageDatabase) => Promise<Set<string>>, options: { update: string, only: string }) => {
  const tryOnly = (dep: string) => dep.startsWith(options.only)
  const tryUpdate = (dep: string) => dep.startsWith(options.update);

  const lockFileName = getLockFileName();
  const packages = getPackages(lockFileName);
  const packageDatabase = toPackageDatabase(packages);

  const keepThose = await resolution(packageDatabase);

  const renewedPackages = processLock(packages, dep => {
    if (options.only && !tryOnly(dep)) {
      return true;
    }
    if (options.update && tryUpdate(dep)) {
      // force update
      return false;
    }
    return keepThose.has(dep);
  })
  // find lost
  const unlockedPackages = new Set<string>();
  packages.forEach(([name]) => {
    if (!renewedPackages[name]) {
      unlockedPackages.add(name)
    }
  })

  console.log('unlocking', unlockedPackages)

  const newLockString = lockfile.stringify(renewedPackages);
  // fs.writeFileSync(targetFile, newLockString);
}

program
  .option("-u, --update <glob>", "_also_ unlock ALL dependencies by mask")
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
  .example('all # unlocks indirect dependencies of dev dependencies')
  .action(options => runner('dev', (database) => reduceDeps(database, getAllDirectDependencies(), getDirectDevDependencies()), options))

program
  .command("direct", "unlock only dependencies of direct dependencies")
  .example('direct # unlocks indirect dependencies of direct dependencies')
  .action(options => runner('direct', (database) => reduceDeps(database, getAllDirectDependencies(), getDirectDependencies()), options))

program
  .command("levels <mode>", "lists dependencies by level; mode - one of 'all, dev, direct'")
  .option('-l, --level', 'specify level to report')
  .action(async (mode, {level}) => {
    const levels = await getPackageLevels(getPackageDatabase(), getDependenciesFor(mode))
    if (level) {
      console.log(levels[level+1])
    } else {
      levels.forEach((level, index) => console.log(index+1, '\t', [...level].join(', ')))
    }
  })

program.parse(process.argv)

function processLock(packages: Array<[name: string, information: unknown]>, filter: (dep: string) => boolean) {
  const unlocked = new Set<string>();
  return Object.fromEntries(packages.filter(([dep]) => {
    const name = extractPackageName(dep);
    if (filter(name)) {
      return true;
    }
    unlocked.add(name);

    return false;
  }));
}