import minimatch from 'minimatch';

import { getDependenciesFor } from './get-dependencies';
import { getPackageLevels } from './levels';
import { getPackageDatabase } from './package-utils';
import { PackageDatabase } from './types';
import { processLock } from './yarn-utils';

export const runner = async (
  mode: 'all' | 'dev' | 'direct',
  resolution: (packages: PackageDatabase) => Promise<Set<string>>,
  options: { update: string; only: string }
) => {
  const packageDatabase = getPackageDatabase();

  const keepThose = await resolution(packageDatabase);

  const matchOnly = options.only && ((dep: string) => minimatch(dep, options.only));

  processLock((dep) => {
    if (matchOnly && !matchOnly(dep)) {
      return true;
    }

    return keepThose.has(dep);
  });
};
