require('dotenv').config()
const Nightwatch = require('nightwatch')
const browserstack = require('browserstack-local')
const path = require('path')

const { BROWSERSTACK_ACCESS_KEY } = process.env
if (!BROWSERSTACK_ACCESS_KEY) {
  throw new Error(
    `
(ONLY FOR MAINTAINERS)
BROWSERSTACK_ACCESS_KEY is not set. Did you create the .env file?
`
  )
}

try {
  require.main.filename = path.resolve(
    __dirname,
    '../../../node_modules/.bin/nightwatch'
  )

  // Code to start browserstack local before start of test
  console.log('Connecting local')

  const bs_local = new browserstack.Local()
  Nightwatch.bs_local = bs_local

  bs_local.start(
    { key: process.env.BROWSERSTACK_ACCESS_KEY },
    function (error) {
      if (error) throw error

      console.log('Connected. Now testing...')
      Nightwatch.cli(function (argv) {
        Nightwatch.CliRunner(argv)
          .setup()
          .runTests()
          .catch(err => {
            throw err
          })
          .finally(() => {
            // Code to stop browserstack local after end of single test
            bs_local.stop(function () {})
          })
      })
    }
  )
} catch (ex) {
  console.log('There was an error while starting the test runner:\n\n')
  process.stderr.write(ex.stack + '\n')
  process.exit(2)
}
