/* eslint-disable */
export default {
  displayName: 'zo-ops',
  preset: '../../jest.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/apps/zo-ops',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  testEnvironment: 'jsdom',
};
