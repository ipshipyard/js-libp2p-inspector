import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: [
    'renderer/index.tsx'
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
