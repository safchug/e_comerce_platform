import pretty from 'pino-pretty';

type PrettyOptions = Parameters<typeof pretty>[0];

/**
 * Thin wrapper around pino-pretty so we can pass a `customPrettifiers.err`
 * function.
 *
 * pino loads transports (like pino-pretty) in a worker thread, and the
 * options object is passed via `postMessage`, which uses the structured
 * clone algorithm - functions cannot cross that boundary. Passing
 * `customPrettifiers` directly in `pinoHttp.transport.options` would
 * silently fail to serialize. Pointing `transport.target` at this file
 * (which itself runs inside the worker thread) sidesteps that: the function
 * is defined locally here instead of being sent across the thread boundary.
 *
 * See: https://github.com/pinojs/pino-pretty#usage-with-pinotransport
 */
export default function build(options: PrettyOptions) {
  return pretty({
    ...options,
    customPrettifiers: {
      // pino's standard error serializer turns an Error into
      // { type, message, stack, ... }. pino-pretty's default rendering for
      // that shows type/message/stack as separate JSON-ish key/value lines,
      // which reads worse than a normal stack trace. Print the raw stack
      // (which already includes the error name + message on its first line)
      // the way Node prints uncaught errors.
      err: (value) => {
        if (value && typeof value === 'object') {
          const err = value as {
            stack?: unknown;
            message?: unknown;
            code?: unknown;
            meta?: unknown;
          };
          const base =
            typeof err.stack === 'string'
              ? err.stack
              : typeof err.message === 'string'
                ? err.message
                : String(value);

          // Prisma (and other libs) attach a `code` + `meta` to their error
          // objects with the actual diagnostic detail (e.g. code "P2021",
          // meta.table "public.users" for "table does not exist"). Neither
          // is part of the stack, so surface them explicitly instead of
          // silently dropping them.
          const extras: string[] = [];
          if (typeof err.code === 'string') extras.push(`code: ${err.code}`);
          if (err.meta && typeof err.meta === 'object') {
            extras.push(`meta: ${JSON.stringify(err.meta)}`);
          }

          return extras.length > 0 ? `${base}\n${extras.join('\n')}` : base;
        }
        return String(value);
      },
    },
  });
}
