interface Env {
  MOLLIE_API_KEY: string
  SUPABASE_URL: string
  SUPABASE_SERVICE_KEY: string
  ADMIN_SECRET: string
  SITE_URL: string
  GITHUB_TOKEN: string
}

interface ProductPrice {
  slug: string
  mysecondear: number | null
  mrhear: number | null
  calculated: number | null
}

const PRODUCT_URLS: Record<string, { mysecondear: string; mrhear: string }> = {
  'phonak-audeo-infinio-90': {
    mysecondear: 'https://mysecondear.de/products/phonak-audeo-infinio',
    mrhear: 'https://www.mr-hear.com/de/hph0025.html',
  },
  'phonak-audeo-infinio-70': {
    mysecondear: 'https://mysecondear.de/products/phonak-audeo-infinio',
    mrhear: 'https://www.mr-hear.com/de/hph0024.html',
  },
  'phonak-audeo-infinio-50': {
    mysecondear: 'https://mysecondear.de/products/phonak-audeo-infinio',
    mrhear: 'https://www.mr-hear.com/de/hph0023.html',
  },
  'phonak-audeo-infinio-30': {
    mysecondear: 'https://mysecondear.de/products/phonak-audeo-infinio',
    mrhear: 'https://www.mr-hear.com/de/hph0022.html',
  },
  'phonak-audeo-infinio-sphere-90': {
    mysecondear: 'https://mysecondear.de/products/phonak-audeo-sphere-infinio',
    mrhear: 'https://www.mr-hear.com/de/hph0027.html',
  },
  'phonak-audeo-infinio-sphere-70': {
    mysecondear: 'https://mysecondear.de/products/phonak-audeo-sphere-infinio',
    mrhear: 'https://www.mr-hear.com/de/hph0026.html',
  },
  'oticon-intent-1': {
    mysecondear: 'https://mysecondear.de/products/oticon-intent',
    mrhear: 'https://www.mr-hear.com/de/hot0023.html',
  },
  'oticon-intent-2': {
    mysecondear: 'https://mysecondear.de/products/oticon-intent',
    mrhear: 'https://www.mr-hear.com/de/hot0024.html',
  },
  'oticon-intent-3': {
    mysecondear: 'https://mysecondear.de/products/oticon-intent',
    mrhear: 'https://www.mr-hear.com/de/hot0025.html',
  },
  'oticon-intent-4': {
    mysecondear: 'https://mysecondear.de/products/oticon-intent',
    mrhear: 'https://www.mr-hear.com/de/hot0026.html',
  },
  'oticon-zeal-1': {
    mysecondear: 'https://mysecondear.de/products/oticon-zeal',
    mrhear: '',
  },
  'oticon-zeal-2': {
    mysecondear: 'https://mysecondear.de/products/oticon-zeal',
    mrhear: '',
  },
  'oticon-zeal-3': {
    mysecondear: 'https://mysecondear.de/products/oticon-zeal',
    mrhear: '',
  },
  'oticon-jet-px': {
    mysecondear: 'https://mysecondear.de/products/oticon-jet-px',
    mrhear: 'https://www.mr-hear.com/de/hot0012.html',
  },
  'starkey-genesis-ai-24': {
    mysecondear: 'https://mysecondear.de/products/starkey-genesis-ai',
    mrhear: '',
  },
  'starkey-genesis-ai-20': {
    mysecondear: 'https://mysecondear.de/products/starkey-genesis-ai',
    mrhear: '',
  },
  'starkey-genesis-ai-16': {
    mysecondear: 'https://mysecondear.de/products/starkey-genesis-ai',
    mrhear: '',
  },
  'starkey-genesis-ai-12': {
    mysecondear: 'https://mysecondear.de/products/starkey-genesis-ai',
    mrhear: 'https://www.mr-hear.com/de/hst0007.html',
  },
}

// MySE pages list multiple variants with prices. This maps slug to the variant keyword to look for.
const MYSECONDEAR_VARIANT: Record<string, string> = {
  'phonak-audeo-infinio-90': '90',
  'phonak-audeo-infinio-70': '70',
  'phonak-audeo-infinio-50': '50',
  'phonak-audeo-infinio-30': '30',
  'phonak-audeo-infinio-sphere-90': '90',
  'phonak-audeo-infinio-sphere-70': '70',
  'oticon-intent-1': 'Level 1',
  'oticon-intent-2': 'Level 2',
  'oticon-intent-3': 'Level 3',
  'oticon-intent-4': 'Level 4',
  'oticon-zeal-1': 'Level 1',
  'oticon-zeal-2': 'Level 2',
  'oticon-zeal-3': 'Level 3',
  'oticon-jet-px': '',
  'starkey-genesis-ai-24': '24',
  'starkey-genesis-ai-20': '20',
  'starkey-genesis-ai-16': '16',
  'starkey-genesis-ai-12': '12',
}

function extractPrices(html: string): number[] {
  const prices: number[] = []
  // Match patterns like 1.499€, 2.299,00€, €1,499, 1.899 €, etc.
  const patterns = [
    /(\d{1,2}[\.,]\d{3})(?:[\.,]\d{2})?\s*€/g,
    /€\s*(\d{1,2}[\.,]\d{3})/g,
  ]
  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(html)) !== null) {
      const numStr = match[1].replace('.', '').replace(',', '')
      const num = parseInt(numStr, 10)
      if (num >= 500 && num <= 5000) {
        prices.push(num)
      }
    }
  }
  return [...new Set(prices)].sort((a, b) => a - b)
}

async function fetchPrice(url: string): Promise<number[]> {
  if (!url) return []
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PriceBot/1.0)' },
    })
    if (!res.ok) return []
    const html = await res.text()
    return extractPrices(html)
  } catch {
    return []
  }
}

function findBestMySEPrice(prices: number[], variant: string): number | null {
  if (prices.length === 0) return null
  if (!variant) return prices[0]

  // For numbered variants (30, 50, 70, 90, 12, 16, 20, 24), pick by position
  const numVariant = parseInt(variant.replace('Level ', ''), 10)
  if (!isNaN(numVariant)) {
    // Products are typically listed low to high
    // Map variant numbers to approximate price tiers
    if (prices.length === 1) return prices[0]

    // For Oticon Intent levels 1-4: Level 1 = most expensive, Level 4 = cheapest
    if (variant.startsWith('Level')) {
      const level = numVariant
      // Levels are 1(highest) to 4(lowest), prices sorted ascending
      const idx = prices.length - level
      if (idx >= 0 && idx < prices.length) return prices[idx]
      return level <= 2 ? prices[prices.length - 1] : prices[0]
    }

    // For Phonak/Starkey numbered models: higher number = more expensive
    const sorted = [...prices].sort((a, b) => a - b)
    if (numVariant >= 90) return sorted[sorted.length - 1]
    if (numVariant >= 70) return sorted[Math.max(0, sorted.length - 2)]
    if (numVariant >= 50) return sorted[Math.min(1, sorted.length - 1)]
    if (numVariant >= 24) return sorted[sorted.length - 1]
    if (numVariant >= 20) return sorted[Math.max(0, sorted.length - 2)]
    if (numVariant >= 16) return sorted[Math.min(1, sorted.length - 1)]
    return sorted[0]
  }

  return prices[0]
}

const KASSENABZUG = 840

export async function scrapeAndUpdatePrices(env: Env): Promise<string> {
  const results: ProductPrice[] = []
  const logs: string[] = []

  // Fetch current products.json from GitHub
  const ghRes = await fetch(
    'https://api.github.com/repos/one-cloud-a1/easyOhr/contents/src/data/products.json',
    { headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, 'User-Agent': 'easyOhr-PriceBot' } }
  )
  if (!ghRes.ok) {
    return `GitHub API error: ${ghRes.status}`
  }
  const ghData = await ghRes.json() as any
  const currentProducts = JSON.parse(atob(ghData.content))
  const sha = ghData.sha

  // Deduplicate URLs to avoid fetching the same page multiple times
  const urlCache = new Map<string, number[]>()

  for (const product of currentProducts) {
    const urls = PRODUCT_URLS[product.slug]
    if (!urls) {
      logs.push(`${product.slug}: no URL mapping, skipped`)
      continue
    }

    // Fetch MySE prices (cached)
    let mysePrices: number[]
    if (urlCache.has(urls.mysecondear)) {
      mysePrices = urlCache.get(urls.mysecondear)!
    } else {
      mysePrices = await fetchPrice(urls.mysecondear)
      urlCache.set(urls.mysecondear, mysePrices)
    }

    // Fetch MrHear price
    let mrhearPrices: number[]
    if (urls.mrhear && urlCache.has(urls.mrhear)) {
      mrhearPrices = urlCache.get(urls.mrhear)!
    } else if (urls.mrhear) {
      mrhearPrices = await fetchPrice(urls.mrhear)
      urlCache.set(urls.mrhear, mrhearPrices)
    } else {
      mrhearPrices = []
    }

    const variant = MYSECONDEAR_VARIANT[product.slug] || ''
    const mysePrice = findBestMySEPrice(mysePrices, variant)
    const mrhearPrice = mrhearPrices.length > 0 ? mrhearPrices[mrhearPrices.length - 1] : null

    let newPrice: number | null = null
    if (mysePrice && mrhearPrice) {
      newPrice = Math.round((mysePrice + mrhearPrice) / 2)
    } else if (mysePrice) {
      newPrice = Math.round(mysePrice * 1.08)
    }

    results.push({
      slug: product.slug,
      mysecondear: mysePrice,
      mrhear: mrhearPrice,
      calculated: newPrice,
    })

    if (newPrice && Math.abs(newPrice - product.privatpreis) > 10) {
      product.privatpreis = newPrice
      product.kassenpreis = Math.max(0, newPrice - KASSENABZUG)
      logs.push(`${product.slug}: ${product.privatpreis} → ${newPrice} (MySE: ${mysePrice}, MrH: ${mrhearPrice || 'n/a'})`)
    } else {
      logs.push(`${product.slug}: unchanged at ${product.privatpreis} (MySE: ${mysePrice || 'n/a'}, MrH: ${mrhearPrice || 'n/a'})`)
    }
  }

  // Check if any prices changed
  const changedProducts = results.filter(r => r.calculated !== null)
  const hasChanges = currentProducts.some((p: any, i: number) => {
    const result = results.find(r => r.slug === p.slug)
    return result?.calculated && Math.abs(result.calculated - p.privatpreis) > 10
  })

  if (!hasChanges) {
    logs.push('No significant price changes detected.')
    return logs.join('\n')
  }

  // Update products.json on GitHub
  const newContent = btoa(unescape(encodeURIComponent(JSON.stringify(currentProducts, null, 2) + '\n')))

  const updateRes = await fetch(
    'https://api.github.com/repos/one-cloud-a1/easyOhr/contents/src/data/products.json',
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        'User-Agent': 'easyOhr-PriceBot',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `chore: auto-update prices (${new Date().toISOString().split('T')[0]})\n\n${logs.filter(l => l.includes('→')).join('\n')}`,
        content: newContent,
        sha,
      }),
    }
  )

  if (updateRes.ok) {
    logs.push('✓ products.json updated on GitHub — deployment will start automatically.')
  } else {
    const err = await updateRes.text()
    logs.push(`✗ GitHub update failed: ${err}`)
  }

  return logs.join('\n')
}
