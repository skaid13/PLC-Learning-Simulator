const path = require('node:path');
function resolveAsset(root, address, paths = path) {
  const { resolve, relative, isAbsolute } = paths;
  try {
    const url = new URL(address);
    if (
      url.protocol !== 'plc-app:' ||
      url.hostname !== 'learning' ||
      url.port ||
      url.username ||
      url.password
    )
      return null;
    const pathname = decodeURIComponent(url.pathname);
    if (pathname.includes('\\') || pathname.includes('\0')) return null;
    const file = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    const within = relative(root, file);
    if (
      within.startsWith('..') ||
      isAbsolute(within) ||
      !/^(index\.html|assets[\/].+\.(js|css|svg|png|jpg|jpeg|webp|woff2))$/.test(
        within.replaceAll('\\', '/'),
      )
    )
      return null;
    return file;
  } catch {
    return null;
  }
}
module.exports = { resolveAsset };
