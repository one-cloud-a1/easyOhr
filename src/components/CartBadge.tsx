import { useState, useEffect } from 'react'
import { getCartCount, onCartUpdate } from '../lib/cart'

export default function CartBadge() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    setCount(getCartCount())
    return onCartUpdate(() => setCount(getCartCount()))
  }, [])

  if (count === 0) return null

  return (
    <span style={{
      position: 'absolute',
      top: '-6px',
      right: '-8px',
      background: 'var(--color-accent)',
      color: 'white',
      fontSize: '0.7rem',
      fontWeight: 700,
      width: '18px',
      height: '18px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {count}
    </span>
  )
}
