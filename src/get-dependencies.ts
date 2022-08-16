import {join} from 'path';

import {findRootSync} from "@manypkg/find-root";
import {getPackages, Package} from "@manypkg/get-packages";
import memoizeOne from "memoize-one";

import {Dependencies} from "./types";

export const getRoot = (): string => {
  try {
    return findRootSync(process.cwd());
  } catch (e) {
    return process.cwd();
  }
}

type PackageJSON = Package['packageJson'];

const getWorkspaces = memoizeOne(async (root: string): Promise<PackageJSON[]> => {
  try {
    return (await getPackages(root)).packages.map(pkg => pkg.packageJson);
  } catch (e) {
    return [require(join(root, 'package.json'))];
  }
})

export const getDependencies = async (fieldPicker: (pkg: PackageJSON) => string[]): Promise<Dependencies> => {
  const workspaces = await getWorkspaces(getRoot());
  const usedDependencies = new Set<string>();

  workspaces.forEach((config) =>
    fieldPicker(config).forEach((dependency) =>
      usedDependencies.add(dependency),
    ),
  );

  return usedDependencies;
};

export const getDirectDependencies = async (): Promise<Dependencies> => (
  getDependencies(({dependencies}) => Object.keys(dependencies || {}))
)
export const getDirectDevDependencies = async (): Promise<Dependencies> => (
  getDependencies(({devDependencies}) => Object.keys(devDependencies || {}))
)

export const getAllDirectDependencies = async (): Promise<Dependencies> => (
  getDependencies(({dependencies, devDependencies}) => [
    ...Object.keys(dependencies || {}),
    ...Object.keys(devDependencies || {})
  ])
)

export const getDependenciesFor = (mode: 'all' | 'direct' | 'dev'): Promise<Dependencies> => {
  switch (mode) {
    case 'all':
      return getAllDirectDependencies();
    case 'dev':
      return getDirectDevDependencies();
    case 'direct':
      return getDirectDependencies();

    default:
      throw new Error('undefined mode:' + mode)
  }
}
