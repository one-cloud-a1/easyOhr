interface Env {
  MOLLIE_API_KEY: string
  SUPABASE_URL: string
  SUPABASE_SERVICE_KEY: string
  ADMIN_SECRET: string
  SITE_URL: string
}

const MOLLIE_API = 'https://api.mollie.com/v2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}

async function mollieRequest(path: string, env: Env, options: RequestInit = {}) {
  const res = await fetch(`${MOLLIE_API}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${env.MOLLIE_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  return res.json() as Promise<any>
}

async function supabaseRequest(path: string, env: Env, options: RequestInit = {}) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      'apikey': env.SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...options.headers,
    },
  })
  return res.json() as Promise<any>
}

async function handleCreateOrder(request: Request, env: Env) {
  const { customer, items } = await request.json() as any

  if (!customer?.email || !items?.length) {
    return json({ error: 'Fehlende Pflichtfelder' }, 400)
  }

  const orderLines = items.map((item: any) => ({
    name: `${item.name} (${item.farbe})`,
    quantity: item.menge || 1,
    unitPrice: { currency: 'EUR', value: item.privatpreis.toFixed(2) },
    totalAmount: { currency: 'EUR', value: (item.privatpreis * (item.menge || 1)).toFixed(2) },
    vatRate: '19.00',
    vatAmount: {
      currency: 'EUR',
      value: (item.privatpreis * (item.menge || 1) * 19 / 119).toFixed(2),
    },
  }))

  const totalAmount = items.reduce(
    (sum: number, item: any) => sum + item.privatpreis * (item.menge || 1), 0
  )

  // Mollie Orders API: order is created, customer pays via credit card.
  // Payment stays "authorized" until we create a shipment (= capture).
  // No money is charged until shipment is created.
  const mollieOrder = await mollieRequest('/orders', env, {
    method: 'POST',
    body: JSON.stringify({
      amount: { currency: 'EUR', value: totalAmount.toFixed(2) },
      orderNumber: `EO-${Date.now()}`,
      lines: orderLines,
      billingAddress: {
        givenName: customer.vorname,
        familyName: customer.nachname,
        email: customer.email,
        phone: customer.telefon,
        streetAndNumber: customer.strasse,
        postalCode: customer.plz,
        city: customer.ort,
        country: 'DE',
      },
      redirectUrl: `${env.SITE_URL}/konto/?bestellung=erfolgreich`,
      webhookUrl: `${env.SITE_URL}/api/order/webhook`,
      method: ['creditcard'],
      locale: 'de_DE',
    }),
  })

  if (mollieOrder.status === 'error' || mollieOrder.title) {
    return json({ error: mollieOrder.detail || 'Mollie-Fehler' }, 500)
  }

  await supabaseRequest('/orders', env, {
    method: 'POST',
    body: JSON.stringify({
      mollie_order_id: mollieOrder.id,
      status: mollieOrder.status,
      customer_email: customer.email,
      customer_name: `${customer.vorname} ${customer.nachname}`,
      customer_phone: customer.telefon,
      customer_address: `${customer.strasse}, ${customer.plz} ${customer.ort}`,
      items: JSON.stringify(items),
      total: totalAmount,
    }),
  })

  const checkoutUrl = mollieOrder._links?.checkout?.href
  return json({ checkoutUrl, orderId: mollieOrder.id })
}

async function handleWebhook(request: Request, env: Env) {
  const formData = await request.formData()
  const id = formData.get('id') as string
  if (!id) return json({ error: 'Missing id' }, 400)

  const mollieOrder = await mollieRequest(`/orders/${id}`, env)

  await supabaseRequest(`/orders?mollie_order_id=eq.${id}`, env, {
    method: 'PATCH',
    body: JSON.stringify({ status: mollieOrder.status }),
  })

  return json({ received: true })
}

// Capture = create a shipment in Mollie, which triggers the payment capture
async function handleCapture(request: Request, env: Env) {
  const auth = request.headers.get('Authorization')
  if (auth !== `Bearer ${env.ADMIN_SECRET}`) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const { orderId } = await request.json() as any
  if (!orderId) return json({ error: 'Missing orderId' }, 400)

  // Get the order to find its lines
  const mollieOrder = await mollieRequest(`/orders/${orderId}`, env)
  if (mollieOrder.title) {
    return json({ error: mollieOrder.detail || 'Order nicht gefunden' }, 404)
  }

  // Create shipment for all lines — this captures the authorized payment
  const shipment = await mollieRequest(`/orders/${orderId}/shipments`, env, {
    method: 'POST',
    body: JSON.stringify({}),
  })

  if (shipment.title) {
    return json({ error: shipment.detail || 'Shipment fehlgeschlagen' }, 500)
  }

  await supabaseRequest(`/orders?mollie_order_id=eq.${orderId}`, env, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'captured' }),
  })

  return json({ success: true })
}

async function handleCancel(request: Request, env: Env) {
  const auth = request.headers.get('Authorization')
  if (auth !== `Bearer ${env.ADMIN_SECRET}`) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const { orderId } = await request.json() as any
  if (!orderId) return json({ error: 'Missing orderId' }, 400)

  await mollieRequest(`/orders/${orderId}`, env, { method: 'DELETE' })

  await supabaseRequest(`/orders?mollie_order_id=eq.${orderId}`, env, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'cancelled' }),
  })

  return json({ success: true })
}

async function handleGetOrders(request: Request, env: Env) {
  const auth = request.headers.get('Authorization')
  if (auth !== `Bearer ${env.ADMIN_SECRET}`) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const orders = await supabaseRequest('/orders?order=created_at.desc', env)
  return json(orders)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    const url = new URL(request.url)
    const path = url.pathname

    try {
      if (path === '/api/order/create' && request.method === 'POST') {
        return handleCreateOrder(request, env)
      }
      if (path === '/api/order/webhook' && request.method === 'POST') {
        return handleWebhook(request, env)
      }
      if (path === '/api/order/capture' && request.method === 'POST') {
        return handleCapture(request, env)
      }
      if (path === '/api/order/cancel' && request.method === 'POST') {
        return handleCancel(request, env)
      }
      if (path === '/api/orders' && request.method === 'GET') {
        return handleGetOrders(request, env)
      }

      return json({ error: 'Not found' }, 404)
    } catch (err) {
      return json({ error: 'Internal server error' }, 500)
    }
  },
}
