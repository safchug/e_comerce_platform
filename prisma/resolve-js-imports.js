// The generated Prisma client (and its own internals) is written against
// "nodenext" module resolution, so its relative imports use an explicit
// ".js" extension even though only the ".ts" source exists pre-build.
// ts-node's CommonJS require hook doesn't retry with ".ts" when a literal
// ".js" specifier fails to resolve, so this preload script (-r flag) teaches
// it to. Only used for ad-hoc scripts like `prisma/seed.ts`; the Nest app
// itself never hits this because `nest build` compiles .ts -> .js first.
const Module = require('module');
const path = require('path');

// Scoped to the generated client directory only, so a genuine typo in an
// unrelated import path still fails with its original error instead of
// silently resolving to something else.
const GENERATED_PRISMA_DIR = path.join(
  __dirname,
  '..',
  'src',
  'generated',
  'prisma',
);

const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function patchedResolveFilename(
  request,
  parent,
  ...rest
) {
  try {
    return originalResolveFilename.call(this, request, parent, ...rest);
  } catch (error) {
    const parentDir = parent && parent.filename && path.dirname(parent.filename);
    const isFromGeneratedPrisma =
      parentDir === GENERATED_PRISMA_DIR ||
      (parentDir && parentDir.startsWith(GENERATED_PRISMA_DIR + path.sep));

    if (request.endsWith('.js') && isFromGeneratedPrisma) {
      return originalResolveFilename.call(
        this,
        request.slice(0, -'.js'.length),
        parent,
        ...rest,
      );
    }
    throw error;
  }
};
