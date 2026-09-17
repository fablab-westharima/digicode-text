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
  // 書き込み前ガイドの線画は web/figures/*.svg をそのまま文字列として取り込み、DOM へ差し込む。
  loader: { '.ttf': 'file', '.svg': 'text' },
  logLevel: 'info',
});
