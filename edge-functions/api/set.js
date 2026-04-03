// 文件路径：你的博客根目录/functions/api/set.js

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  const value = url.searchParams.get('value');
  const token = url.searchParams.get('token');

  // 🔒 安全校验：请把你专属的密码写在这里，千万别泄露！
  const MY_SECRET_TOKEN = "mypassword123"; 

  // 如果密码不对，直接拒绝访问
  if (token !== MY_SECRET_TOKEN) {
    return new Response(JSON.stringify({ error: "密码错误，拒绝访问！" }), { status: 401 });
  }

  // 检查参数是否完整
  if (!key || !value) {
    return new Response(JSON.stringify({ error: "缺少 key 或 value 参数" }), { status: 400 });
  }

  try {
    const kv = env.yeliya_blog_PV;
    if (!kv) throw new Error("KV 数据库未绑定");

    // 强行覆盖写入 KV 数据库
    await kv.put(key, value.toString());

    return new Response(JSON.stringify({ 
      success: true, 
      message: `太棒了！成功将 ${key} 的值设置为 ${value}` 
    }), {
      headers: { "Content-Type": "application/json; charset=UTF-8" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}