import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// CORS Settings
app.use('*', cors({
    origin: '*', // In production, restrict to extension ID if possible (e.g. chrome-extension://...)
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'X-Signature', 'X-Angel-Name'],
}));

// Constants
const MAX_DAILY_KARMA = 10000; // Sanity check limit

/**
 * POST /submit-score
 * Receives daily score from extension
 */
app.post('/submit-score', async (c) => {
    try {
        const body = await c.req.json();
        const { uuid, karma, angelName, tabsClosed, timestamp } = body;

        // 1. Sanity Checks (Anti-Cheat Lvl 1)
        if (!uuid || typeof karma !== 'number' || !timestamp) {
            return c.json({ error: 'Invalid payload' }, 400);
        }

        // Check for future timestamp (allow 5 min drift)
        const now = Date.now();
        const reqTime = new Date(timestamp).getTime();
        if (reqTime > now + 5 * 60 * 1000) {
            return c.json({ error: 'Invalid timestamp' }, 400);
        }

        // Check Max Score Cap
        if (karma > MAX_DAILY_KARMA || tabsClosed > 2000) {
            console.warn(`Suspicious score rejected: ${karma} by ${uuid}`);
            return c.json({ error: 'Score exceeds daily limit. Cheat detected?' }, 400);
        }

        // 2. Region Detection
        // Cloudflare Workers provides location data in c.req.raw.cf
        // Fallback to 'UTC' if not available (e.g. local dev)
        const cf = c.req.raw.cf;
        const region = cf?.timezone || 'UTC'; // e.g., "Asia/Tokyo"
        const country = cf?.country || 'XX';

        // Group by broad regions if needed, but Timezone is good for local 22:00 calculation

        // 3. Prepare Data for Storage
        const submission = {
            uuid,
            angelName: angelName || 'Anonymous Angel',
            karma,
            tabsClosed,
            timestamp,
            region,
            country,
            ip: c.req.header('CF-Connecting-IP') || '0.0.0.0', // Log IP for rate limiting analysis
            userAgent: c.req.header('User-Agent')
        };

        // 4. Save to R2
        // Key format: raw/{date}/{region}/{uuid}.json
        const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const key = `raw/${dateStr}/${region}/${uuid}.json`;

        // Use the binding 'RANKING_BUCKET' defined in wrangler.toml
        await c.env.RANKING_BUCKET.put(key, JSON.stringify(submission));

        return c.json({
            status: 'success',
            message: 'Score submitted',
            region: region
        });

    } catch (err) {
        console.error('Submit error:', err);
        return c.json({ error: 'Internal Server Error' }, 500);
    }
});

/**
 * GET /rankings/:region
 * Returns aggregated rankings (Stub)
 */
app.get('/rankings/:region', async (c) => {
    // In a real implementation, this would fetch a pre-aggregated JSON file
    // created by a Scheduled cron job.
    const region = c.req.param('region');

    // For now, return dummy or try to fetch 'latest.json'
    const key = `stats/${region}/latest.json`;
    const object = await c.env.RANKING_BUCKET.get(key);

    if (!object) {
        return c.json({ message: 'No ranking data yet for this region' }); // 200 OK but empty result
    }

    const data = await object.json();
    return c.json(data);
});

export default {
    fetch: app.fetch,

    // Scheduled trigger for aggregation (Daily 23:00 UTC?)
    // This logic is complex, usually better to separate content.
    // We'll leave it empty for now or add a TODO log.
    async scheduled(event, env, ctx) {
        console.log('Cron trigger fired', event.cron);
        // TODO: Iterate 'raw/{today}/*', aggregate scores, write to 'stats/{region}/latest.json'
    }
};
