# digicode-text

ブラウザ上で **通常のテキストコード** を編集し、マイコン向けのビルドから書き込みまでを行う Web アプリケーション。ブロックエディタではない。

**現状: bootstrap 直後。アプリケーションコードはまだ 1 行も存在しない。**

このリポジトリには現在、開発を運用するための **ガバナンス・ハーネス**(ルール体系・引き継ぎ書・自己検証スクリプト)だけが入っている。製品仕様・技術スタック・デプロイ先・DigiCode 互換範囲はいずれも未確定で、**DigiCode donor audit の後にユーザーが確定する**。

---

## このプロジェクトの位置づけ

- **`Project_Template` から bootstrap された独立した新規プロジェクト**である。他プロジェクトの fork ではなく、git history はこのリポジトリ自身の Initial commit から始まる。
- **DigiCode は将来の donor(供与元)リポジトリ**として READ ONLY で監査し、必要な技術資産だけを選択移植する予定。移植の際は donor repository / donor commit SHA / donor path / import date / imported asset / excluded legacy governance を migration evidence として記録する。
- DigiCode の**旧ガバナンス**(旧 `CLAUDE.md` / rules / handover / sessions / 判断ミス履歴 / orchestration 実体)および **DigiCode の git history そのもの**は、いかなる形でも取り込まない。

| 項目 | 値 |
|---|---|
| bootstrap 元 | `fablab-westharima/Project_Template` |
| テンプレート断面 | `088b1c3` (`v2026-08-13-106-g088b1c3`) |
| bootstrap 日 | 2026-08-25 |
| ライセンス | AGPL-3.0(このリポジトリ自身の Initial commit 由来) |

---

## 構成

```
digicode-text/
├── CLAUDE.md                 Claude Code セッション向けの索引(現在地は保持しない)
├── AGENTS.md                 委譲エージェント向け指示(プロジェクト固有・持ち出し禁止)
├── LICENSE                   AGPL-3.0
├── scripts/                  ハーネス計器(selftest / baseline / read-load / mutation / 各種 scan)
├── .claude/                  SessionStart hook(コールドスタート自動注入)/ pre-commit secret gate / /close
└── prompt/maintenance/
    ├── global/               テンプレート由来・プロジェクト非依存(rules/ templates/)
    └── local/                このプロジェクト固有
        ├── handover/         16.md = 現在地(唯一の owner)/ sessions/ = 不変の履歴 / 改定log
        ├── rules/digicode-text/
        ├── docs/             routing-profile.md(model / effort mapping の唯一の owner)
        ├── bugs/  plans/  investigations/  legacy/
```

**現在地は `prompt/maintenance/local/handover/16_次セッション引き継ぎ指示書.md` にある。**この README を含め、他のどのファイルも現在地の owner ではない。

---

## 開発者・エージェント向け

セッション開始時は `CLAUDE.md` §0 のコールドスタート手順に従う(SessionStart hook が引き継ぎ書を自動注入する)。読む範囲は `bash scripts/read-load.sh` が出力する。

ハーネスの健全性:

```bash
bash scripts/read-load.sh                # 必読集合とその範囲・コスト
bash scripts/baseline.sh                 # baseline 表
bash scripts/selftest.sh; RC=$?          # ハーネス不変条件(RC は単独行で取得。pipe を通さない)
bash scripts/placement-scan.sh; RC=$?    # rule 15 ファイル配置契約
```

## セキュリティ方針 🔴

このリポジトリは **PUBLIC** であり、`prompt/` と `CLAUDE.md` を **git 追跡している**(運用履歴を正式なプロジェクト履歴として残すため)。したがって:

- **secret / credential / token / 鍵 / 個人情報 / 非公開 URL をこのリポジトリに書かない。**「あとで伏字にする」ではなく「最初から書かない」。
- commit / push のたびに staged secret scan が走る(`.claude/hooks/pre-commit-gate.sh`)。ドキュメントのみの commit でも例外にしない。
