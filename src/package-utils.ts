import {PackageDatabase} from "./types";
import {extractPackageName} from "./get-dependencies";
import {getLockFileName, getYarnPackages, YarnPackageDatabase} from "./yarn-utils";

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

export const getPackageDatabase = () => {
  const lockFileName = getLockFileName();
  const packages = getYarnPackages(lockFileName);
  return toPackageDatabase(packages);
}