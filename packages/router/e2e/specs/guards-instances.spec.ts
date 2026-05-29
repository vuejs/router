import { test, expect, type Page } from '@playwright/test'

// nav links render their `to` as their text; `exact` avoids `/f/2` matching
// `/f/2?bar=foo`, `/` matching everything, etc.
const link = (page: Page, name: string) =>
  page.getByRole('link', { name, exact: true })

async function testCase(page: Page, name: string) {
  await link(page, '/foo').click()
  await expect(page.locator(`#${name} .enterCbs`)).toContainText('1')
  await expect(page.locator(`#${name} .update`)).toContainText('0')
  await expect(page.locator(`#${name} .leave`)).toContainText('0')
  await link(page, '/f/1').click()
  await expect(page.locator(`#${name} .enterCbs`)).toContainText('2')
  await expect(page.locator(`#${name} .update`)).toContainText('0')
  await expect(page.locator(`#${name} .leave`)).toContainText('1')
  await link(page, '/f/2').click()
  await expect(page.locator(`#${name} .enterCbs`)).toContainText('2')
  await expect(page.locator(`#${name} .update`)).toContainText('1')
  await expect(page.locator(`#${name} .leave`)).toContainText('1')
  await link(page, '/f/2?bar=foo').click()
  await expect(page.locator(`#${name} .enterCbs`)).toContainText('2')
  await expect(page.locator(`#${name} .update`)).toContainText('2')
  await expect(page.locator(`#${name} .leave`)).toContainText('1')
  await link(page, '/foo').click()
  await expect(page.locator(`#${name} .enterCbs`)).toContainText('3')
  await expect(page.locator(`#${name} .update`)).toContainText('2')
  await expect(page.locator(`#${name} .leave`)).toContainText('2')
  await expect(page.locator('#logs')).toHaveText(
    [
      `${name}: enter / - /foo`,
      `${name}: leave /foo - /f/1`,
      `${name}: setup:leave /foo - /f/1`,
      `${name}: enter /foo - /f/1`,
      `${name}: update /f/1 - /f/2`,
      `${name}: setup:update /f/1 - /f/2`,
      `${name}: update /f/2 - /f/2`,
      `${name}: setup:update /f/2 - /f/2`,
      `${name}: leave /f/2 - /foo`,
      `${name}: setup:leave /f/2 - /foo`,
      `${name}: enter /f/2 - /foo`,
    ].join('\n')
  )
}

// resolved against `baseURL` from playwright.config.ts
const BASE = '/guards-instances'

test.describe('guards-instances', () => {
  test('guards instances', async ({ page }) => {
    const name = 'Foo'
    await page.goto(BASE + '/')
    await expect(page.getByRole('heading', { name: 'Instances' })).toBeVisible()

    await page.getByRole('button', { name: 'Use Normal' }).click()

    await testCase(page, name)

    await link(page, '/').click()
    // the enters are reset when leaving a reused component
    await link(page, '/foo').click()
    await expect(page.locator(`#${name} .enterCbs`)).toContainText('1')
  })

  test('cancel pending pop navigations', async ({ page }) => {
    await page.goto(BASE + '/')
    await expect(page.getByRole('heading', { name: 'Instances' })).toBeVisible()

    await page.getByRole('button', { name: 'Use Normal' }).click()
    await link(page, '/b/1').click()
    await link(page, '/b/2').click()
    await link(page, '/b/3').click()
    await page.goBack()
    await page.goBack()
    await expect(page.locator('#app > #with-id-1')).toBeVisible()
    await expect(page).toHaveURL(BASE + '/b/1?testCase=')
  })

  test('guards instances transition', async ({ page }) => {
    await page.goto(BASE + '/')
    await expect(page.getByRole('heading', { name: 'Instances' })).toBeVisible()

    await page.getByRole('button', { name: 'Use Transition' }).click()

    await testCase(page, 'Foo')
  })

  test('guards instances keep alive', async ({ page }) => {
    const name = 'Foo'
    await page.goto(BASE + '/')
    await expect(page.getByRole('heading', { name: 'Instances' })).toBeVisible()

    await page
      .getByRole('button', { name: 'Use Keep Alive', exact: true })
      .click()

    await testCase(page, name)

    await link(page, '/').click()
    // keep alive keeps the correct instance
    await link(page, '/foo').click()
    await expect(page.locator(`#${name} .enterCbs`)).toHaveText('4')
    await link(page, '/').click()
    await link(page, '/foo').click()
    await expect(page.locator(`#${name} .enterCbs`)).toContainText('5')
    await link(page, '/f/1').click()
    await expect(page.locator(`#${name} .enterCbs`)).toContainText('6')
    // leave the update view and enter it again
    await link(page, '/').click()
    await link(page, '/f/1').click()
    await page.getByRole('button', { name: 'Reset Logs' }).click()
    await link(page, '/f/2').click()
    await link(page, '/').click()
    await expect(page.locator('#logs')).toHaveText(
      [
        `${name}: update /f/1 - /f/2`,
        `${name}: setup:update /f/1 - /f/2`,
        `${name}: leave /f/2 - /`,
        `${name}: setup:leave /f/2 - /`,
      ].join('\n')
    )
  })

  test('guards instances keyed', async ({ page }) => {
    const name = 'Foo'
    await page.goto(BASE + '/')
    await expect(page.getByRole('heading', { name: 'Instances' })).toBeVisible()

    await page.getByRole('button', { name: 'Use keyed' }).click()

    await testCase(page, name)

    await link(page, '/f/2?bar=foo').click()
    // the query is used as a key resetting the enter count
    await link(page, '/f/2?foo=key').click()
    await expect(page.locator(`#${name} .enterCbs`)).toContainText('0')
    // changing both the route and mounting the component
    await link(page, '/foo').click()
    await expect(page.locator(`#${name} .enterCbs`)).toContainText('1')
    await link(page, '/f/2?foo=key').click()
    await expect(page.locator(`#${name} .enterCbs`)).toContainText('1')
    await expect(page.locator(`#${name} .update`)).toContainText('0')
    await expect(page.locator(`#${name} .leave`)).toContainText('0')
    await link(page, '/foo').click()
    await expect(page.locator(`#${name} .enterCbs`)).toContainText('1')
    await expect(page.locator(`#${name} .update`)).toContainText('0')
    await expect(page.locator(`#${name} .leave`)).toContainText('0')
    await link(page, '/f/2?foo=key').click()
    await expect(page.locator(`#${name} .update`)).toContainText('0')
    await expect(page.locator(`#${name} .leave`)).toContainText('0')
    await page.getByRole('button', { name: 'Reset Logs' }).click()
    await link(page, '/f/2?foo=key2').click()
    await expect(page.locator(`#${name} .enterCbs`)).toContainText('0')
    await expect(page.locator(`#${name} .update`)).toContainText('0')
    await expect(page.locator(`#${name} .leave`)).toContainText('0')
    await expect(page.locator('#logs')).toHaveText(
      [
        // to force new lines formatting
        `${name}: update /f/2 - /f/2`,
        `${name}: setup:update /f/2 - /f/2`,
      ].join('\n')
    )
    await link(page, '/f/2?foo=key').click()
    await expect(page.locator(`#${name} .enterCbs`)).toContainText('0')
  })

  test('guards instances keepalive keyed', async ({ page }) => {
    const name = 'Foo'
    await page.goto(BASE + '/')
    await expect(page.getByRole('heading', { name: 'Instances' })).toBeVisible()

    await page.getByRole('button', { name: 'Use Keep Alive Keyed' }).click()

    await testCase(page, name)

    await link(page, '/').click()
    // keep alive keeps the correct instance
    await link(page, '/foo').click()
    await expect(page.locator(`#${name} .enterCbs`)).toContainText('4')
    await link(page, '/').click()
    await link(page, '/foo').click()
    await expect(page.locator(`#${name} .enterCbs`)).toContainText('5')
    await link(page, '/f/1').click()
    await expect(page.locator(`#${name} .enterCbs`)).toContainText('6')

    await link(page, '/f/2?bar=foo').click()
    // the query is used as a key resetting the enter count
    await link(page, '/f/2?foo=key').click()
    await expect(page.locator(`#${name} .enterCbs`)).toContainText('0')
    await expect(page.locator(`#${name} .update`)).toContainText('0')
    await expect(page.locator(`#${name} .leave`)).toContainText('0')
    await link(page, '/').click()
    await link(page, '/f/2?foo=key').click()
    await expect(page.locator(`#${name} .enterCbs`)).toContainText('1')
    await expect(page.locator(`#${name} .update`)).toContainText('0')
    await expect(page.locator(`#${name} .leave`)).toContainText('1')
    await link(page, '/f/2?bar=foo').click()
    await expect(page.locator(`#${name} .enterCbs`)).toContainText('6')
    // on reused instance
    await link(page, '/foo').click()
    await link(page, '/f/2?foo=key').click()
    await expect(page.locator(`#${name} .enterCbs`)).toContainText('2')
    await expect(page.locator(`#${name} .update`)).toContainText('1')
    await expect(page.locator(`#${name} .leave`)).toContainText('1')
    await page.getByRole('button', { name: 'Reset Logs' }).click()
    await link(page, '/f/2?foo=key2').click()
    await expect(page.locator(`#${name} .enterCbs`)).toContainText('0')
    // the previous instance was updated but not this one
    await expect(page.locator(`#${name} .update`)).toContainText('0')
    await expect(page.locator(`#${name} .leave`)).toContainText('0')
    // should only trigger active guards
    await expect(page.locator('#logs')).toHaveText(
      [
        // foo
        `${name}: update /f/2 - /f/2`,
        `${name}: setup:update /f/2 - /f/2`,
      ].join('\n')
    )
    await link(page, '/f/2?foo=key').click()
    await expect(page.locator(`#${name} .enterCbs`)).toContainText('2')
    await expect(page.locator(`#${name} .update`)).toContainText('2')
    await expect(page.locator(`#${name} .leave`)).toContainText('1')
    await expect(page.locator('#logs')).toHaveText(
      [
        `${name}: update /f/2 - /f/2`,
        `${name}: setup:update /f/2 - /f/2`,
        `${name}: update /f/2 - /f/2`,
        `${name}: setup:update /f/2 - /f/2`,
      ].join('\n')
    )
  })

  test('guards + instances + named views', async ({ page }) => {
    await page.goto(BASE + '/named-one')
    await expect(page.getByRole('heading', { name: 'Instances' })).toBeVisible()

    await link(page, '/').click()
    await expect(page.locator('#logs')).toHaveText(
      [
        `One: enter / - /named-one`,
        `Aux: enter / - /named-one`,
        `One: leave /named-one - /`,
        `Aux: leave /named-one - /`,
        `One: setup:leave /named-one - /`,
        `Aux: setup:leave /named-one - /`,
      ].join('\n')
    )

    await link(page, '/named-one').click()
    await page.getByRole('button', { name: 'Reset Logs' }).click()
    await link(page, '/named-two').click()
    await expect(page.locator('#logs')).toHaveText(
      [
        `One: leave /named-one - /named-two`,
        `Aux: leave /named-one - /named-two`,
        `One: setup:leave /named-one - /named-two`,
        `Aux: setup:leave /named-one - /named-two`,
        `Two: enter /named-one - /named-two`,
        `Aux: enter /named-one - /named-two`,
      ].join('\n')
    )
  })
})
