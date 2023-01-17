import { Config } from 'jest';

/** @type {import('ts-jest').JestConfigWithTsJest} */
const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['./src'],
    moduleFileExtensions: ['ts', 'js'],
    clearMocks: true,
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coveragePathIgnorePatterns: ['/node_modules/', '/src/config/'],
    coverageProvider: 'v8',
    coverageReporters: ['json', 'text', 'lcov', 'clover'],
    testTimeout: 40000,
    verbose: true
};

export default config;
