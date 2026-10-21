const { app, BrowserWindow, Menu, dialog, protocol, session } = require('electron');
const { join, extname, basename } = require('node:path');
const { readFile } = require('node:fs/promises');
const { resolveAsset } = require('./paths.cjs');

const ORIGIN = 'plc-app://learning';
const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-src 'none'";
protocol.registerSchemesAsPrivileged([
  { scheme: 'plc-app', privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);
app.setName('PLC学习实验室');
// 固定身份与存储位置，不随安装路径或版本变化；与原浏览器草稿隔离。
app.setPath('userData', join(app.getPath('appData'), 'PLC-Learning-Simulator'));
let window;
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => {
    if (window?.isMinimized()) window.restore();
    window?.show();
    window?.focus();
  });
  // 包括Mac红色关闭按钮：最后一个窗口关闭后退出全部应用进程。
  app.on('window-all-closed', () => app.quit());
  app.on('before-quit', () => {
    if (app.isReady()) session.defaultSession.flushStorageData();
  });
  app
    .whenReady()
    .then(() => {
      const root = join(app.getAppPath(), app.isPackaged ? 'dist' : 'desktop-staging');
      protocol.handle('plc-app', async (request) => {
        const file = resolveAsset(root, request.url);
        if (!file || !['GET', 'HEAD'].includes(request.method))
          return new Response('Not found', { status: 404 });
        try {
          const body = await readFile(file);
          return new Response(request.method === 'HEAD' ? null : body, {
            headers: {
              'Content-Type':
                {
                  '.html': 'text/html; charset=utf-8',
                  '.js': 'text/javascript; charset=utf-8',
                  '.css': 'text/css; charset=utf-8',
                  '.svg': 'image/svg+xml',
                  '.png': 'image/png',
                  '.jpg': 'image/jpeg',
                  '.jpeg': 'image/jpeg',
                  '.webp': 'image/webp',
                  '.woff2': 'font/woff2',
                }[extname(file)] || 'application/octet-stream',
              'Content-Security-Policy': CSP,
              'X-Content-Type-Options': 'nosniff',
            },
          });
        } catch {
          return new Response('Not found', { status: 404 });
        }
      });
      session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) =>
        callback(false),
      );
      session.defaultSession.setPermissionCheckHandler(() => false);
      session.defaultSession.on('will-download', (_event, item) => {
        item.setSaveDialogOptions({
          title: '保存学习文件',
          buttonLabel: '保存',
          defaultPath: join(app.getPath('downloads'), basename(item.getFilename())),
        });
      });
      session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
        callback({
          cancel:
            !details.url.startsWith(`${ORIGIN}/`) &&
            !details.url.startsWith('blob:plc-app://learning/'),
        });
      });
      session.defaultSession.webRequest.onHeadersReceived((details, callback) =>
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            'Content-Security-Policy': [CSP],
          },
        }),
      );
      window = new BrowserWindow({
        width: 1360,
        height: 900,
        minWidth: 760,
        minHeight: 620,
        title: 'PLC 学习实验室',
        backgroundColor: '#f1f5fb',
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true,
          webSecurity: true,
          devTools: !app.isPackaged,
        },
      });
      window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
      window.webContents.on('will-navigate', (event, url) => {
        if (!url.startsWith(`${ORIGIN}/`)) event.preventDefault();
      });
      window.webContents.on('will-redirect', (event) => event.preventDefault());
      window.once('ready-to-show', () => window.show());
      window.webContents.on('did-fail-load', (_event, code, description) => {
        if (code !== -3)
          dialog.showErrorBox('无法打开学习页面', `请重新打开应用。\n${description}`);
      });
      const backup = () =>
        window?.webContents
          .executeJavaScript("window.dispatchEvent(new Event('plc-open-backup'))")
          .catch(() => {});
      Menu.setApplicationMenu(
        Menu.buildFromTemplate([
          {
            label: 'PLC 学习实验室',
            submenu: [
              { role: 'about', label: '关于 PLC 学习实验室' },
              { type: 'separator' },
              { label: '退出 PLC 学习实验室', role: 'quit', accelerator: 'CmdOrCtrl+Q' },
            ],
          },
          {
            label: '编辑',
            submenu: [
              { role: 'undo', label: '撤销' },
              { role: 'redo', label: '重做' },
              { type: 'separator' },
              { role: 'cut', label: '剪切' },
              { role: 'copy', label: '复制' },
              { role: 'paste', label: '粘贴' },
              { role: 'selectAll', label: '全选' },
            ],
          },
          { label: '学习数据', submenu: [{ label: '备份、恢复或迁移学习数据', click: backup }] },
          {
            label: '显示',
            submenu: [
              { role: 'resetZoom', label: '实际大小' },
              { role: 'zoomIn', label: '放大' },
              { role: 'zoomOut', label: '缩小' },
              { type: 'separator' },
              { role: 'togglefullscreen', label: '全屏' },
            ],
          },
        ]),
      );
      app.setAboutPanelOptions({
        applicationName: 'PLC 学习实验室',
        applicationVersion: app.getVersion(),
        copyright: '本地教学仿真 · 不连接实体PLC',
      });
      return window.loadURL(`${ORIGIN}/index.html`);
    })
    .catch((error) => {
      dialog.showErrorBox('启动失败', error.message);
      app.quit();
    });
}
