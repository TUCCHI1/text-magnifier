# Changelog

## [0.1.2](https://github.com/TUCCHI1/text-magnifier/compare/reading-spotlight-v0.1.1...reading-spotlight-v0.1.2) (2026-01-20)

### Bug Fixes

- Enable content script in all frames for iframe support ([f1881fd](https://github.com/TUCCHI1/text-magnifier/commit/f1881fd95c20e128919ace2aafec1ab67c6b3ef2))
- Use GitHub auto-merge to wait for CI before merging release PR ([c2eb8c0](https://github.com/TUCCHI1/text-magnifier/commit/c2eb8c0ef36546923493df10dfa7938ec239a3d2))

## [0.1.1](https://github.com/TUCCHI1/text-magnifier/compare/reading-spotlight-v0.1.0...reading-spotlight-v0.1.1) (2026-01-18)

### Features

- Add author credit to popup footer ([3c388b6](https://github.com/TUCCHI1/text-magnifier/commit/3c388b64413c46d750b0feda37934adeb38b76b4))
- Add Biome linter and formatter ([619cc2d](https://github.com/TUCCHI1/text-magnifier/commit/619cc2dac3aa59f97f20f2cf0af3d43647dfd4a0))
- Add color customization based on visual stress research ([a6eeeb3](https://github.com/TUCCHI1/text-magnifier/commit/a6eeeb378d748ee15474788566cdffc83782cfc0))
- Add config types for Pro and reading mode ([6c45259](https://github.com/TUCCHI1/text-magnifier/commit/6c452596a345aae8b4a387f0030537f7353488d4))
- Add demo page for screenshots ([53738ff](https://github.com/TUCCHI1/text-magnifier/commit/53738ffa2347ed406166c291b3a3d551433ec370))
- Add flowing rainbow animation with glow effect ([227ebce](https://github.com/TUCCHI1/text-magnifier/commit/227ebce09044ca81763a0768c74410ed59254f99))
- Add keyboard shortcut for quick toggle ([356d531](https://github.com/TUCCHI1/text-magnifier/commit/356d531104fd0dfeabacb2c78fdb976286e54aac))
- Add Playwright screenshot automation script ([32eba26](https://github.com/TUCCHI1/text-magnifier/commit/32eba268e994b6f409da5fb439787aa4cba9f49d))
- Add Pro and reading mode UI ([b85e8f4](https://github.com/TUCCHI1/text-magnifier/commit/b85e8f4a11e033a233bebe0ac240afc0229f0d3e))
- Add rainbow color mode ([9b6cd6c](https://github.com/TUCCHI1/text-magnifier/commit/9b6cd6ce8111a1c2490e4e126171dd6513ad1158))
- Add watch mode for development ([c177e2d](https://github.com/TUCCHI1/text-magnifier/commit/c177e2dd72e52bb415131b31e9762b00ad24bb9b))
- Implement reading mode with cursor auto-hide ([9de05d2](https://github.com/TUCCHI1/text-magnifier/commit/9de05d2d3650983be58553820a7ba4540d007288))
- Playwright E2Eテストを追加 ([e9983c9](https://github.com/TUCCHI1/text-magnifier/commit/e9983c9faa5674f71dcaf4d0490e795a26dc92ca))
- Research-based UI/UX redesign for accessibility ([bab26bf](https://github.com/TUCCHI1/text-magnifier/commit/bab26bf321061ab3d58680383309c8e2c2999209))
- ポップアップUIから設定変更可能に ([960396f](https://github.com/TUCCHI1/text-magnifier/commit/960396f6761a380d7cf8a7980e39dbe9e5e538c8))
- 中央から押し広げるアニメーションに変更 ([eaa7787](https://github.com/TUCCHI1/text-magnifier/commit/eaa7787567ef472ab1b7b191972d41b45ab040c3))
- 単語幅に基づく動的マージン計算で重なりを解消 ([0cdd7ed](https://github.com/TUCCHI1/text-magnifier/commit/0cdd7edb505d1d2d6cbd2a29da306041bebdcddc))
- 手動操作テストモードを追加 ([397f6b1](https://github.com/TUCCHI1/text-magnifier/commit/397f6b1579ee99885dafec9a76ef11fb67443de3))
- 文字数モードと自然なアニメーションを追加 ([57c2556](https://github.com/TUCCHI1/text-magnifier/commit/57c25569469a8ad6860fd7dcf6bbd8f799561d74))

### Bug Fixes

- Add hasMousePosition flag for safer toggle restore ([c31daf6](https://github.com/TUCCHI1/text-magnifier/commit/c31daf6a40621cec15509cf1ec3e30e0140efadc))
- font-size → transform: scale() に戻し上下ブルブルを防止 ([dcc2bba](https://github.com/TUCCHI1/text-magnifier/commit/dcc2bba0c5859538bf66cec7d1f4c98c27e3a761))
- font-sizeでスケールしベースラインを正確に揃える ([3d635e0](https://github.com/TUCCHI1/text-magnifier/commit/3d635e05af8560f427d7478fd095b29b37cd7bf9))
- Improve screenshot layout and positioning ([32f3957](https://github.com/TUCCHI1/text-magnifier/commit/32f39577308925ebb7fdc99eaeafc6e58ac0f8c4))
- Remove distracting animation from rainbow mode ([462cc37](https://github.com/TUCCHI1/text-magnifier/commit/462cc37233d9f0d1d6aa7e0e84d1714166c5b0fd))
- Remove ternary operator from playwright config ([daaf898](https://github.com/TUCCHI1/text-magnifier/commit/daaf898d065151c31d111b069f058ba4c4f37e9b))
- Restore spotlight on re-enable via shortcut ([003fcd5](https://github.com/TUCCHI1/text-magnifier/commit/003fcd5bd13b4838239e7dada8359c988007bfc3))
- Use xvfb-run for headed browser testing on CI ([3c45332](https://github.com/TUCCHI1/text-magnifier/commit/3c4533201672274bd0e074a2cfdc05219fc61494))
- アニメーション中のブルブルを防止 ([11a442f](https://github.com/TUCCHI1/text-magnifier/commit/11a442fee31196d1b2ecf557d22db53d7b5c75ff))
- 拡大中の要素上でマウスを動かしてもアニメーションが再発火しない ([76cd4ce](https://github.com/TUCCHI1/text-magnifier/commit/76cd4cef1e11d9d5dfe76f9213a79a9a1414c474))
- 拡大時のテキスト重なりを解消 ([21436d0](https://github.com/TUCCHI1/text-magnifier/commit/21436d0636ece910b95e8ddbf089be806752ebe4))
- 横移動時のブルブル切替を防止 ([ba877cc](https://github.com/TUCCHI1/text-magnifier/commit/ba877cc7c60ce7fb2e93353eefe8b80c043e6152))

### Performance Improvements

- Optimize build size with esbuild and html-minifier ([80a961e](https://github.com/TUCCHI1/text-magnifier/commit/80a961e6439818d344c5af1425c46de74c42ac25))
