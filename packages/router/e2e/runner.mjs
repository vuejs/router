import Nightwatch from 'nightwatch'

const args = process.argv.slice(2)

function getServer() {
  return args.indexOf('--dev') > -1
    ? null
    : import('./devServer.mjs').then(({ getServer }) => getServer())
}

;(async () => {
  const server = await getServer()

  try {
    await runNightwatchCli()
    server?.close()
  } catch (ex) {
    console.log('There was an error while starting the test runner:\n\n')
    process.stderr.write(ex.stack + '\n')
    server?.close()
    process.exit(2)
  }
})()

function runNightwatchCli() {
  return new Promise((resolve, reject) => {
    Nightwatch.cli(argv => {
      Nightwatch.CliRunner(argv).setup().runTests().then(resolve).catch(reject)
    })
  })
}
