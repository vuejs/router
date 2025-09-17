import * as fs from 'node:fs/promises'

async function patchVueRouterDts() {
  const content = await fs.readFile('./src/globalExtensions.ts', {
    encoding: 'utf-8',
  })
  const moduleAugmentationIdx = content.indexOf('/**')
  if (moduleAugmentationIdx === -1) {
    throw new Error(
      'Cannot find module augmentation in globalExtensions.ts, first /** comment is expected to start module augmentation'
    )
  }
  const targetContent = await fs.readFile('./dist/vue-router.d.ts', {
    encoding: 'utf-8',
  })
  await fs.writeFile(
    './dist/vue-router.d.ts',
    `${targetContent}
${content.slice(moduleAugmentationIdx)}    `,
    { encoding: 'utf8' }
  )
}

patchVueRouterDts()
