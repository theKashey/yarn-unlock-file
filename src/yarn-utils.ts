import {join} from "path";
import {extractPackageName, getRoot} from "./get-dependencies";
import * as lockfile from "@yarnpkg/lockfile";
import fs from "fs";

export const getLockFileName = () => join(getRoot(), 'yarn.lock');

export type YarnPackageDatabase = Array<[string, any]>;

export const getYarnPackages = (lockFileName: string): YarnPackageDatabase => {
  const objects = lockfile.parse(fs.readFileSync(lockFileName, 'utf-8')).object;
  return Object.entries(objects);
}

export function processLock(filter: (dep: string) => boolean) {
  const lockFileName = getLockFileName();
  const packages = getYarnPackages(lockFileName);

  const unlocked = new Set<string>();
  const renewedPackages = Object.fromEntries(packages.filter(([dep]) => {
    const name = extractPackageName(dep);
    if (filter(name)) {
      return true;
    }
    unlocked.add(name);

    return false;
  }));
  console.log('unlocking', Array.from(unlocked).join(', '));

  const newLockString = lockfile.stringify(renewedPackages);
  fs.writeFileSync(lockFileName, newLockString);
}