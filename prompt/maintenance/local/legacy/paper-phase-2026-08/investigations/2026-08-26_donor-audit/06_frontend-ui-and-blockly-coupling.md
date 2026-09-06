# 06_frontend-ui — UI shell と Blockly 結合 (Phase 2)

**donor:** `DigiCode@bb35c3b` `variants/ota/frontend/src` (tracked 343 ファイル)
**調査方法:** 静的読解 + 全 src に対する `grep -rl "from 'blockly"`。**型ラベル: static のみ** (ブラウザで起動して見ていない → 見た目・挙動は未verify)

---

## 1. 🟢 最重要 — Blockly 結合は非常に局所的

`from 'blockly'` を import するファイルは **全 343 中 86 件**。その内訳:

| 区分 | 件数 | 備考 |
|---|---|---|
| `blocks/**` (block 定義 + generator) | 76 | Text 版で不要になる本体 |
| `blocks/__tests__/**` | (上記に含む 5) | |
| `components/editor/` の Blockly 専用 | **5** | `BlocklyEditor.tsx` / `CustomToolbox.tsx` / `blocklyTheme.ts` / `blocklyContrast.ts` / `Controller/inferWifiUiSchema.ts` |
| `utils/blocklyMessages.ts` | **1** | |
| `services/ai/blocklyDryRun.ts` | **1** | AI 検証器 |

→ **UI shell 側で Blockly を直接触るのは実質 6 ファイル。** `components/editor` の残り 41 件、`pages` 17 件、`stores` 13 件、`services` 14 件は **import レベルで Blockly 非依存**。

> ⚠️ import レベルの非依存は**意味的な非依存ではない**。実例が §3 (保存形式が Blockly XML)。この節の分類は「置き換えの物理的な難易度」であって「Text でそのまま使える」ではない。

## 2. UI 構成要素の分類

**routing:** `react-router-dom` の `BrowserRouter`。`ProtectedRoute` (auth 必須) と公開ルートに分かれる (`App.tsx:192-226`)。

| 要素 | ファイル | 分類 |
|---|---|---|
| Blockly workspace | `BlocklyEditor.tsx` / `CustomToolbox.tsx` / `toolbox*.ts` / `blocklyTheme.ts` / `blocklyContrast.ts` | **Blockly に完全依存** → Text では Text Editor に置換 |
| Board selector | `BoardSelector.tsx` | **Text でもそのまま有用** (experimental バッジ機構込み) |
| Code preview | `CodePreview.tsx` | **Blockly と部分 coupling** (生成結果の表示先。Text では編集対象そのもの) |
| Toolbar / Sidebar / StatusBar | `LinearToolbar.tsx` / `Sidebar.tsx` / `StatusBar.tsx` | **Blockly から容易に分離可能** (未verify: 中身に toolbox 前提が無いか要確認) |
| AI UI | `AIAssistantPanel.tsx` / `AIAssistantDialog.tsx` | **部分 coupling** (出力が XML 前提の箇所のみ) |
| プロジェクト UI | `ProjectListDialog.tsx` / `SaveProjectDialog.tsx` / `SampleProjectsDialog.tsx` / `ProjectsPage.tsx` | **改修が必要** (§3 の保存形式に依存) |
| Compile 設定 | `CompileServerSettingsPage.tsx` / `components/settings/` | **Text でもそのまま有用** |
| Serial | `components/serial/` + `services/serialService.ts` | **Text でもそのまま有用** (Blockly 非依存) |
| 書き込み | `services/{usbFirmwareService,bleFirmwareService,firmwareService,bluetoothService}.ts` / `FirmwareInstaller.tsx` | **Text でもそのまま有用** (Write クラスタで詳細確認) |
| WiFi | `components/wifi/` / `wifiService.ts` / `wifiStore.ts` | Classic の OTA 運用向け。**Text 版の要否は Wi-Fi OTA 初期不採用と連動** |
| Servo 補助 | `components/servo/` (8) / `ServoTrimDialog` | **再評価対象** (企画書 §19) |
| PID tuning | `services/pid/` (6) / `pidTuningStore.ts` / `components/tuning/` | **再評価対象** |
| PIN 設定 | `components/pins/` / `PinSettingsPage.tsx` / `pinPresetStore.ts` / `PinPresetDialog.tsx` | **Text では不採用候補** (企画書 §8: コードを正本にする) |
| auth / class / 課金 | `components/auth/` (18) / `components/classes/` (5) / `components/plan/` / `AdminPage` / `ClassesPage` / `PlanPage` / `AssignmentSubmissionsPage` / `authStore` / `authService` / `subscriptionService` / `passkeyService` / `classService` | **Text では不採用** (裁定・企画書ともに一致) |
| Docs / About / Help | `DocsPage.tsx` / `AboutPage.tsx` / `HelpAPIKeysPage.tsx` / `HelpLocalLLMPage.tsx` | **Text でもそのまま有用** (内容は差し替え) |
| i18n | `i18n/locales/` 5 言語 | **改修流用** (仕組みは流用、文言は入替) |
| shadcn/ui プリミティブ | `components/ui/` 21 | **そのまま流用可能** |

## 3. 🔴 保存の実態が企画書の前提と食い違う

`stores/projectStore.ts` は **すべて API 経由** (`lib/api.ts` → backend `routes/projects.ts` → D1)。データモデルは:

```ts
interface Project { id: number; title: string; description?: string;
                    blocklyXml: string; generatedCode?: string; ... }
```

- **プロジェクトの正本は `blockly_xml` というサーバ側カラム。** ローカル保存中心ではない。
- `loadProjects / loadProject / createProject / saveProject / deleteProject` はすべて `api.projects.*` を叩く。**auth 必須**。
- **autosave は存在しない。** src 全体を `autosave|autoSave|indexedDB|OPFS|showSaveFilePicker|showOpenFilePicker` で走査したが、**プロジェクトの自動保存・クラッシュ復旧の実装は 0 件**。`localStorage` は zustand persist による設定類 (ai-store / auth / compile server 設定など) にのみ使われている。
- ローカル入出力は **`.digicode` JSON ファイルの import/export のみ** (`services/projectFileReader.ts`: `parseDigicodeFileContent` / `serializeDigicodeProjectFile`、`JSON.stringify(data, null, 2)`)。File System Access API は使っていない。

→ **企画書 §13.1「DigiCode と同じく auth 付き Cloud project 保存を前提にしない。ローカル保存を中心とする」の「DigiCode と同じく」は donor の実態と異なる。** Classic は **auth 付き Cloud 保存が正本**で、ローカルは import/export の補助にすぎない。
→ したがって **Storage / Autosave / crash recovery は donor に流用元がほぼ無く、ほぼ全面的に新規実装**になる。企画書 §24 が候補として挙げる IndexedDB / OPFS / File System Access API は、donor に前例が 1 つも無い。

## 4. verdict

| 対象 | verdict |
|---|---|
| `components/ui/` (shadcn プリミティブ)、`LinearToolbar` | **そのまま流用可能** |
| `Sidebar` / `StatusBar` | **改修流用** (auth / featureFlag / classServerHealth の結線を外す) |
| BoardSelector (experimental バッジ含む) | **そのまま流用可能** |
| Serial UI + serialService | **そのまま流用可能** |
| Compile 設定 UI | **そのまま流用可能** |
| routing 構造 | **改修流用** (ProtectedRoute 系を落とす) |
| i18n 5 言語の仕組み | **改修流用** |
| AI UI | **改修流用** |
| `BlocklyEditor` / `CustomToolbox` / `toolbox*` / `blocklyTheme` / `blocklyContrast` / `blocklyMessages` | **Text では不採用** |
| `blocks/**` (76 ファイル) | **Text では不採用** (ただし Device→Library 対応の抽出元として価値あり = §04) |
| PIN assignment UI | **Text では不採用候補** |
| auth / class / 課金 UI 一式 | **Text では不採用** |
| プロジェクト保存 (store + API + データモデル) | **新規実装が必要** |
| autosave / crash recovery | **新規実装が必要** (donor に存在しない) |
| Servo Trim / PID tuning / USB utility / device diagnostics | **追加調査必要** (再評価対象、実機価値の判断が要る) |

## 5. risk / remaining unknown

- ✅ **解消**: Sidebar / StatusBar / LinearToolbar を確認した。**Blockly 結合は無い**が、**auth / plan 結合がある** — `Sidebar.tsx` は `useAuthStore` / `useFeatureFlagStore` / `useClassServerHealthStore` を、`StatusBar.tsx` は `useFeatureFlagStore` + `featureFlagPresets` / `featureFlagStatus` を import する。`LinearToolbar.tsx` は clean (`BoardSelector` / `RobotModeSelector` / `LocaleSelector` / `compileService` のみ)。
  → **shell の流用で外すべきは Blockly ではなく auth / feature-flag の結線**。verdict は ①→**②(改修流用)** に修正する。
- 🟡 UI を**実際にブラウザで表示していない**。rule 04 §「存在チェックは見た目を見られない」に従い、外観・操作性については何も主張しない。
- 🔴 保存モデルの差は、企画書の前提そのものに関わるため **Human に上げる finding**。
