/* eslint-disable spaced-comment */
/// <reference types="@kintone/dts-gen/kintone.d.ts" />

declare namespace kintone {
    function setKeyboardShortcuts(
        shortcuts: { [key: string]: boolean } | boolean,
    ): Promise<void>;
}
