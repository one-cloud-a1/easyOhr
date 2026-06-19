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

export function addToCart(item: Omit<CartItem, 'menge'>) {
  const cart = getCart()
  const existing = cart.find(i => i.slug === item.slug && i.farbe === item.farbe)
  if (existing) {
    existing.menge += 1
  } else {
    cart.push({ ...item, menge: 1 })
  }
  saveCart(cart)
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
