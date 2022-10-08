import kleur from 'kleur';
import minimatch from 'minimatch';

import { getDependenciesFor } from './get-dependencies';
import { getPackageLevels } from './levels';
import { getPackageDatabase } from './package-utils';
import { PackageDatabase } from './types';
import { processLock, saveLock } from './yarn-utils';

export const runner = async (
  mode: 'all' | 'dev' | 'direct',
  resolution: (packages: PackageDatabase) => Promise<Set<string>>,
  options: { update: string; only: string; dryRun?: boolean }
) => {
  const packageDatabase = getPackageDatabase();

  const keepThose = await resolution(packageDatabase);

  const matchOnly = options.only && ((dep: string) => minimatch(dep, options.only));

  const unLockResult = processLock((dep) => {
    if (matchOnly && !matchOnly(dep)) {
      return true;
    }

    return keepThose.has(dep);
  });

  if (options.dryRun) {
    const levels = await getPackageLevels(
      getPackageDatabase(),
      ['all', 'dev', 'direct'].includes(mode) ? getDependenciesFor(mode) : new Set([])
    );

    levels.forEach((level, index) =>
      console.log(
        index + 1,
        '\t',
        [...level].map((dep) => (unLockResult.unlocked.has(dep) ? kleur.red(dep) : dep)).join(', ')
      )
    );
  } else {
    saveLock(unLockResult.content);
  }
};
