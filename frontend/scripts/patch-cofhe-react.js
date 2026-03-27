const fs = require('fs');
const path = require('path');

const DIST_FILES = [
  path.join(process.cwd(), 'node_modules', '@cofhe', 'react', 'dist', 'index.js'),
  path.join(process.cwd(), 'node_modules', '@cofhe', 'react', 'dist', 'index.cjs'),
];

const PATCHES = [
  {
    label: 'provider initialization bug',
    find: '(0, import_ts_essentials23.assert)(config.environment === "react", "Provided cofheClient must have react config");',
    replace:
      '(0, import_ts_essentials23.assert)(props.cofheClient.config.environment === "react", "Provided cofheClient must have react config");',
  },
  {
    label: 'floating button close icon interop (esm)',
    find: 'portalOpen && /* @__PURE__ */ jsx7(CloseIcon, { className: "w-6 h-6" }),',
    replace:
      'portalOpen && /* @__PURE__ */ jsx7(CloseIcon.default || CloseIcon, { className: "w-6 h-6" }),',
  },
  {
    label: 'example selection close icon interop (esm)',
    find: '/* @__PURE__ */ jsx56(CloseIcon2, { style: { fontSize: 16 } }),',
    replace:
      '/* @__PURE__ */ jsx56(CloseIcon2.default || CloseIcon2, { style: { fontSize: 16 } }),',
  },
  {
    label: 'example info close icon interop (esm)',
    find: '/* @__PURE__ */ jsx57(CloseIcon3, { style: { fontSize: 16 } }),',
    replace:
      '/* @__PURE__ */ jsx57(CloseIcon3.default || CloseIcon3, { style: { fontSize: 16 } }),',
  },
  {
    label: 'permit details close icon interop (esm)',
    find: '/* @__PURE__ */ jsx58(CloseIcon4, { fontSize: "small" }),',
    replace:
      '/* @__PURE__ */ jsx58(CloseIcon4.default || CloseIcon4, { fontSize: "small" }),',
  },
  {
    label: 'base info close icon interop (esm)',
    find: '/* @__PURE__ */ jsx59(CloseIcon5, { style: { fontSize: 16 } }),',
    replace:
      '/* @__PURE__ */ jsx59(CloseIcon5.default || CloseIcon5, { style: { fontSize: 16 } }),',
  },
  {
    label: 'floating button close icon interop (cjs)',
    find: 'portalOpen && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_Close.default, { className: "w-6 h-6" }),',
    replace:
      'portalOpen && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(import_Close.default.default || import_Close.default, { className: "w-6 h-6" }),',
  },
  {
    label: 'example selection close icon interop (cjs)',
    find: '/* @__PURE__ */ (0, import_jsx_runtime56.jsx)(import_Close2.default, { style: { fontSize: 16 } }),',
    replace:
      '/* @__PURE__ */ (0, import_jsx_runtime56.jsx)(import_Close2.default.default || import_Close2.default, { style: { fontSize: 16 } }),',
  },
  {
    label: 'example info close icon interop (cjs)',
    find: '/* @__PURE__ */ (0, import_jsx_runtime57.jsx)(import_Close3.default, { style: { fontSize: 16 } }),',
    replace:
      '/* @__PURE__ */ (0, import_jsx_runtime57.jsx)(import_Close3.default.default || import_Close3.default, { style: { fontSize: 16 } }),',
  },
  {
    label: 'permit details close icon interop (cjs)',
    find: '/* @__PURE__ */ (0, import_jsx_runtime58.jsx)(import_Close4.default, { fontSize: "small" }),',
    replace:
      '/* @__PURE__ */ (0, import_jsx_runtime58.jsx)(import_Close4.default.default || import_Close4.default, { fontSize: "small" }),',
  },
  {
    label: 'base info close icon interop (cjs)',
    find: '/* @__PURE__ */ (0, import_jsx_runtime59.jsx)(import_Close5.default, { style: { fontSize: 16 } }),',
    replace:
      '/* @__PURE__ */ (0, import_jsx_runtime59.jsx)(import_Close5.default.default || import_Close5.default, { style: { fontSize: 16 } }),',
  },
];

for (const filePath of DIST_FILES) {
  if (!fs.existsSync(filePath)) continue;

  let source = fs.readFileSync(filePath, 'utf8');
  let filePatched = false;

  for (const patch of PATCHES) {
    if (!source.includes(patch.find)) continue;
    source = source.replace(patch.find, patch.replace);
    filePatched = true;
  }

  if (!filePatched) continue;

  fs.writeFileSync(filePath, source, 'utf8');
}

console.log('Patched @cofhe/react runtime issues.');
