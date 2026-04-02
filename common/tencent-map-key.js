/**
 * 高德地图 Key 与安全验证配置
 *
 * 控制台 https://console.amap.com/dev/key/app
 *
 * 【Key 类型区分】
 * 1. AMAP_KEY        → 「Web JS API」Key（用于加载地图底图、搜索、地理编码等插件）
 * 2. AMAP_SECRET_KEY → 「安全密钥」（在 Key 详情页「安全密钥」Tab 生成，用于 v2.0 API 安全验证）
 *
 * 【域名白名单】
 * 同样在控制台配置，开发阶段填 localhost（不带端口），生产填实际域名。
 *
 * 【小程序/App】
 * 若需在微信小程序/App使用，请在控制台另行创建对应平台的 Key，
 * 并在 manifest.json → app-plus → sdkConfigs.maps.amap 中配置（与 H5 独立）。
 */
export const AMAP_KEY = '038019d08912b27aa684b47177e4113e'          // ← Web JS API Key
export const AMAP_SECRET_KEY = 'fece524185e1f50a1f12de4faa7a15cc'   // ← 安全密钥（在 Key 详情页「安全密钥」Tab 生成后填入）
