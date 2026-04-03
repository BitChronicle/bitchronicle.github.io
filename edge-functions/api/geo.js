// 文件路径：functions/api/geo.js

export async function onRequest({ request }) {
  // 从 request 对象中提取 eo 数据
  const eo = request.eo || {};
  const geo = eo.geo || {};

  // 映射你提供的 interface 字段
  const data = {
    // 国家名称 (e.g., China)
    country: geo.countryName || "未知国家",
    // 省份/自治区名称 (e.g., Jiangsu)
    province: geo.regionName || "未知省份",
    // 城市名称 (e.g., Nanjing)
    city: geo.cityName || "未知城市",
    // 经纬度（备用，如果你想玩地图可视化）
    lat: geo.latitude,
    lng: geo.longitude,
    // 访客 IP
    ip: eo.clientIp || request.headers.get('eo-client-ip') || "未知IP"
  };

  return new Response(
    JSON.stringify({
      success: true,
      data: data
    }),
    {
      headers: {
        'content-type': 'application/json; charset=UTF-8',
        'Access-Control-Allow-Origin': '*', // 允许所有来源，方便调试
      },
    }
  );
}