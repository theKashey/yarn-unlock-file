import {getPackageDatabase} from "./package-utils";
import {PackageDatabase} from "./types";
import {processLock} from "./yarn-utils";

export const runner = async (mode: 'all' | 'dev' | 'direct', resolution: (packages: PackageDatabase) => Promise<Set<string>>, options: { update: string, only: string }) => {
  const tryOnly = (dep: string) => dep.startsWith(options.only)

  const packageDatabase = getPackageDatabase();

  const keepThose = await resolution(packageDatabase);

  processLock(dep => {
    if (options.only && !tryOnly(dep)) {
      return true;
    }

    return keepThose.has(dep);
  })
}