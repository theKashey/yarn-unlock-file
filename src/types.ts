export type Dependencies = Set<string>;

export type PackageDatabase = Map<string, {
  dependencies: Dependencies;
}>;