import https from 'node:https'
import dns from 'node:dns'
import net from 'node:net'

// Everything that must never be reachable from a user-supplied URL (SSRF guard)
const blocked = new net.BlockList()
;[
    ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
    ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.168.0.0', 16],
    ['198.18.0.0', 15], ['224.0.0.0', 4], ['240.0.0.0', 4]
].forEach(([addr, prefix]) => blocked.addSubnet(addr, prefix, 'ipv4'))
;[
    ['::', 128], ['::1', 128], ['fc00::', 7], ['fe80::', 10], ['ff00::', 8],
    ['64:ff9b::', 96], ['2002::', 16]
].forEach(([addr, prefix]) => blocked.addSubnet(addr, prefix, 'ipv6'))

const mappedToV4 = (ip) => {
    const dotted = ip.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i)
    if (dotted) return dotted[1]
    const hex = ip.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i)
    if (hex) {
        const hi = parseInt(hex[1], 16)
        const lo = parseInt(hex[2], 16)
        return `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`
    }
    return null
}

export const isBlockedIp = (ip) => {
    const family = net.isIP(ip)
    if (family === 0) return true               // not an IP at all: refuse
    if (family === 4) return blocked.check(ip, 'ipv4')
    const v4 = mappedToV4(ip)
    if (v4) return blocked.check(v4, 'ipv4')
    return blocked.check(ip, 'ipv6')
}

// Runs at connect time, so DNS rebinding cannot swap in a private IP after the check
const safeLookup = (hostname, options, callback) => {
    const opts = options && typeof options === 'object' ? options : { family: options }
    dns.lookup(hostname, { ...opts, all: true }, (err, addresses) => {
        if (err) return callback(err)
        if (!addresses.length || addresses.some((a) => isBlockedIp(a.address))) {
            return callback(new Error('BLOCKED_ADDRESS'))
        }
        if (opts.all) return callback(null, addresses)
        callback(null, addresses[0].address, addresses[0].family)
    })
}

export const htmlToText = (html) =>
    String(html ?? '')
        .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, ' ')
        .replace(/<!--[\s\S]*?-->/g, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim()

/**
 * Fetches a user-supplied https URL as text. Never rejects.
 * Returns { ok: true, text, truncated } or { ok: false, reason }.
 * No redirects, no credentials, port 443 only, text/json only, size and time capped.
 */
export const safeFetchText = (rawUrl, { timeoutMs = 8000, maxBytes = 100_000 } = {}) =>
    new Promise((resolve) => {
        let settled = false
        let req
        const finish = (result) => {
            if (settled) return
            settled = true
            clearTimeout(deadline)
            if (req) req.destroy()
            resolve(result)
        }
        const deadline = setTimeout(() => finish({ ok: false, reason: 'TIMEOUT' }), timeoutMs)

        let url
        try { url = new URL(rawUrl) } catch { return finish({ ok: false, reason: 'INVALID_URL' }) }
        if (url.protocol !== 'https:') return finish({ ok: false, reason: 'NOT_HTTPS' })
        if (url.username || url.password) return finish({ ok: false, reason: 'CREDENTIALS_IN_URL' })
        if (url.port && url.port !== '443') return finish({ ok: false, reason: 'BAD_PORT' })

        const host = url.hostname.replace(/^\[|\]$/g, '')
        if (net.isIP(host) && isBlockedIp(host)) return finish({ ok: false, reason: 'BLOCKED_ADDRESS' })

        try {
            req = https.get(
                url,
                {
                    lookup: safeLookup,
                    headers: { 'User-Agent': 'PactPay-DisputeReader/1.0', Accept: 'text/*, application/json' }
                },
                (res) => {
                    if (res.statusCode < 200 || res.statusCode >= 300) {
                        return finish({ ok: false, reason: `HTTP_${res.statusCode}` })   // 3xx included: no redirects
                    }
                    const type = String(res.headers['content-type'] || '')
                    if (!/^(text\/|application\/json)/i.test(type)) {
                        return finish({ ok: false, reason: 'UNSUPPORTED_CONTENT_TYPE' })
                    }
                    const chunks = []
                    let size = 0
                    res.on('data', (chunk) => {
                        if (size + chunk.length > maxBytes) {
                            const keep = maxBytes - size
                            if (keep > 0) chunks.push(chunk.subarray(0, keep))
                            return finish({ ok: true, truncated: true, text: Buffer.concat(chunks).toString('utf8') })
                        }
                        size += chunk.length
                        chunks.push(chunk)
                    })
                    res.on('end', () =>
                        finish({ ok: true, truncated: false, text: Buffer.concat(chunks).toString('utf8') }))
                    res.on('error', () => finish({ ok: false, reason: 'FETCH_ERROR' }))
                }
            )
            req.on('error', (e) =>
                finish({ ok: false, reason: e?.message === 'BLOCKED_ADDRESS' ? 'BLOCKED_ADDRESS' : 'FETCH_ERROR' }))
        } catch {
            finish({ ok: false, reason: 'FETCH_ERROR' })
        }
    })