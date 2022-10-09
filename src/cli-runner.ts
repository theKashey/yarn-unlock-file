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
  options: { update: string; only: string; 'dry-run'?: boolean; 'min-level'?: number }
) => {
  const packageDatabase = getPackageDatabase();

  const keepThose = await resolution(packageDatabase);

  const matchOnly = options.only && ((dep: string) => minimatch(dep, options.only));

  const levels = await getPackageLevels(packageDatabase, getDependenciesFor('all'));

  if (options['min-level']) {
    levels.slice(0, options['min-level'] - 1).forEach((lvl) => lvl.forEach((dep) => keepThose.add(dep)));
  }

  const unLockResult = processLock((dep) => {
    if (matchOnly && !matchOnly(dep)) {
      return true;
    }

    return keepThose.has(dep);
  });

  if (options['dry-run']) {
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
