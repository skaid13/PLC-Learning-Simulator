#!/bin/zsh
# 解析桌面符号链接，项目移动后也可直接双击项目内入口。
PLC_SOURCE="$0"
while [[ -L "$PLC_SOURCE" ]]; do
  PLC_PARENT="$(cd -P -- "$(dirname -- "$PLC_SOURCE")" && pwd)"
  PLC_LINK="$(readlink "$PLC_SOURCE")"
  if [[ "$PLC_LINK" = /* ]]; then
    PLC_SOURCE="$PLC_LINK"
  else
    PLC_SOURCE="$PLC_PARENT/$PLC_LINK"
  fi
done
PLC_PROJECT_DIR="$(cd -P -- "$(dirname -- "$PLC_SOURCE")" && pwd)"
cd -- "$PLC_PROJECT_DIR" || exit 1
PLC_NODE_BIN="$(command -v node)"
if [[ -z "$PLC_NODE_BIN" ]]; then
  for PLC_CANDIDATE in /usr/local/bin/node /opt/homebrew/bin/node; do
    if [[ -x "$PLC_CANDIDATE" ]]; then
      PLC_NODE_BIN="$PLC_CANDIDATE"
      break
    fi
  done
fi
if [[ -z "$PLC_NODE_BIN" ]]; then
  print '未找到 Node.js。请先安装 Node.js 22.12 或以上版本。'
  read '?按回车关闭窗口…'
  exit 1
fi
"$PLC_NODE_BIN" scripts/launch.mjs "$@"
PLC_RESULT=$?
if [[ $PLC_RESULT -ne 0 ]]; then
  read '?启动未完成，请查看上方说明。按回车关闭窗口…'
fi
exit $PLC_RESULT
