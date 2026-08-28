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

## Maintenance notes

Project固有のClaude Code instructionは `CLAUDE.md` にあります。

調査・設計・session history等のproject evidenceは `prompt/maintenance/local/` に保存しています。navigationは `prompt/maintenance/local/README.md` を参照してください。

`prompt/maintenance/local/legacy/` 以下は退役済み構造のhistorical archiveであり、current instructionやcurrent Objectiveではありません。

## セキュリティ方針 🔴

このリポジトリは **PUBLIC** であり、`prompt/` と `CLAUDE.md` を **git 追跡している**(運用履歴を正式なプロジェクト履歴として残すため)。したがって:

- **secret / credential / token / 鍵 / 個人情報 / 非公開 URL をこのリポジトリに書かない。**「あとで伏字にする」ではなく「最初から書かない」。
- commit / push のたびに staged secret scan が走る(`.claude/hooks/pre-commit-gate.sh`)。ドキュメントのみの commit でも例外にしない。
