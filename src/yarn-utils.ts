import fs from "fs";
import {join} from "path";

import {getRoot} from "./get-dependencies";

import {extractPackageName} from "./parser/utils";
import {updateLock, yarnLockToDatabase, YarnPackageDatabase} from "./parser/yarn-lock";

export const getLockFileName = ():string => join(getRoot(), 'yarn.lock');

const readLockFile = (lockFileName:string):string => fs.readFileSync(lockFileName, 'utf-8');

export const getYarnPackages = (lockFileName: string): YarnPackageDatabase => {
  return yarnLockToDatabase(readLockFile(lockFileName));
}

export function processLock(filter: (dep: string) => boolean) {
  const lockFileName = getLockFileName();
  const content = readLockFile(lockFileName);
  const packages = yarnLockToDatabase(lockFileName);

  const unlocked = new Set<string>();
  const renewedPackages = Object.keys(packages).filter(([dep]) => {
    const name = extractPackageName(dep);

    if (filter(name)) {
      return true;
    }

    unlocked.add(name);

    return false;
  });
  console.log('unlocking', Array.from(unlocked).join(', '));

  const newLockString = updateLock(content, new Set(renewedPackages));
  fs.writeFileSync(lockFileName, newLockString);
}