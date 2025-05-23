import * as esbuild from 'esbuild'
import fs from 'node:fs/promises'
import path from 'node:path'
import fg from 'fast-glob'

await esbuild.build({
  entryPoints: [
    'src/renderer/index.tsx'
  ],
  bundle: true,
  sourcemap: true,
  outfile: 'dist/renderer.js',
  format: 'esm',
  loader: {
    '.png': 'file',
    '.svg': 'dataurl'
  }
})

// copy assets to the dist folder so imports from relative paths still work
for await (const asset of fg.stream([
  'src/**/*.html',
  'src/**/*.css'
], {})) {
  const dest = path.join('dist', asset)
  const dir = path.join('dist', path.dirname(asset))
  await fs.mkdir(dir, {
    recursive: true
  })
  await fs.cp(asset, dest)
}
