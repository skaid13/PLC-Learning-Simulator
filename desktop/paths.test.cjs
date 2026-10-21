const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { resolveAsset } = require('./paths.cjs');
test('只允许包内页面和静态资源，阻止未知协议/主机/外部文件及目录穿越', () => {
  const root = path.resolve('dist');
  assert.equal(resolveAsset(root, 'plc-app://learning/index.html'), path.join(root, 'index.html'));
  assert.equal(
    resolveAsset(root, 'plc-app://learning/assets/app.js'),
    path.join(root, 'assets', 'app.js'),
  );
  for (const url of [
    'https://learning/index.html',
    'plc-app://other/index.html',
    'plc-app://learning:12/index.html',
    'plc-app://user@learning/index.html',
    'plc-app://learning/package.json',
    'plc-app://learning/assets/%2e%2e%2f%2e%2e%2fsecret.js',
    'plc-app://learning/assets/..%5c..%5csecret.js',
    'plc-app://learning/assets/%00.js',
  ])
    assert.equal(resolveAsset(root, url), null, url);
});

test('Windows路径使用反斜线时仍能加载包内资源并拒绝越界', () => {
  const root = 'C:\\PLC\\dist';
  assert.equal(
    resolveAsset(root, 'plc-app://learning/assets/app.css', path.win32),
    'C:\\PLC\\dist\\assets\\app.css',
  );
  assert.equal(
    resolveAsset(root, 'plc-app://learning/assets/%2e%2e%2f%2e%2e%2fsecret.js', path.win32),
    null,
  );
});
