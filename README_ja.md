# Reading Spotlight

[English](README.md)

マウスカーソルに追従するスポットライトオーバーレイで、テキストへの集中を支援する Chrome 拡張機能です。

学術研究に基づいています：

- [Visual Crowding](https://link.springer.com/article/10.3758/s13414-023-02787-1) - Attention, Perception & Psychophysics (2023)
- [Visual Stress / Irlen Syndrome](https://irlen.com/colored-overlays/) - カラーオーバーレイ研究

## 機能

### 基本機能

- マウスの動きに追従するスポットライトオーバーレイ
- スポットライト表示中はカーソル非表示（スポットライト中心 = マウス位置）
- スポットライトサイズ（幅・高さ）のカスタマイズ
- 複数のカラーオプション（黄、青、緑、ピーチ、グレー、アクア、レインボー）
- 周囲の暗さ（ディム）の調整
- ソフトエッジ機能で視覚的ストレスを軽減（研究に基づく）
- オン/オフ切り替え
- キーボードショートカット（カスタマイズ可能）

### リーディングモード

- 読んでいる行に集中するためのY位置固定
- X位置のみマウスに追従
- Return Sweep（行の折り返し）による眼精疲労を軽減（アイトラッキング研究に基づく）

### レインボーモード

- マウスのX位置に応じて色相が変化するダイナミックカラー
- 読書中の視覚的な楽しさを追加

### Pro機能

- パーソナライズされたオーバーレイ色のためのカスタムカラーピッカー

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

| コマンド              | 説明                                     |
| --------------------- | ---------------------------------------- |
| `npm run dev`         | ウォッチモードで開発開始                 |
| `npm run build`       | プロダクションビルド                     |
| `npm run check`       | 型チェック、リント、フォーマットチェック |
| `npm run test`        | E2E テスト実行                           |
| `npm run format`      | Prettier でコードフォーマット            |
| `npm run screenshots` | ストア用スクリーンショット生成           |

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
├── scripts/
│   └── screenshots.ts
├── store/
│   ├── demo.html
│   ├── description_en.txt
│   ├── description_ja.txt
│   └── screenshots/
├── tests/
│   └── spotlight.spec.ts
└── dist/
```

## ライセンス

MIT License - 詳細は [LICENSE](LICENSE) を参照
