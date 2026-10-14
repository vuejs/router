import { execFile, spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execute = promisify(execFile)
const root = dirname(fileURLToPath(import.meta.url))
const fixtures = process.argv.slice(2)
if (!fixtures.length)
  fixtures.push(
    'classic',
    'auto-routes',
    'auto-resolver',
    'auto-resolver-props'
  )
const session = `router-perf-${process.pid}`
async function browser(...args) {
  const { stdout } = await execute(
    'agent-browser',
    ['--session', session, '--json', ...args],
    { maxBuffer: 2_000_000 }
  )
  const response = JSON.parse(stdout)
  if (!response.success) throw new Error(response.error)
  return response.data
}

const checkPages = `async () => {
  const links = [...document.querySelectorAll('nav a')];
  if (links.length !== 50) throw new Error('Expected 50 navigation links');
  const checked = [];
  for (const link of links) {
    const expected = new URL(link.href).pathname;
    const label = link.textContent.trim();
    link.click();
    const deadline = Date.now() + 5000;
    while (location.pathname !== expected || document.querySelector('h1')?.textContent !== label) {
      if (Date.now() > deadline) throw new Error('Navigation failed: ' + expected);
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    if (document.querySelectorAll('tbody tr').length !== 24) throw new Error('Missing records: ' + expected);
    checked.push({ path: expected, parameterSource: document.querySelector('[data-testid=param-source]').textContent });
  }
  return checked;
}`
const results = { recordedAt: new Date().toISOString(), fixtures: {} }
try {
  for (const [index, name] of fixtures.entries()) {
    if (!/^[a-z0-9-]+$/.test(name))
      throw new Error(`Invalid fixture name: ${name}`)
    const cwd = join(root, name)
    const require = createRequire(join(cwd, 'package.json'))
    const packagePath = require.resolve('vite/package.json')
    const cli = resolve(dirname(packagePath), require(packagePath).bin.vite)
    const port = 4190 + index
    const server = spawn(
      process.execPath,
      [
        cli,
        'preview',
        '--host',
        '127.0.0.1',
        '--port',
        String(port),
        '--strictPort',
      ],
      { cwd, stdio: ['ignore', 'pipe', 'pipe'] }
    )
    try {
      await new Promise((ready, reject) => {
        const timeout = setTimeout(
          () => reject(new Error(`Preview did not start: ${name}`)),
          10000
        )
        server.once('error', error => {
          clearTimeout(timeout)
          reject(error)
        })
        server.once('exit', code => {
          clearTimeout(timeout)
          reject(new Error(`Preview exited: ${name} (${code})`))
        })
        server.stdout.on('data', data => {
          if (data.toString().includes('Local:')) {
            clearTimeout(timeout)
            ready()
          }
        })
        server.stderr.on('data', data => process.stderr.write(data))
      })
      console.log(`${name}: check all pages, filter, form, and route params`)
      await browser('open', `http://127.0.0.1:${port}`)
      await browser('wait', '--text', 'Projects · overview')
      await browser('snapshot', '-i')
      const { result: pages } = await browser('eval', `(${checkPages})()`)
      await browser(
        'find',
        'role',
        'textbox',
        'fill',
        'initiative 24',
        '--name',
        'Filter initiatives'
      )
      await browser(
        'eval',
        `if (document.querySelectorAll('tbody tr').length !== 1) throw new Error('Filter failed'); true`
      )
      await browser(
        'find',
        'role',
        'button',
        'click',
        '--name',
        'Inspect',
        '--exact'
      )
      await browser(
        'find',
        'role',
        'textbox',
        'fill',
        'Updated initiative 24',
        '--name',
        'Initiative title'
      )
      await browser('find', 'role', 'button', 'click', '--name', 'Save changes')
      await browser(
        'eval',
        `if (document.querySelector('[role=status]').textContent !== 'Saved Updated initiative 24') throw new Error('Save failed'); true`
      )
      await browser(
        'find',
        'role',
        'button',
        'click',
        '--name',
        'View selected record'
      )
      await browser('wait', '--url', '**/24/metrics*')
      const { result: source } = await browser(
        'eval',
        `if (!document.querySelector('.page-heading').textContent.includes('Record 24')) throw new Error('Param update failed'); document.querySelector('[data-testid=param-source]').textContent`
      )
      const propsApplied = source === 'props'
      results.fixtures[name] = {
        pageCount: pages.length,
        navigation: 'passed',
        filtering: 'passed',
        editing: 'passed',
        paramUpdate: 'passed',
        parameterSource: source,
        propsApplied,
        status:
          name === 'auto-resolver-props' && !propsApplied
            ? 'props-contract-gap'
            : 'passed',
        pages,
      }
      console.log(
        `${name}: navigation and interactions passed; params from ${source}`
      )
    } finally {
      server.kill('SIGTERM')
    }
  }
} finally {
  await browser('close').catch(() => {})
  await mkdir(join(root, 'results'), { recursive: true })
  await writeFile(
    join(root, 'results/smoke.json'),
    JSON.stringify(results, null, 2) + '\n'
  )
}
if (
  Object.values(results.fixtures).some(result => result.status !== 'passed')
) {
  console.error(
    'Resolver props:true did not supply page props. See results/smoke.json.'
  )
  process.exitCode = 1
}
