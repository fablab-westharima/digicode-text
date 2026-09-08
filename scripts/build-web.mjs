import { build } from 'esbuild';

await build({
  entryPoints: {
    app: 'web/app.js',
    'editor.worker': 'node_modules/monaco-editor/esm/vs/editor/editor.worker.js',
  },
  outdir: 'web/dist',
  bundle: true,
  format: 'esm',
  minify: true,
  loader: { '.ttf': 'file' },
  logLevel: 'info',
});
