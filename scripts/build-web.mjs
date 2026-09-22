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
  // compile サーバーの既定の置き場所。未設定なら空＝このページを配っているのと同じサーバー。
  // 別オリジンへ配るときだけ COMPILER_BASE_URL=https://… npm run build:web で差し替える。
  // 利用者が設定で入れた値のほうが強い（web/compiler-url.js）。
  define: { __COMPILER_BASE__: JSON.stringify(process.env.COMPILER_BASE_URL ?? '') },
  logLevel: 'info',
});
