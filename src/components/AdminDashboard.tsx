import { useState, useEffect } from 'react'

interface Order {
  id: number
  mollie_order_id: string
  status: string
  customer_email: string
  customer_name: string
  customer_phone: string
  customer_address: string
  items: string
  total: number
  created_at: string
}

export default function AdminDashboard() {
  const [secret, setSecret] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const apiUrl = import.meta.env.PUBLIC_API_URL || ''

  const fetchOrders = async (adminSecret: string) => {
    setLoading(true)
    try {
      const res = await fetch(`${apiUrl}/api/orders`, {
        headers: { 'Authorization': `Bearer ${adminSecret}` },
      })
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
        setAuthenticated(true)
      } else {
        alert('Falsches Admin-Passwort')
      }
    } catch {
      alert('Verbindungsfehler')
    }
    setLoading(false)
  }

  const handleAction = async (orderId: string, action: 'capture' | 'cancel') => {
    if (!confirm(action === 'capture'
      ? 'Zahlung wirklich einziehen?'
      : 'Bestellung wirklich stornieren?'
    )) return

    setActionLoading(orderId)
    try {
      const res = await fetch(`${apiUrl}/api/order/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${secret}`,
        },
        body: JSON.stringify({ orderId }),
      })
      if (res.ok) {
        await fetchOrders(secret)
      } else {
        alert('Aktion fehlgeschlagen')
      }
    } catch {
      alert('Verbindungsfehler')
    }
    setActionLoading(null)
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    fetchOrders(secret)
  }

  if (!authenticated) {
    return (
      <div className="admin-login">
        <h1>Admin-Dashboard</h1>
        <p>Geben Sie das Admin-Passwort ein.</p>
        <form onSubmit={handleLogin}>
          <div className="auth-group">
            <label htmlFor="admin-secret">Admin-Passwort</label>
            <input
              id="admin-secret"
              type="password"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Prüfe...' : 'Anmelden'}
          </button>
        </form>
      </div>
    )
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case 'authorized': return 'In Testphase'
      case 'captured': return 'Bezahlt'
      case 'cancelled': return 'Storniert'
      case 'created': return 'Erstellt'
      case 'paid': return 'Bezahlt'
      default: return status
    }
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Bestellungen</h1>
        <button className="btn btn-outline" onClick={() => fetchOrders(secret)}>
          Aktualisieren
        </button>
      </div>

      <div className="admin-stats">
        <div className="admin-stat">
          <span className="admin-stat-label">Gesamt</span>
          <span className="admin-stat-value">{orders.length}</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat-label">In Testphase</span>
          <span className="admin-stat-value">{orders.filter(o => o.status === 'authorized').length}</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat-label">Bezahlt</span>
          <span className="admin-stat-value">{orders.filter(o => o.status === 'captured' || o.status === 'paid').length}</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat-label">Storniert</span>
          <span className="admin-stat-value">{orders.filter(o => o.status === 'cancelled').length}</span>
        </div>
      </div>

      {orders.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '3rem' }}>
          Noch keine Bestellungen vorhanden.
        </p>
      ) : (
        <div className="admin-orders">
          {orders.map(order => {
            let parsedItems: any[] = []
            try { parsedItems = JSON.parse(order.items) } catch {}

            return (
              <div key={order.id} className="admin-order">
                <div className="admin-order-header">
                  <div>
                    <span className="admin-order-id">{order.mollie_order_id}</span>
                    <span className={`order-status order-status-${order.status}`}>
                      {statusLabel(order.status)}
                    </span>
                  </div>
                  <span className="admin-order-date">
                    {new Date(order.created_at).toLocaleDateString('de-DE', {
                      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>

                <div className="admin-order-customer">
                  <strong>{order.customer_name}</strong>
                  <span>{order.customer_email}</span>
                  <span>{order.customer_phone}</span>
                  <span>{order.customer_address}</span>
                </div>

                <div className="admin-order-items">
                  {parsedItems.map((item: any, i: number) => (
                    <div key={i} className="admin-item">
                      <span>{item.name} — {item.farbe}</span>
                      <span>{item.privatpreis?.toLocaleString('de-DE')} €</span>
                    </div>
                  ))}
                </div>

                <div className="admin-order-footer">
                  <span className="admin-order-total">
                    Gesamt: {Number(order.total).toLocaleString('de-DE')} €
                  </span>
                  {order.status === 'authorized' && (
                    <div className="admin-order-actions">
                      <button
                        className="btn btn-primary"
                        onClick={() => handleAction(order.mollie_order_id, 'capture')}
                        disabled={actionLoading === order.mollie_order_id}
                      >
                        Zahlung einziehen
                      </button>
                      <button
                        className="btn btn-outline"
                        style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                        onClick={() => handleAction(order.mollie_order_id, 'cancel')}
                        disabled={actionLoading === order.mollie_order_id}
                      >
                        Stornieren
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
