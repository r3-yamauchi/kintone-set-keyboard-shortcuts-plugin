# kintone ショートカットキー制御プラグイン

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/r3-yamauchi/kintone-set-keyboard-shortcuts-plugin)

このプラグインは kintone標準のキーボードショートカットキーについて、アプリの各画面における有効／無効を切り替えるシンプルなユーティリティです。

## 主な機能

- 設定画面でショートカットごとのトグルを操作して有効／無効を選択
- 画面単位の「一括有効／無効」トグルで素早く切り替え
- レコード一覧、レコード詳細／編集、レコード追加／再利用の 3 画面に対応
- 設定内容に基づき、該当画面の表示イベントで `kintone.setKeyboardShortcuts` を呼び出し反映

## 動作前提

- kintone 環境（PC 版）でプラグインが利用可能であること
- モバイル画面では `kintone.setKeyboardShortcuts` がサポートされていないため対象外です

## 設定手順

1. プラグイン設定画面で各画面のショートカット一覧を確認します。
2. 不要なショートカットのトグルをオフにします。必要に応じて画面上部の「一括で有効にする」トグルで一括切り替えを行います。
3. `保存` を押してアプリの設定を更新すると、設定したショートカット状態が反映されます。

## 仕組み

- プラグイン設定は JSON 形式で保持し、画面ごとのショートカットを真偽値で管理します。
- 対象イベント（一覧：`app.record.index.show`、詳細／編集：`app.record.detail.show` `app.record.edit.show`、追加／再利用：`app.record.create.show`）で設定値を読み込み `kintone.setKeyboardShortcuts` を呼び出します。
- すべて有効の場合は `true`、すべて無効の場合は `false`、混在する場合は「アクション名 → 真偽値」のオブジェクトを渡します。

---

## 開発者向け情報

このプロジェクトは [kintone-plugin-template](https://github.com/tasshi-me/kintone-plugin-template) をベースに移行されました。

### 必要要件

- Node.js (`.node-version`ファイルで指定されたバージョンを推奨)
- npm

### セットアップ

```bash
# 依存関係のインストール
npm install

# プライベートキーの生成（初回のみ）
npx @kintone/plugin-packer --ppk private.ppk --init
```

### 開発コマンド

| コマンド                | 説明                                             |
| ----------------------- | ------------------------------------------------ |
| `npm start`             | 開発サーバー起動（ビルド + アップロード + 監視） |
| `npm run build`         | プロダクションビルド                             |
| `npm run build:js`      | JavaScriptのビルドのみ                           |
| `npm run build:package` | プラグインパッケージの作成のみ                   |
| `npm run lint`          | リントチェック                                   |
| `npm run fix`           | リントの自動修正                                 |
| `npm run upload`        | プラグインのアップロード                         |

### プロジェクト構造

```
.
├── src/
│   ├── config/          # 設定画面（React）
│   ├── desktop/         # デスクトップ版（TypeScript）
│   ├── helpers/         # ヘルパー関数
│   └── types/           # 型定義
├── public/
│   └── manifest.json    # プラグインマニフェスト
├── lib/                 # ビルド出力先
├── dist/                # プラグインパッケージ出力先
└── rsbuild.config.ts    # Rsbuild設定
```

## ライセンス

- 本プラグインは AGPL-3.0 ライセンスです。

**「kintone」はサイボウズ株式会社の登録商標です。**

ここに記載している内容は情報提供を目的としており、個別のサポートはできません。
設定内容についてのご質問やご自身の環境で動作しないといったお問い合わせをいただいても対応はできませんので、ご了承ください。
