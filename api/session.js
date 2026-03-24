import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // 统一处理 POST 请求
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const { action, payload } = req.body;
  const TTL = 86400; // 数据保留24小时

  try {
    // 学生投票：对应原版的 optionId
    if (action === 'vote') {
      const { optionId } = payload;
      await kv.hincrby('votes', optionId, 1);
      await kv.expire('votes', TTL);
      return res.status(200).json({ ok: true });
    }

    // 学生提交论点：对应原版的 text
    if (action === 'submit_arg') {
      const { text } = payload;
      // 将新论点推入列表
      await kv.lpush('arguments', text);
      await kv.expire('arguments', TTL);
      return res.status(200).json({ ok: true });
    }

    // 教师端获取数据
    if (action === 'get_results') {
      const votes = await kv.hgetall('votes') || {};
      const args = await kv.lrange('arguments', 0, -1) || [];
      return res.status(200).json({ votes, args });
    }

    // 清空数据
    if (action === 'reset') {
      await kv.del('votes');
      await kv.del('arguments');
      return res.status(200).json({ ok: true });
    }

    res.status(400).json({ error: '未知指令' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
