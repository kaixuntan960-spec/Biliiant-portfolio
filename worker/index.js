const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * 通过企业微信群机器人发送 Markdown 消息
 * 免费，每分钟 20 条，不限总量
 * Docs: https://developer.work.weixin.qq.com/document/path/91770
 */
async function sendWecomBot(key, title, body) {
  // 企业微信机器人的 Markdown 不需要前面加 ##，外面统一加
  const content = `## ${title}\n${body}`;
  const res = await fetch(
    `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        msgtype: "markdown",
        markdown: { content },
      }),
    }
  );
  const result = await res.json();
  if (result.errcode !== 0) {
    throw new Error(`WeCom bot error: ${result.errmsg} (code ${result.errcode})`);
  }
}

/**
 * Server酱推送（备选）
 */
async function sendServerChan(key, title, body) {
  const res = await fetch(`https://sctapi.ftqq.com/${key}.send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, desp: body }),
  });
  if (!res.ok) {
    throw new Error(`ServerChan error: ${res.status}`);
  }
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: CORS_HEADERS });
    }

    try {
      const data = await request.json();
      const { type } = data;
      let title, body;

      if (type === "visitor") {
        // Deduplicate by fingerprint: IP + User-Agent
        const ip = request.headers.get("cf-connecting-ip") || "unknown";
        const ua = request.headers.get("user-agent") || "";
        const fingerprint = await sha256(ip + "|" + ua);

        // Check if this visitor has already been notified
        const existing = await env.VISITOR_STORE.get("visitor:" + fingerprint);
        if (existing) {
          return new Response(JSON.stringify({ ok: true, duplicate: true }), {
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
          });
        }

        // Increment global counter
        const counterStr = await env.VISITOR_STORE.get("counter");
        const counter = counterStr ? parseInt(counterStr, 10) + 1 : 1;

        // Save counter and fingerprint
        await Promise.all([
          env.VISITOR_STORE.put("counter", String(counter)),
          env.VISITOR_STORE.put("visitor:" + fingerprint, "1"),
        ]);

        title = `👤 新访客 #${counter}：${data.company || "未填写公司"}`;
        body = [
          `**编号：** #${counter}`,
          `**公司/来源：** ${data.company || "未填写"}`,
          `**语言：** ${data.lang || "-"}`,
          `**页面：** ${data.path || "/"}`,
          `**来源：** ${data.referrer || "直接访问"}`,
          `**时间：** ${data.ts || new Date().toISOString()}`,
        ].join("\n\n");
      } else if (type === "contact") {
        title = `✉️ 新留言：${data.name || "匿名"}`;
        body = [
          `**姓名：** ${data.name || "未填写"}`,
          `**邮箱：** ${data.email || "未填写"}`,
          `**消息：**\n\n${data.message || "（空）"}`,
          `**时间：** ${new Date().toISOString()}`,
        ].join("\n\n");
      } else {
        title = "🔔 网站通知";
        body = JSON.stringify(data, null, 2);
      }

      // 推送：优先企业微信机器人 → 备选 Server酱
      if (env.WECHAT_BOT_KEY) {
        await sendWecomBot(env.WECHAT_BOT_KEY, title, body);
      } else if (env.SCT_KEY) {
        await sendServerChan(env.SCT_KEY, title, body);
      } else {
        // 都没配时写日志但不报错（避免打断前端流程）
        console.warn("No notification channel configured — set WECHAT_BOT_KEY or SCT_KEY");
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: e.message }), {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
  },
};
