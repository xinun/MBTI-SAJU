const Redis = require('ioredis');

const startupNodes = [
  { host: process.env.REDIS_HOST || '10.178.0.7', port: Number(process.env.REDIS_PORT || 6379) },
  { host: '10.178.0.6', port: 11003 },
  { host: '10.178.0.6', port: 11004 },
];

const cluster = new Redis.Cluster(startupNodes, {
  scaleReads: 'master',
  slotsRefreshTimeout: 2000,
  redisOptions: { connectTimeout: 5000, maxRetriesPerRequest: 2 },
});

cluster.on('ready',   () => console.log('[redis-cluster] ready'));
cluster.on('connect', () => console.log('[redis-cluster] connected'));
cluster.on('error',   (e) => console.error('[redis-cluster] error', e));
cluster.on('node error', (e) => console.error('[redis-node] error', e));

async function ping() {
  try { return await cluster.ping(); } catch { return 'NG'; }
}

/** 타입 자동 판별 후 안전 조회 */
async function getByDate(dateStr) {
  const key = `date:${dateStr}`;
  const t = await cluster.type(key); // string | hash | list | set | zset | none
  let data, meta = { key, type: t };

  switch (t) {
    case 'string': {
      const raw = await cluster.get(key);
      try { data = JSON.parse(raw); meta.length = raw?.length || 0; }
      catch { data = raw; meta.length = raw?.length || 0; }
      break;
    }
    case 'hash':
      data = await cluster.hgetall(key);
      meta.length = Object.keys(data).length;
      break;
    case 'list':
      data = await cluster.lrange(key, 0, 199);
      meta.length = data.length; meta.note = 'list truncated to 200';
      break;
    case 'set':
      data = await cluster.smembers(key);
      meta.length = data.length;
      break;
    case 'zset': {
      const arr = await cluster.zrange(key, 0, 199, 'WITHSCORES');
      const out = [];
      for (let i=0; i<arr.length; i+=2) out.push({ member: arr[i], score: Number(arr[i+1]) });
      data = out; meta.length = out.length; meta.note = 'zset truncated to 200';
      break;
    }
    case 'none':
    default:
      return { key, type: t, length: 0, data: null };
  }
  return { ...meta, data };
}

module.exports = { client: cluster, ping, getByDate };
