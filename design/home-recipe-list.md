# **需求** 每次用户打开都错落有致的显示很多图片
图片源列表固定、顺序固定，但每次进入页面时，
为每张图随机分配不同的“版型角色”：
    有些图是大卡片
    有些图是小卡片
    有些图是宽卡片
    有些图是高卡片
同时又要满足：
    整体整齐：不能像随便堆出来
    不死板：不能每次都一模一样
    考虑图片尺寸：横图更适合 wide，竖图更适合 tall，高清图更适合大图
source list 顺序不变：用户看到的内容顺序不乱，只是每个 item 的占位不同
# **参考方案** 用 CSS Grid + “受约束的随机 layout 生成器”
const TILE_TYPES = {
  SMALL: { colSpan: 1, rowSpan: 1 },
  WIDE:  { colSpan: 2, rowSpan: 1 },
  TALL:  { colSpan: 1, rowSpan: 2 },
  HERO:  { colSpan: 2, rowSpan: 2 },
};
grid-auto-flow: dense 会帮助浏览器尽量补洞。
hero 出现概率低
大块不会连续过多
不允许连续 3 个 tall
不允许 hero 后立刻再 hero
不允许两个 wide 紧挨太多次
# layout
手机：3 列
小平板：4 列
大平板 / 小桌面：5 列
桌面：6 列
手机 3 列
function getTileTypes(cols) {
  if (cols === 3) {
    return {
      small:   { colSpan: 1, rowSpan: 1 },
      wide:    { colSpan: 2, rowSpan: 1 },
      tall:    { colSpan: 1, rowSpan: 2 },
      hero:    { colSpan: 2, rowSpan: 2 },
    };
  }

  if (cols === 4) {
    return {
      small:   { colSpan: 1, rowSpan: 1 },
      wide:    { colSpan: 2, rowSpan: 1 },
      tall:    { colSpan: 1, rowSpan: 2 },
      hero:    { colSpan: 2, rowSpan: 2 },
      feature: { colSpan: 3, rowSpan: 2 },
    };
  }

  return {
    small:    { colSpan: 1, rowSpan: 1 },
    wide:     { colSpan: 2, rowSpan: 1 },
    tall:     { colSpan: 1, rowSpan: 2 },
    hero:     { colSpan: 2, rowSpan: 2 },
    feature:  { colSpan: 3, rowSpan: 2 },
    panorama: { colSpan: 3, rowSpan: 1 },
  };
}
# **每天一个新布局**
布局生成器应当依赖：
items
cols
seed
这样同一天内所有用户看到的布局一致，第二天变。
const todaySeed = Number(new Date().toISOString().slice(0, 10).replace(/-/g, ""));
 - 每8张图必须有1个大图，如果不到8张，随机。
 - 如果一个月份，到了大图的位置，后边的图不够5张了，需要一个额外判断，这个位置放了大图后，后边比它小的图（注意，根据屏幕尺寸，后边可能有1格，2格，3格，4格的图）不够补前面的空（最多允许一个空），则图片降级。