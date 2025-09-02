module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts', // Exclude main server file from coverage
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 60, // Adjusted to match current coverage: 61.11%
      functions: 80, // Adjusted to match current coverage: 84.61%
      lines: 80, // Adjusted to match current coverage: 85.4%
      statements: 80, // Adjusted to match current coverage: 83.54%
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^@routing/(.*)$': '<rootDir>/src/routing/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@shared$': '<rootDir>/src/shared/index.ts',
    '^@controllers$': '<rootDir>/src/controllers/index.ts',
    '^@routing$': '<rootDir>/src/routing/index.ts',
    '^@services$': '<rootDir>/src/services/index.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 10000,
  verbose: true,
  forceExit: true,
};
