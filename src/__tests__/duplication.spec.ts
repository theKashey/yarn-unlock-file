import { reduceDependencies } from '../dependency-traverse';
import { getDuplicates } from '../duplication-report';
import { getDependenciesFor } from '../get-dependencies';
import { getPackageDatabase } from '../package-utils';

describe('duplications', function () {
  it('oh it is very bad', async () => {
    expect(
      getDuplicates(
        await reduceDependencies(getPackageDatabase(), getDependenciesFor('all'), getDependenciesFor('dev'))
      )
    ).toHaveLength(145);
  });

  it('gosh, this is not good', async () => {
    const dup = getDuplicates(
      await reduceDependencies(
        getPackageDatabase(),
        getDependenciesFor('all'),
        getDependenciesFor('direct')
        // new Set([
        //   // "@manypkg/find-root",
        //   // "@manypkg/get-packages",
        //   "@yarnpkg/lockfile",
        //   "js-yaml",
        //   "memoize-one",
        //   // "minimatch",
        //   "sade",
        //   "tslib",
        // ])
      )
    );
    console.log(dup);
    expect(dup).toHaveLength(38);
  });
});
