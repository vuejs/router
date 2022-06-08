// yarn nightwatch -e chrome,safari,firefox

/** @type {import('nightwatch').NightwatchTestSettingScreenshots} */
const browserDefaults = {
  selenium_port: 4444,
  selenium_host: 'localhost',
  silent: true,
  screenshots: {
    enabled: true,
    on_failure: true,
    on_error: false,
    path: 'e2e/screenshots',
  },
}

const geckodriverPath = require('geckodriver').path
const chromedriverPath = require('chromedriver').path

/** @type {import('nightwatch').NightwatchOptions} */
module.exports = {
  src_folders: ['e2e/specs'],
  output_folder: 'e2e/reports',
  custom_commands_path: ['node_modules/nightwatch-helpers/commands'],
  custom_assertions_path: ['node_modules/nightwatch-helpers/assertions'],
  // set to true when testing on multiple browsers (-e chrome,firefox) to display tests as they pass instead of waiting for everything to be finished
  live_output: false,

  selenium: {
    start_process: true,
    start_session: true,
    host: '127.0.0.1',
    port: 4444,
    server_path: require('selenium-server').path,
    cli_args: {
      'webdriver.chrome.driver': chromedriverPath,
      'webdriver.gecko.driver': geckodriverPath,
    },
  },

  webdriver: {
    start_process: false,
  },

  test_settings: {
    default: {
      launch_url: 'https://nightwatchjs.org',
    },

    chrome: {
      ...browserDefaults,
      desiredCapabilities: {
        browserName: 'chrome',
        acceptSslCerts: true,
        chromeOptions: {
          // https://github.com/nightwatchjs/nightwatch/releases/tag/v1.1.12
          w3c: false,
          args: ['window-size=1280,800'],
        },
      },
    },

    'chrome-headless': {
      ...browserDefaults,
      desiredCapabilities: {
        browserName: 'chrome',
        acceptSslCerts: true,
        chromeOptions: {
          w3c: false,
          args: ['window-size=1280,800', 'headless'],
        },
      },
    },

    safari: {
      ...browserDefaults,
      desiredCapabilities: {
        browserName: 'safari',
        acceptSslCerts: true,
      },
    },

    // TODO: not working
    firefox: {
      ...browserDefaults,
      desiredCapabilities: {
        browserName: 'firefox',
        acceptSslCerts: true,
        'moz:firefoxOptions': {
          binary: geckodriverPath,
          args: [],
        },
      },
    },
  },
}
