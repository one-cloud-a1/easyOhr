export interface CartItem {
  slug: string
  name: string
  hersteller: string
  farbe: string
  privatpreis: number
  kassenpreis: number
  menge: number
}

const CART_KEY = 'easyohr-cart'
const CART_EVENT = 'easyohr-cart-update'

/**
 * Höchstzahl Geräte pro Anfrage. Zwei Ohren sind die maximale Versorgung —
 * mehr ist immer ein Eingabefehler.
 */
export const MAX_GERAETE = 2

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(CART_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveCart(cart: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart))
  window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: cart }))
}

/**
 * Legt ein Gerät in den Warenkorb. Gibt `false` zurück, wenn dadurch
 * {@link MAX_GERAETE} überschritten würde — der Warenkorb bleibt dann unverändert.
 */
export function addToCart(item: Omit<CartItem, 'menge'>, menge = 1): boolean {
  const cart = getCart()
  if (getCartCount() + menge > MAX_GERAETE) return false

  const existing = cart.find(i => i.slug === item.slug && i.farbe === item.farbe)
  if (existing) {
    existing.menge += menge
  } else {
    cart.push({ ...item, menge })
  }
  saveCart(cart)
  return true
}

/** Wie viele Geräte noch hinzugefügt werden dürfen. */
export function getRestplaetze(): number {
  return Math.max(0, MAX_GERAETE - getCartCount())
}

export function removeFromCart(slug: string, farbe?: string) {
  let cart = getCart()
  if (farbe) {
    cart = cart.filter(i => !(i.slug === slug && i.farbe === farbe))
  } else {
    cart = cart.filter(i => i.slug !== slug)
  }
  saveCart(cart)
}

export function clearCart() {
  saveCart([])
}

export function getCartCount(): number {
  return getCart().reduce((sum, item) => sum + item.menge, 0)
}

export function getCartTotal(): number {
  return getCart().reduce((sum, item) => sum + item.privatpreis * item.menge, 0)
}

export function onCartUpdate(callback: (cart: CartItem[]) => void) {
  const handler = (e: Event) => callback((e as CustomEvent).detail)
  window.addEventListener(CART_EVENT, handler)
  return () => window.removeEventListener(CART_EVENT, handler)
}
