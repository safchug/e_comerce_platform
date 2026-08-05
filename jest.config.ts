import type { Config } from 'jest';

const config: Config = {
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/**/*.spec.ts',
    '!src/**/*.integration-spec.ts',
    '!src/main.ts',
    '!src/**/*.module.ts',
    '!src/**/index.ts',
    '!src/generated/**',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
    './src/domain/**/*.ts': {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  projects: [
    {
      displayName: 'unit',
      rootDir: '.',
      moduleFileExtensions: ['js', 'json', 'ts'],
      moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
      testEnvironment: 'node',
      testRegex: '.*\\.spec\\.ts$',
      testPathIgnorePatterns: ['\\.integration-spec\\.ts$', '<rootDir>/test/'],
      transform: { '^.+\\.(t|j)s$': 'ts-jest' },
    },
    {
      displayName: 'integration',
      rootDir: '.',
      moduleFileExtensions: ['js', 'json', 'ts'],
      moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
      testEnvironment: 'node',
      testRegex: '.*\\.integration-spec\\.ts$',
      transform: { '^.+\\.(t|j)s$': 'ts-jest' },
    },
  ],
};

export default config;
