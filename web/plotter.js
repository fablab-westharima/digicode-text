// 出力パネルの「プロッタ」タブ。シリアルモニタが受け取ったテキストをそのまま貰い、
// 数値として読めた行だけを系列に積んで Canvas に描く。読めない行は捨てる(モニタには出る)。
// 系列の色は app.css の --plot-1 … --plot-8(テーマの accent と uno/duo 階調から作った変数)。
import { parseSample, splitLines } from './plotter-parse.js';
import { onSerialData } from './serial.js';

const $ = (id) => document.getElementById(id);
const MAX_SERIES = 8;
const SAMPLES = { min: 100, max: 5000, initial: 500 };
const PAD = { left: 8, right: 8, top: 8, bottom: 8 };

const round = (value) => Number(value.toFixed(3)).toString();

export function setupPlotter() {
  const canvas = $('plot-canvas');
  const ctx = canvas.getContext('2d');
  const series = new Map(); // label → 直近の値の配列(古い順)
  let limit = SAMPLES.initial;
  let paused = false;
  let buffer = '';
  let colors = [];

  // 色はテーマ変数から読む。テーマを切り替えると :root の値が変わるので、描く前に読み直す。
  function readColors() {
    const style = getComputedStyle(document.documentElement);
    colors = Array.from({ length: MAX_SERIES }, (_, i) => style.getPropertyValue(`--plot-${i + 1}`).trim());
  }

  function add(text) {
    const split = splitLines(buffer, text);
    buffer = split.rest;
    let added = false;
    for (const line of split.lines) {
      const samples = parseSample(line);
      if (!samples) continue;
      for (const { label, value } of samples) {
        if (!series.has(label)) {
          if (series.size >= MAX_SERIES) continue; // 9 本目からは無視する
          series.set(label, []);
        }
        const values = series.get(label);
        values.push(value);
        if (values.length > limit) values.splice(0, values.length - limit);
        added = true;
      }
    }
    return added;
  }

  function bounds() {
    let min = Infinity, max = -Infinity;
    for (const values of series.values()) for (const value of values) {
      if (value < min) min = value;
      if (value > max) max = value;
    }
    if (min === Infinity) return null;
    if (min === max) { min -= 1; max += 1; } // 平らな信号でも線が真ん中に出るように
    return { min, max };
  }

  function renderLegend(range) {
    $('plot-legend').replaceChildren(...[...series].map(([label, values], i) => {
      const item = document.createElement('span');
      item.className = 'plot-series';
      const swatch = document.createElement('i');
      swatch.style.background = `var(--plot-${(i % MAX_SERIES) + 1})`;
      swatch.setAttribute('aria-hidden', 'true');
      const text = document.createElement('span');
      text.textContent = values.length ? `${label} ${round(values.at(-1))}` : label;
      item.append(swatch, text);
      return item;
    }));
    $('plot-status').textContent = range
      ? `最小 ${round(range.min)} / 最大 ${round(range.max)} · ${[...series.values()].reduce((n, v) => Math.max(n, v.length), 0)} / ${limit} サンプル${paused ? '（一時停止中）' : ''}`
      : '数値の行を待っています。「12, 34」や「temp:25.5 hum:40」の形で送ってください';
  }

  function draw() {
    const width = canvas.clientWidth, height = canvas.clientHeight;
    if (!width || !height) return; // タブが隠れている間は描かない
    const scale = devicePixelRatio || 1;
    if (canvas.width !== Math.round(width * scale) || canvas.height !== Math.round(height * scale)) {
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
    }
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const range = bounds();
    renderLegend(range);
    if (!range) return;
    if (!colors.length) readColors();
    const plot = { x: PAD.left, y: PAD.top, w: Math.max(1, width - PAD.left - PAD.right), h: Math.max(1, height - PAD.top - PAD.bottom) };
    const y = (value) => plot.y + plot.h - ((value - range.min) / (range.max - range.min)) * plot.h;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    let index = 0;
    for (const values of series.values()) {
      ctx.strokeStyle = colors[index % MAX_SERIES] || '';
      index++;
      if (!values.length) continue;
      ctx.beginPath();
      // 横軸は「直近 limit サンプル」。右端がいちばん新しい値になる。
      const step = plot.w / Math.max(1, limit - 1);
      const start = plot.x + plot.w - (values.length - 1) * step;
      values.forEach((value, i) => {
        const px = start + i * step;
        if (i === 0) ctx.moveTo(px, y(value)); else ctx.lineTo(px, y(value));
      });
      ctx.stroke();
    }
  }

  // 描画は受信のたびではなく次のフレームで 1 回。1 秒に何百行来ても描画は追い越さない。
  let frame = 0;
  function schedule() {
    if (frame) return;
    frame = requestAnimationFrame(() => { frame = 0; draw(); });
  }

  onSerialData(text => {
    if (paused) return;
    if (add(text)) schedule();
  });

  $('plot-pause').onclick = () => {
    paused = !paused;
    $('plot-pause').textContent = paused ? '再開' : '一時停止';
    $('plot-pause').setAttribute('aria-pressed', String(paused));
    draw();
  };
  $('plot-clear').onclick = () => { series.clear(); buffer = ''; draw(); };
  $('plot-samples').oninput = () => {
    const value = Number($('plot-samples').value);
    if (!Number.isFinite(value)) return;
    limit = Math.round(Math.max(SAMPLES.min, Math.min(SAMPLES.max, value)));
    for (const values of series.values()) if (values.length > limit) values.splice(0, values.length - limit);
    draw();
  };
  // タブを開いた瞬間に幅が 0 から実寸になる。そこで一度描き直す。
  new ResizeObserver(() => draw()).observe($('plot-area'));
  new MutationObserver(() => { readColors(); draw(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  readColors();
  draw();
  return { draw };
}
