exports.handler = async function(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  try {
    const body = JSON.parse(event.body);
    const apiKey = process.env.KLING_API_KEY;
    
    // 💡 新增逻辑：如果前端传来了 task_id，说明是拿着号码牌来【查询图片进度】的
    if (body.task_id) {
      const statusUrl = `https://api.qnaigc.com/v1/images/tasks/${body.task_id}`;
      const statusRes = await fetch(statusUrl, {
        method: "GET",
        headers: { "Authorization": `Bearer ${apiKey}` }
      });
      const statusData = await statusRes.json();
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(statusData)
      };
    }

    // 如果没有 task_id，说明是来【创建新画图任务】的
    if (!body.prompt) return { statusCode: 400, body: JSON.stringify({ error: "Missing prompt" }) };

    const modelId = "kling-v1-5";
    const apiUrl = "https://api.qnaigc.com/v1/images/generations"; 

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelId,
        prompt: body.prompt,
        n: 1 
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "七牛云 API 请求失败");
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error("云函数执行错误:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
