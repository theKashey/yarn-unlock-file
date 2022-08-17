import { Dependencies, PackageDatabase } from './types';

const pushSet = (set: Set<string>, ...names: string[]): void => {
  names.forEach((name) => set.add(name));
};

const wipePass = (database: PackageDatabase, keep: Set<string>, lock: Set<string>, names: Set<string>) => {
  for (const name of names) {
    if (lock.has(name) || !keep.has(name)) {
      continue;
    }

    keep.delete(name);

    const ent = database.get(name);

    if (ent) {
      wipePass(database, keep, lock, ent.dependencies);
    }
  }
};

/**
 * reduces dependencies to include packages from database not being used for rootPackagesGetter
 * @param database
 * @param allPackagesGetter
 * @param rootPackagesGetter
 * @example
 * generates a list of packages without dev dependencies
 * ```ts
 * reduceDependencies(getPackageDatabase(), getDependenciesFor('all'), getDependenciesFor('dev'))
 * ```
 */
export const reduceDependencies = async (
  database: PackageDatabase,
  allPackagesGetter: Promise<Dependencies> | Dependencies,
  rootPackagesGetter: Promise<Dependencies> | Dependencies
): Promise<Dependencies> => {
  const allPackages = await allPackagesGetter;
  const rootPackages = await rootPackagesGetter;

  // lock versions
  const lockedSet = new Set<string>();

  for (const packageName of allPackages) {
    // a package to be kept
    if (!rootPackages.has(packageName)) {
      pushSet(lockedSet, packageName);
      // also keeping it's deps? why so?
      //, ...database.get(packageName)?.dependencies || [])
    }
  }

  // keep everything except found

  // keep all
  const keepThose = new Set(database.keys());
  wipePass(database, keepThose, lockedSet, rootPackages);

  return keepThose;
};
