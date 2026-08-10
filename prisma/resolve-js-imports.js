// The generated Prisma client (and its own internals) is written against
// "nodenext" module resolution, so its relative imports use an explicit
// ".js" extension even though only the ".ts" source exists pre-build.
// ts-node's CommonJS require hook doesn't retry with ".ts" when a literal
// ".js" specifier fails to resolve, so this preload script (-r flag) teaches
// it to. Only used for ad-hoc scripts like `prisma/seed.ts`; the Nest app
// itself never hits this because `nest build` compiles .ts -> .js first.
const Module = require('module');

const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function patchedResolveFilename(request, ...rest) {
  try {
    return originalResolveFilename.call(this, request, ...rest);
  } catch (error) {
    if (request.endsWith('.js')) {
      return originalResolveFilename.call(
        this,
        request.slice(0, -'.js'.length),
        ...rest,
      );
    }
    throw error;
  }
};
