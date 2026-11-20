import { safeFetchText } from '../src/lib/safeFetch.js'

console.log(await safeFetchText('http://example.com'))
console.log(await safeFetchText('https://127.0.0.1/'))
console.log(await safeFetchText('https://169.254.169.254/latest/meta-data/'))

const r = await safeFetchText('https://example.com')
console.log(r.ok, r.truncated, r.ok ? r.text.length : r.reason)