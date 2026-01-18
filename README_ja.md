# Reading Spotlight

[English](README.md)

マウスカーソルに追従するスポットライトオーバーレイで、テキストへの集中を支援する Chrome 拡張機能です。

CHI 2023 の読書支援・集中力向上に関する研究に基づいています。

## 機能

- マウスの動きに追従するスポットライトオーバーレイ
- スポットライトサイズ（幅・高さ）のカスタマイズ
- 複数のカラーオプション（黄、青、緑、ピーチ、グレー、アクア）
- 周囲の暗さ（ディム）の調整
- 最適化されたパフォーマンスによるスムーズな追従
- オン/オフ切り替え
- キーボードショートカット（カスタマイズ可能）

## インストール

### Chrome ウェブストアから

準備中

### 手動インストール（開発者モード）

1. リポジトリをクローン:

   ```bash
   git clone https://github.com/TUCCHI1/text-magnifier.git
   cd text-magnifier
   ```

2. 依存関係をインストール:

   ```bash
   npm install
   ```

3. ビルド:

   ```bash
   npm run build
   ```

4. Chrome に読み込み:
   - `chrome://extensions/` を開く
   - 「デベロッパーモード」を有効化
   - 「パッケージ化されていない拡張機能を読み込む」をクリック
   - `dist` フォルダを選択

## 使い方

1. ツールバーの拡張機能アイコンをクリックして設定を開く
2. 拡張機能のオン/オフを切り替え
3. スポットライトの幅と高さを調整
4. ハイライトの色を選択
5. 周囲のディム（暗さ）を設定

スポットライトは任意のウェブページでマウスカーソルに自動追従します。

### キーボードショートカット

- **Windows/Linux**: `Ctrl+Shift+S`
- **Mac**: `Cmd+Shift+S`

ショートカットのカスタマイズは `chrome://extensions/shortcuts` から行えます。

## 開発

### 必要環境

- Node.js >= 24.0.0
- npm >= 11.0.0

### スクリプト

| コマンド         | 説明                                     |
| ---------------- | ---------------------------------------- |
| `npm run dev`    | ウォッチモードで開発開始                 |
| `npm run build`  | プロダクションビルド                     |
| `npm run check`  | 型チェック、リント、フォーマットチェック |
| `npm run test`   | E2E テスト実行                           |
| `npm run format` | Prettier でコードフォーマット            |

### プロジェクト構成

```
├── src/
│   ├── entrypoints/
│   │   ├── background.ts
│   │   ├── content.ts
│   │   └── popup/
│   │       ├── main.ts
│   │       └── index.html
│   ├── lib/
│   │   └── spotlight.ts
│   └── public/
│       ├── manifest.json
│       └── icons/
├── tests/
│   ├── fixtures/
│   └── spotlight.spec.ts
└── dist/
```

## ライセンス

MIT License - 詳細は [LICENSE](LICENSE) を参照
