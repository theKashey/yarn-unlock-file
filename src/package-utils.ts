import { YarnPackageDatabase } from './parser/yarn-lock';
import { PackageDatabase } from './types';
import { getLockFileName, getYarnPackages } from './yarn-utils';

const toPackageDatabase = (yarnPackages: YarnPackageDatabase): PackageDatabase => {
  return yarnPackages.reduce((packages, [name, packageDetails]) => {
    if (!packages.has(name)) {
      packages.set(name, {
        dependencies: new Set<string>(),
      });
    }

    const deps = packages.get(name)!.dependencies;

    Object.keys(packageDetails.dependencies || {}).forEach((dep) => deps.add(dep));

    return packages;
  }, new Map());
};

export const getPackageDatabase = () => {
  const lockFileName = getLockFileName();
  const packages = getYarnPackages(lockFileName);

  return toPackageDatabase(packages);
};
