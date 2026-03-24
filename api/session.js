import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  const { action, payload } = req.body;
  try {
    if (action === 'vote') {
      await kv.hincrby('votes', payload.optionId, 1);
      await kv.expire('votes', 86400); // 24小时过期
      return res.status(200).json({ ok: true });
    }
    if (action === 'get_results') {
      const votes = await kv.hgetall('votes') || {};
      const args = await kv.lrange('arguments', 0, -1) || [];
      return res.status(200).json({ votes, args });
    }
    if (action === 'submit_arg') {
      await kv.lpush('arguments', payload.text);
      await kv.expire('arguments', 86400);
      return res.status(200).json({ ok: true });
    }
    if (action === 'reset') {
      await kv.del('votes', 'arguments');
      return res.status(200).json({ ok: true });
    }
    res.status(400).json({ error: '无效请求' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
