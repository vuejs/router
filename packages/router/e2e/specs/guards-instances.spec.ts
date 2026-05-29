import { test, expect, type Page } from '@playwright/test'

async function testCase(page: Page, name: string) {
  await page.locator('li:nth-child(2) a').click()
  await expect(page.locator(`#${name} .enterCbs`)).toContainText('1')
  await expect(page.locator(`#${name} .update`)).toContainText('0')
  await expect(page.locator(`#${name} .leave`)).toContainText('0')
  await page.locator('li:nth-child(3) a').click()
  await expect(page.locator(`#${name} .enterCbs`)).toContainText('2')
  await expect(page.locator(`#${name} .update`)).toContainText('0')
  await expect(page.locator(`#${name} .leave`)).toContainText('1')
  await page.locator('li:nth-child(4) a').click()
  await expect(page.locator(`#${name} .enterCbs`)).toContainText('2')
  await expect(page.locator(`#${name} .update`)).toContainText('1')
  await expect(page.locator(`#${name} .leave`)).toContainText('1')
  await page.locator('li:nth-child(5) a').click()
  await expect(page.locator(`#${name} .enterCbs`)).toContainText('2')
  await expect(page.locator(`#${name} .update`)).toContainText('2')
  await expect(page.locator(`#${name} .leave`)).toContainText('1')
  await page.locator('li:nth-child(2) a').click()
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

const baseURL = 'http://localhost:3000/guards-instances'

test.describe('guards-instances', () => {
  test('guards instances', async ({ page }) => {
    const name = 'Foo'
    await page.goto('http://localhost:3000/guards-instances/')
    await expect(page.locator('#app > *').first()).toBeVisible()

    await page.locator('#test-normal').click()

    await testCase(page, name)

    await page.locator('li:nth-child(1) a').click()
    // the enters are reset when leaving a reused component
    await page.locator('li:nth-child(2) a').click()
    await expect(page.locator(`#${name} .enterCbs`)).toContainText('1')
  })

  test('cancel pending pop navigations', async ({ page }) => {
    await page.goto(baseURL + '/')
    await expect(page.locator('#app > *').first()).toBeVisible()

    await page.locator('#test-normal').click()
    await page.locator('li:nth-child(11) a').click()
    await page.locator('li:nth-child(12) a').click()
    await page.locator('li:nth-child(13) a').click()
    await page.goBack()
    await page.goBack()
    await expect(page.locator('#app > #with-id-1')).toBeVisible()
    await expect(page).toHaveURL(baseURL + '/b/1?testCase=')
  })

  test('guards instances transition', async ({ page }) => {
    await page.goto('http://localhost:3000/guards-instances/')
    await expect(page.locator('#app > *').first()).toBeVisible()

    await page.locator('#test-transition').click()

    await testCase(page, 'Foo')
  })

  test('guards instances keep alive', async ({ page }) => {
    const name = 'Foo'
    await page.goto('http://localhost:3000/guards-instances/')
    await expect(page.locator('#app > *').first()).toBeVisible()

    await page.locator('#test-keepalive').click()

    await testCase(page, name)

    await page.locator('li:nth-child(1) a').click()
    // keep alive keeps the correct instance
    await page.locator('li:nth-child(2) a').click()
    await expect(page.locator(`#${name} .enterCbs`)).toHaveText('4')
    await page.locator('li:nth-child(1) a').click()
    await page.locator('li:nth-child(2) a').click()
    await expect(page.locator(`#${name} .enterCbs`)).toContainText('5')
    await page.locator('li:nth-child(3) a').click()
    await expect(page.locator(`#${name} .enterCbs`)).toContainText('6')
    // leave the update view and enter it again
    await page.locator('li:nth-child(1) a').click()
    await page.locator('li:nth-child(3) a').click()
    await page.locator('#resetLogs').click()
    await page.locator('li:nth-child(4) a').click()
    await page.locator('li:nth-child(1) a').click()
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
    await page.goto('http://localhost:3000/guards-instances/')
    await expect(page.locator('#app > *').first()).toBeVisible()

    await page.locator('#test-keyed').click()

    await testCase(page, name)

    await page.locator('li:nth-child(5) a').click()
    // the query is used as a key resetting the enter count
    await page.locator('li:nth-child(6) a').click()
    await expect(page.locator(`#${name} .enterCbs`)).toContainText('0')
    // changing both the route and mounting the component
    await page.locator('li:nth-child(2) a').click()
    await expect(page.locator(`#${name} .enterCbs`)).toContainText('1')
    await page.locator('li:nth-child(6) a').click()
    await expect(page.locator(`#${name} .enterCbs`)).toContainText('1')
    await expect(page.locator(`#${name} .update`)).toContainText('0')
    await expect(page.locator(`#${name} .leave`)).toContainText('0')
    await page.locator('li:nth-child(2) a').click()
    await expect(page.locator(`#${name} .enterCbs`)).toContainText('1')
    await expect(page.locator(`#${name} .update`)).toContainText('0')
    await expect(page.locator(`#${name} .leave`)).toContainText('0')
    await page.locator('li:nth-child(6) a').click()
    await expect(page.locator(`#${name} .update`)).toContainText('0')
    await expect(page.locator(`#${name} .leave`)).toContainText('0')
    await page.locator('#resetLogs').click()
    await page.locator('li:nth-child(7) a').click()
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
    await page.locator('li:nth-child(6) a').click()
    await expect(page.locator(`#${name} .enterCbs`)).toContainText('0')
  })

  test('guards instances keepalive keyed', async ({ page }) => {
    const name = 'Foo'
    await page.goto('http://localhost:3000/guards-instances/')
    await expect(page.locator('#app > *').first()).toBeVisible()

    await page.locator('#test-keepalivekeyed').click()

    await testCase(page, name)

    await page.locator('li:nth-child(1) a').click()
    // keep alive keeps the correct instance
    await page.locator('li:nth-child(2) a').click()
    await expect(page.locator(`#${name} .enterCbs`)).toContainText('4')
    await page.locator('li:nth-child(1) a').click()
    await page.locator('li:nth-child(2) a').click()
    await expect(page.locator(`#${name} .enterCbs`)).toContainText('5')
    await page.locator('li:nth-child(3) a').click()
    await expect(page.locator(`#${name} .enterCbs`)).toContainText('6')

    await page.locator('li:nth-child(5) a').click()
    // the query is used as a key resetting the enter count
    await page.locator('li:nth-child(6) a').click()
    await expect(page.locator(`#${name} .enterCbs`)).toContainText('0')
    await expect(page.locator(`#${name} .update`)).toContainText('0')
    await expect(page.locator(`#${name} .leave`)).toContainText('0')
    await page.locator('li:nth-child(1) a').click()
    await page.locator('li:nth-child(6) a').click()
    await expect(page.locator(`#${name} .enterCbs`)).toContainText('1')
    await expect(page.locator(`#${name} .update`)).toContainText('0')
    await expect(page.locator(`#${name} .leave`)).toContainText('1')
    await page.locator('li:nth-child(5) a').click()
    await expect(page.locator(`#${name} .enterCbs`)).toContainText('6')
    // on reused instance
    await page.locator('li:nth-child(2) a').click()
    await page.locator('li:nth-child(6) a').click()
    await expect(page.locator(`#${name} .enterCbs`)).toContainText('2')
    await expect(page.locator(`#${name} .update`)).toContainText('1')
    await expect(page.locator(`#${name} .leave`)).toContainText('1')
    await page.locator('#resetLogs').click()
    await page.locator('li:nth-child(7) a').click()
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
    await page.locator('li:nth-child(6) a').click()
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
    await page.goto('http://localhost:3000/guards-instances/named-one')
    await expect(page.locator('#app > *').first()).toBeVisible()

    await page.locator('li:nth-child(1) a').click()
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

    await page.locator('li:nth-child(9) a').click()
    await page.locator('#resetLogs').click()
    await page.locator('li:nth-child(10) a').click()
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
