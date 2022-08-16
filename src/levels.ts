import {Dependencies, PackageDatabase} from "./types";

export const getPackageLevels = async (database: PackageDatabase, topDependencies: Promise<Dependencies>):Promise<Array<Dependencies>> => {
  const levels: Array<Dependencies> = [];
  const topDeps = await topDependencies;
  const allKnown: Dependencies = new Set();


  const unwrap = (levels: Array<Dependencies>, deps: Dependencies, known: Dependencies) => {
    const level: Dependencies = new Set();
    const newLevel: Dependencies = new Set();

    for (const dep of deps) {
      if (known.has(dep)) {
        continue;
      }

      known.add(dep);
      level.add(dep);
      database.get(dep)?.dependencies.forEach(newDep => newLevel.add(newDep))
    }

    if(level.size>0) {
      levels[levels.length] = level;
    }

    if(newLevel.size>0) {
      unwrap(levels, newLevel, allKnown)
    }
  }

  unwrap(levels, topDeps, allKnown)

  return levels;
}