module.exports = {
  testRunner: 'jest',
  runnerConfig: 'e2e/config.json',
  configurations: {
    'ios.sim': {
      type: 'ios.simulator',
      device: { type: 'iPhone 14' },
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/Scanly.app'
    },
    'bs.ios': {
      type: 'ios.none',
      device: { type: 'iPhone 14' },
      session: {
        server: 'https://api-cloud.browserstack.com/wd/hub',
        capabilities: {
          'browserstack.user': process.env.BROWSERSTACK_USERNAME,
          'browserstack.key': process.env.BROWSERSTACK_ACCESS_KEY,
          project: 'Scanly'
        }
      },
      artifacts: { rootDir: 'artifacts/bs' }
    }
  }
};
