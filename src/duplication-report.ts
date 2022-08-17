import { extractPackageName } from './parser/utils';
import { Dependencies } from './types';
import { getLockFileName, getYarnPackages } from './yarn-utils';

/**
 * returns duplicated packages
 * @param scope
 * @example
 * gives all duplicated packages
 * ```ts
 * import {getDuplicates} from 'yarn-unlock-file';
 * const duplicatedPackages = getDuplicates();
 * ```
 * returns duplication only in customer facing packages
 * ```ts
 * import {getDuplicates, reduceDependencies,getPackageDatabase, getDependenciesFor} from 'yarn-unlock-file';
 * const duplicatedPackages = getDuplicates(
 *   // use "reduce" to keep only dev dependencies
 *   await reduceDependencies(getPackageDatabase(), getDependenciesFor('all'), getDependenciesFor('direct'))
 * );
 * ```
 */
export const getDuplicates = (ignore?: Dependencies): Array<[name: string, occurences: string[]]> => {
  const knownPackages = new Map<string, string[]>();

  const packages = new Set(getYarnPackages(getLockFileName()).map(([_, { group }]) => group));

  for (const pkg of packages.values()) {
    const packageName = extractPackageName(pkg);

    knownPackages.set(packageName, [...(knownPackages.get(packageName) || []), pkg]);
  }

  const duplicated = [...knownPackages.entries()].filter(([, v]) => v.length > 1);

  if (ignore) {
    return duplicated.filter(([name]) => !ignore.has(name));
  }

  return duplicated;
};
