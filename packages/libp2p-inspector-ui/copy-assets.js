import fs from 'node:fs/promises'
import path from 'node:path'
import fg from 'fast-glob'

// copy assets to the dist folder so imports from relative paths still work
for await (const asset of fg.stream([
  'public/**/*',
  'src/**/*.css'
], {})) {
  const dest = path.join('dist', asset)
  const dir = path.join('dist', path.dirname(asset))
  await fs.mkdir(dir, {
    recursive: true
  })
  await fs.cp(asset, dest)
}
