const d$1 = Object.defineProperty; const e = (c, a) => { for (const b in a) d$1(c, b, { get: a[b], enumerable: !0 }) }

const w = {}; e(w, { convertFileSrc: () => u, invoke: () => d, transformCallback: () => s }); function l() { return window.crypto.getRandomValues(new Uint32Array(1))[0] } function s(r, n = !1) { const e = l(); const t = `_${e}`; return Object.defineProperty(window, t, { value: o => (n && Reflect.deleteProperty(window, t), r?.(o)), writable: !1, configurable: !0 }), e } async function d(r, n = {}) { return new Promise((e, t) => { const o = s(i => { e(i), Reflect.deleteProperty(window, `_${a}`) }, !0); const a = s(i => { t(i), Reflect.deleteProperty(window, `_${o}`) }, !0); window.__TAURI_IPC__({ cmd: r, callback: o, error: a, ...n }) }) } function u(r, n = 'asset') { const e = encodeURIComponent(r); return navigator.userAgent.includes('Windows') ? `https://${n}.localhost/${e}` : `${n}://localhost/${e}` }

// Copyright 2019-2021 Tauri Programme within The Commons Conservancy
// SPDX-License-Identifier: Apache-2.0
// SPDX-License-Identifier: MIT
async function isEnabled() {
  return await d('plugin:autostart|is_enabled')
}
async function enable() {
  await d('plugin:autostart|enable')
}
async function disable() {
  await d('plugin:autostart|disable')
}

export { disable, enable, isEnabled }
// # sourceMappingURL=index.min.js.map
