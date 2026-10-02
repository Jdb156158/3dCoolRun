# STICKMAN RUSH · 火柴人突围

基于 Three.js + Vite 的竖屏 3D 网页小游戏原型。火柴人使用程序化几何和实例化渲染，无需下载人物模型。

## 当前效果

- 竖屏海上长桥场景，桌面和手机浏览器均可运行。
- 火柴人小队自动前进射击，静止时子弹朝正前方飞行，左右移动时允许侧向瞄准。
- 蓝色增员门增加队友，金色门升级火力；拾取时包含金币感音效、闪光、光圈和粒子反馈。
- 密集怪物群从顶部雾化渐变区出现，每波约 65～110 只，最多同时渲染 600 只。
- 敌人越过小队后方红色防线立即失败；关卡末尾包含 Boss 战、血条和结算界面。
- 机关枪连续射击音效、暂停、静音、重新开始和键盘操作。

## 技术实现

- 原生 JavaScript + Vite，游戏入口位于 `src/main.js`。
- Three.js WebGL 渲染，角色由球体、圆柱体等低面数几何体组合。
- `InstancedMesh` 批量绘制小队、怪物、子弹、阴影和粒子，控制大量单位带来的 Draw Call。
- Web Audio API 管理机关枪、拾取和战斗反馈音效。
- HTML/CSS 实现 HUD、进度、开始、暂停和结算界面。

## 运行

```sh
pnpm install
pnpm dev
```

打开终端显示的地址。若 localhost 被其他本地服务占用，可使用 `http://127.0.0.1:5173`，或用 `pnpm dev --port 5188` 指定其他端口。

```sh
pnpm build
pnpm preview
```

## 操作

- 鼠标或手指左右拖动，也可使用 A / D、左右方向键。
- 小队自动射击；蓝色门增加人数，金色门升级火力。
- 第 48 秒出现 Boss，击败 Boss 获胜；任何敌人越过队伍后方红色防线即失败，不要求碰到队员。队伍全灭或超过 75 秒也会失败。
- 空格键或右上角按钮暂停；音符按钮开启音效，默认静音。

手机使用全屏竖向布局，桌面显示玩法介绍与游戏区域。当前为单关卡效果原型，未接入账号、服务器或持久化存档。桌面浏览器验证不能替代真机性能测试。

## 项目结构

```text
.
├── index.html                 # 页面结构和游戏 HUD
├── public/audio/              # 游戏音效与授权说明
├── src/main.js                # 3D 场景、战斗和关卡逻辑
├── src/style.css              # 桌面及手机布局
├── package.json               # 开发与构建脚本
└── pnpm-workspace.yaml        # pnpm 构建依赖配置
```

## 音效署名

机关枪音效使用 KuraiWolf 的 [Light Machine Gun](https://opengameart.org/content/light-machine-gun)，许可为 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。原始 MP3 未修改；播放时截取起音、淡出并以连射节奏重复。完整署名随构建发布于 `audio/CREDITS.txt`。
