import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: [
    'src/app.tsx'
  ],
  bundle: true,
  outfile: 'dist/app.js',
  format: 'esm',
  loader: {
    '.png': 'file',
    '.svg': 'dataurl'
  }
})

await esbuild.build({
  entryPoints: [
    'src/service-worker.ts'
  ],
  bundle: true,
  outfile: 'dist/service-worker.js',
  format: 'esm',
  loader: {
    '.png': 'file',
    '.svg': 'dataurl'
  }
})

await esbuild.build({
  entryPoints: [
    'src/content-script.ts'
  ],
  bundle: true,
  outfile: 'dist/content-script.js',
  format: 'esm',
  loader: {
    '.png': 'file',
    '.svg': 'dataurl'
  }
})
