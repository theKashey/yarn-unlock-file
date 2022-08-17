import fs from 'fs';
import { join } from 'path';

import { getRoot } from './get-dependencies';

import { updateLock, yarnLockToDatabase, YarnPackageDatabase } from './parser/yarn-lock';

export const getLockFileName = (): string => join(getRoot(), 'yarn.lock');

const readLockFile = (lockFileName: string): string => fs.readFileSync(lockFileName, 'utf-8');

export const getYarnPackages = (lockFileName: string): YarnPackageDatabase => {
  return yarnLockToDatabase(readLockFile(lockFileName));
};

export function processLock(filter: (dep: string) => boolean) {
  const lockFileName = getLockFileName();
  const content = readLockFile(lockFileName);
  const packages = yarnLockToDatabase(content);

  const unlocked = new Set<string>();
  const renewedPackages = packages
    .filter(([name]) => {
      if (filter(name)) {
        return true;
      }

      unlocked.add(name);

      return false;
    })
    .map(([name]) => name);
  console.log(`keeping ${renewedPackages.length} packages`);
  console.log(`unlocking ${unlocked.size} packages`);

  const newLockString = updateLock(content, new Set(renewedPackages));
  fs.writeFileSync(lockFileName, newLockString);
}
