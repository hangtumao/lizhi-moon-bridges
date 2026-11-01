# 荔湾 · 一水五桥

交互式三维示意网页，单文件运行，无需安装或构建。入口为 `index.html`，可双击本地打开或部署至 GitHub Pages。支持旋转、缩放及桥梁视角切换。

## 来源与精度

- 总体布局及月相设计参考公开报道：[南方+，2023-11-16](https://static.nfnews.com/content/202311/16/c8304629.html?enterColumnId=0)。页面内保留来源与精度说明。
- 水系、桥位和尺度以参考图手工相对描摹，不具备地理坐标精度；桥梁为参考实景进行的可视化重建，周边建筑为环境示意。
- 这不是测绘成果、施工图或工程复原模型，不可用于施工与尺寸量测。参考图片著作权归原权利人所有。

## 技术

内嵌 Three.js r187、OrbitControls、Reflector 与图片资源，不依赖外部运行时 CDN、后端或分析追踪。WebGL2 模式支持平面反射和阴影；不支持时降级为 Canvas 软件渲染，不显示平面反射。

Three.js 及其附属组件许可证见 `THREE-LICENSE.txt`。

GitHub Pages 发布方式：`main` 分支根目录，包含 `.nojekyll`。
