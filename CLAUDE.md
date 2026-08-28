# DigiCode Text — Claude Code Bootstrap

## DigiCode Text 固有の最低限事項

* DigiCode Text は既存DigiCodeとは独立したプロジェクトであり、forkではない。DigiCode側のgovernance / prompt / orchestrationを継承しない。
* DigiCodeを参照する必要がある場合は、objectiveに必要な技術的evidenceだけをread-onlyで扱う。donor側を変更・統合・subtree化・fork化しない。
* 中核価値は、Board / Toolchain / Framework / Device Library / Dependency / Version / Compatibilityをmanaged environmentとして管理し、CompilerとAIが同じ正本を利用できること。
* AIは製品の主要機能であり、LSPの成立そのものを製品成立条件としない。
* 「初心者」は「子供向け」「機能を減らす」の意味ではない。専門領域を持つ組込初心者を含み、「簡単」は必要機能を削ることではなく扱いやすくすることを指す。
* 専用Compilerを持つ方針。donor由来技術を利用する場合も、donorの既存前提を無条件に継承しない。
* RegistryはVerified / Customの二層を基本とし、CustomからVerifiedへの昇格経路を持つ。closed ecosystemや全組合せ保証、人力更新だけを前提にしない。
* Webを主製品として扱い、Desktop展開も視野に入れる。具体的stack、deployment target、互換範囲はHumanが確定するまで未決定として扱う。
* server-side LSPを必須backendとしない。Monacoは現時点の第一候補だが、過去候補を確定仕様として扱わない。
* repoはpublic、licenseはAGPL-3.0。secret / credentialをrepository、commit、report等へ含めない。
* 製品について未測定のものを測定済みと扱わない。実機flash、hardware write、production contact、installer build等の未実施事実を勝手に埋めない。
* 過去の製品判断・調査・S010成果は `prompt/maintenance/local/` 配下に保存されている。必要なwork unitで必要な資料だけ読む。
* S010のmanaged-environment設計を参照する場合は、少なくとも `05_integration-falsification.md` と `06_corrected-architecture.md` の順序・上書き関係を確認し、`04_integrated-architecture.md` を最新結論として扱わない。
* 確定したHuman裁定のownerは `prompt/maintenance/local/docs/human-decisions.md`。製品判断で迷った場合はまずこれを読む。過去のinvestigation / session logはimmutableなevidenceであり、裁定のownerではない。
* S010は2026-08-29にHumanが分割受理し、BLOCKEDは解除済み。反証結論と実測値は受理、**Option Cの採用は受理されておらずPoCの作業仮説**、D-1〜D-8は決定済み。**Option Cを採用済み設計として扱わない。** checkpoint `a6212af` は当時の保存commitであり、この受理を意味しない。
