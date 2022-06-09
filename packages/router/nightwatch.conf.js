//
// Refer to the online docs for more details:
// https://nightwatchjs.org/gettingstarted/configuration/
//
//  _   _  _         _      _                     _          _
// | \ | |(_)       | |    | |                   | |        | |
// |  \| | _   __ _ | |__  | |_ __      __  __ _ | |_   ___ | |__
// | . ` || | / _` || '_ \ | __|\ \ /\ / / / _` || __| / __|| '_ \
// | |\  || || (_| || | | || |_  \ V  V / | (_| || |_ | (__ | | | |
// \_| \_/|_| \__, ||_| |_| \__|  \_/\_/   \__,_| \__| \___||_| |_|
//             __/ |
//            |___/
//

/** @type {import('nightwatch').NightwatchOptions} */
module.exports = {
  // An array of folders (excluding subfolders) where your tests are located;
  // if this is not specified, the test source must be passed as the second argument to the test runner.
  src_folders: ['e2e/specs'],

  // See https://nightwatchjs.org/guide/working-with-page-objects/using-page-objects.html
  page_objects_path: ['node_modules/nightwatch/examples/pages/'],

  // See https://nightwatchjs.org/guide/extending-nightwatch/custom-commands.html
  custom_commands_path: ['node_modules/nightwatch-helpers/commands'],

  // See https://nightwatchjs.org/guide/extending-nightwatch/custom-assertions.html
  custom_assertions_path: ['node_modules/nightwatch-helpers/assertions'],

  // See https://nightwatchjs.org/guide/extending-nightwatch/plugin-api.html
  plugins: [],

  // See https://nightwatchjs.org/guide/#external-globals
  globals_path: '',

  webdriver: {},

  test_settings: {
    default: {
      disable_error_log: false,
      // launch_url: 'https://nightwatchjs.org',

      screenshots: {
        enabled: false,
        path: 'screens',
        on_failure: true,
      },

      desiredCapabilities: {
        browserName: 'chrome',
        'goog:chromeOptions': {
          w3c: true,
        },
      },

      webdriver: {
        start_process: true,
        server_path: '',
      },
    },

    safari: {
      desiredCapabilities: {
        browserName: 'safari',
        alwaysMatch: {
          acceptInsecureCerts: false,
        },
      },
      webdriver: {
        start_process: true,
        server_path: '',
      },
    },

    firefox: {
      desiredCapabilities: {
        browserName: 'firefox',
        alwaysMatch: {
          acceptInsecureCerts: true,
          'moz:firefoxOptions': {
            args: [
              // '-headless',
              // '-verbose'
            ],
          },
        },
      },
      webdriver: {
        start_process: true,
        server_path: '',
        cli_args: [
          // very verbose geckodriver logs
          // '-vv'
        ],
      },
    },

    chrome: {
      desiredCapabilities: {
        browserName: 'chrome',
        'goog:chromeOptions': {
          // More info on Chromedriver: https://sites.google.com/a/chromium.org/chromedriver/
          //
          // w3c:false tells Chromedriver to run using the legacy JSONWire protocol (not required in Chrome 78)
          w3c: true,
          args: [
            // needed for ci
            '--no-sandbox',
            `--disable-setuid-sandbox`,
            //'--ignore-certificate-errors',
            '--allow-insecure-localhost',
            //'--headless'
          ],
        },
      },

      webdriver: {
        start_process: true,
        server_path: '',
      },
    },

    'chrome-headless': {
      extends: 'default',
      desiredCapabilities: {
        browserName: 'chrome',
        'goog:chromeOptions': {
          w3c: true,
          args: ['window-size=1280,800', 'headless'],
        },
      },
    },

    edge: {
      desiredCapabilities: {
        browserName: 'MicrosoftEdge',
        'ms:edgeOptions': {
          w3c: true,
          // More info on EdgeDriver: https://docs.microsoft.com/en-us/microsoft-edge/webdriver-chromium/capabilities-edge-options
          args: [
            //'--headless'
          ],
        },
      },

      webdriver: {
        start_process: true,
        // Download msedgedriver from https://docs.microsoft.com/en-us/microsoft-edge/webdriver-chromium/
        //  and set the location below:
        server_path: '',
        cli_args: [
          // --verbose
        ],
      },
    },

    //////////////////////////////////////////////////////////////////////////////////
    // Configuration for when using the browserstack.com cloud service               |
    //                                                                               |
    // Please set the username and access key by setting the environment variables:  |
    // - BROWSERSTACK_USERNAME                                                       |
    // - BROWSERSTACK_ACCESS_KEY                                                     |
    // .env files are supported                                                      |
    //////////////////////////////////////////////////////////////////////////////////
    browserstack: {
      selenium: {
        host: 'hub.browserstack.com',
        port: 443,
      },
      // More info on configuring capabilities can be found on:
      // https://www.browserstack.com/automate/capabilities?tag=selenium-4
      desiredCapabilities: {
        'bstack:options': {
          userName: '${BROWSERSTACK_USERNAME}',
          accessKey: '${BROWSERSTACK_ACCESS_KEY}',
        },
      },

      disable_error_log: true,
      webdriver: {
        timeout_options: {
          timeout: 15000,
          retry_attempts: 3,
        },
        keep_alive: true,
        start_process: false,
      },
    },

    'browserstack.local': {
      extends: 'browserstack',
      desiredCapabilities: {
        'browserstack.local': true,
      },
    },

    'browserstack.local_chrome': {
      extends: 'browserstack.local',
      desiredCapabilities: {
        browserName: 'chrome',
      },
    },

    'browserstack.local_firefox': {
      extends: 'browserstack.local',
      desiredCapabilities: {
        browserName: 'firefox',
        browserVersion: '58.0',
      },
    },

    // Use https://www.browserstack.com/automate/capabilities?tag=selenium-4 to generate configs

    edge_pre_chrome: {
      extends: 'browserstack.local',
      desiredCapabilities: {
        browserName: 'Edge',
        browserVersion: '18.0',
      },
    },

    android5: {
      extends: 'browserstack.local',
      desiredCapabilities: {
        deviceName: 'Samsung Galaxy S6',
        realMobile: 'true',
        osVersion: '5.0',
      },
    },

    ios10: {
      extends: 'browserstack.local',
      desiredCapabilities: {
        deviceName: 'iPhone 7',
        realMobile: 'true',
        osVersion: '10',
      },
    },
  },
}
