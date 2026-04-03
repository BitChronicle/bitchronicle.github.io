// 文件路径：functions/api/pv.js

export async function onRequest({ request, env }) {
  const origin = request.headers.get('Origin');
  const allowOrigin = ['https://blog.yeliya.site', 'http://localhost:1313'].includes(origin) ? origin : 'https://blog.yeliya.site';

  // 🛡️ 拦截浏览器的 OPTIONS 跨域预检请求，直接放行，不走 KV 数据库！
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": allowOrigin,
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Max-Age": "3600", // 缓存预检结果，减少请求
      }
    });
  }

  try {
    // 【核心大逆转】腾讯云 EdgeOne 将 KV 作为全局变量注入
    let my_kv;
    if (typeof yeliya_blog_PV !== 'undefined') {
        my_kv = yeliya_blog_PV;
    } else if (env && env.yeliya_blog_PV) {
        my_kv = env.yeliya_blog_PV; // 兼顾极低概率的 env 挂载
    }

    if (!my_kv) {
      throw new Error("KV_NOT_BOUND: 尝试全局变量获取失败，请确认控制台绑定已生效。");
    }

    const url = new URL(request.url);
    const path = url.searchParams.get('path') || "/";

    const KEY_SITE_PV = "hugo:site_pv";
    const KEY_SITE_UV = "hugo:site_uv";
    const KEY_PAGE_PV = `hugo:page_pv:${path}`;

    // ==========================================
    // 🤫 上帝模式：通过 URL 参数强行修改 KV 数据
    // ==========================================
    const cheatPagePv = url.searchParams.get('cheat_page');
    const cheatSitePv = url.searchParams.get('cheat_site');
    const cheatSiteUv = url.searchParams.get('cheat_uv');

    let isCheat = false;
    if (cheatPagePv) { await my_kv.put(KEY_PAGE_PV, cheatPagePv); isCheat = true; }
    if (cheatSitePv) { await my_kv.put(KEY_SITE_PV, cheatSitePv); isCheat = true; }
    if (cheatSiteUv) { await my_kv.put(KEY_SITE_UV, cheatSiteUv); isCheat = true; }

    if (isCheat) {
        return new Response(JSON.stringify({ 
            msg: "上帝模式执行成功！", 
            now_page_pv: cheatPagePv || "未修改",
            now_site_pv: cheatSitePv || "未修改",
            now_site_uv: cheatSiteUv || "未修改"
        }), {
            headers: { 
              "Content-Type": "application/json; charset=UTF-8",
              "Access-Control-Allow-Origin": allowOrigin 
            }
        });
    }
    // ==========================================


    // --- 以下为正常的 PV/UV 统计逻辑 ---

    // 【终极修复 1】尝试获取真实 IP
    let ip = request.headers.get('eo-client-ip') || 
             request.headers.get('x-real-ip') || 
             request.headers.get('x-forwarded-for')?.split(',')[0].trim();
             
    // 【终极修复 2】如果真拿不到 IP，改用“浏览器 User-Agent”作为稳定指纹
    if (!ip || ip === 'unknown') {
        const ua = request.headers.get('user-agent') || 'unknown_device';
        ip = `fingerprint_${ua.replace(/[^a-zA-Z0-9]/g, '').substring(0, 30)}`;
    }

    const KEY_MARK_UV = `hugo:mark_uv:${ip}`; // 访客唯一标记

    // 并行读取数据
    const [sitePvStr, siteUvStr, pagePvStr, hasVisited] = await Promise.all([
      my_kv.get(KEY_SITE_PV),
      my_kv.get(KEY_SITE_UV),
      my_kv.get(KEY_PAGE_PV),
      my_kv.get(KEY_MARK_UV)
    ]);

    let sitePv = parseInt(sitePvStr || "0") + 1;
    let pagePv = parseInt(pagePvStr || "0") + 1;
    let siteUv = parseInt(siteUvStr || "0");

    // 【核心修复 3】分离写入逻辑，防止并发冲突
    if (!hasVisited) {
      siteUv += 1;
      const uvTasks = [
        my_kv.put(KEY_SITE_UV, siteUv.toString()),
        my_kv.put(KEY_MARK_UV, "1", { expirationTtl: 3600 }) // 1小时锁
      ];
      await Promise.all(uvTasks); // 优先确保 UV 写成功
    }

    const pvTasks = [
      my_kv.put(KEY_SITE_PV, sitePv.toString()),
      my_kv.put(KEY_PAGE_PV, pagePv.toString())
    ];
    await Promise.all(pvTasks); // 再写 PV

    return new Response(JSON.stringify({ 
      site_pv: sitePv, 
      site_uv: siteUv, 
      page_pv: pagePv,
      debug_ip: ip
    }), {
      headers: { 
        "Content-Type": "application/json; charset=UTF-8",
        "Access-Control-Allow-Origin": allowOrigin,
        "Cache-Control": "no-cache"
      }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 500, 
      headers: { 
        "Content-Type": "application/json; charset=UTF-8",
        "Access-Control-Allow-Origin": allowOrigin 
      } 
    });
  }
}