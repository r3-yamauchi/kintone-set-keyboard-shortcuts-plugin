/* eslint-disable spaced-comment */
/// <reference types="@kintone/dts-gen/kintone.d.ts" />
// kintone.ts: kintone独自APIの型補強。ここではショートカット設定APIを明示し、アプリ側で型安全に扱う。
// どこで: デスクトップ側の実行時にkintone.setKeyboardShortcutsを利用する箇所が参照する。
// なぜ: 型定義を手元に持たせてコンパイル時に誤用を防ぎ、ランタイムエラーを減らすため。

declare namespace kintone {
    // kintoneが提供するショートカット設定API。booleanと詳細マップの両方を受け付ける。
    function setKeyboardShortcuts(
        shortcuts: { [key: string]: boolean } | boolean,
    ): Promise<void>;
}
