// 与 macOS / Windows 双击入口共用；仅需 Node，无需安装 npm 依赖。
import { readFile } from 'node:fs/promises';
import { get } from 'node:http';
import { spawn } from 'node:child_process';

const port = Number(process.env.PORT || 4173);
const url = `http://127.0.0.1:${port}/`;
const noOpen = process.argv.includes('--no-open');

function inspectExisting() {
  return new Promise((resolve, reject) => {
    const request = get(url, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        if (body.length < 100_000) body += chunk;
      });
      response.on('end', () => resolve({ status: response.statusCode, body }));
      response.on('error', reject);
    });
    request.setTimeout(2000, () => request.destroy(new Error('本机端口响应超时。')));
    request.on('error', (error) => {
      if (error.code === 'ECONNREFUSED') resolve(null);
      else reject(error);
    });
  });
}

function openBrowser() {
  console.log(`\n打开学习工作台：${url}`);
  if (noOpen) return;
  const command =
    process.platform === 'darwin'
      ? 'open'
      : process.platform === 'win32'
        ? 'rundll32.exe'
        : 'xdg-open';
  const args = process.platform === 'win32' ? ['url.dll,FileProtocolHandler', url] : [url];
  const child = spawn(command, args, { stdio: 'ignore', windowsHide: true });
  child.on('error', () => console.error(`无法自动打开浏览器，请手动访问 ${url}`));
  child.on('exit', (code) => {
    if (code) console.error(`浏览器未能自动打开，请手动访问 ${url}`);
  });
}

try {
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('PORT 必须是 1～65535 的整数。');
  let expected;
  try {
    expected = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
  } catch {
    throw new Error('未找到正式构建。请先在项目目录运行 npm run build。');
  }
  const existing = await inspectExisting();
  if (existing) {
    if (existing.status !== 200 || existing.body !== expected)
      throw new Error(`端口 ${port} 被其他服务或旧版本占用，请先关闭该服务后重试。`);
    console.log('PLC 服务已经运行，将打开现有页面。');
    openBrowser();
  } else {
    const { server } = await import('./serve.mjs');
    if (!server.listening)
      await new Promise((resolve, reject) => {
        server.once('listening', resolve);
        server.once('error', reject);
      });
    openBrowser();
    console.log('请保留这个终端窗口。结束学习后按 Ctrl+C 停止服务。');
  }
} catch (error) {
  console.error(`启动失败：${error.message}`);
  process.exitCode = 1;
}
