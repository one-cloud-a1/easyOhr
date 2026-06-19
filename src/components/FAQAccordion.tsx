import { useState } from 'react'

interface FAQItem {
  frage: string
  antwort: string
}

export default function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="faq-list">
      {items.map((item, index) => (
        <div key={index} className={`faq-item ${openIndex === index ? 'faq-open' : ''}`}>
          <button
            className="faq-question"
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            aria-expanded={openIndex === index}
          >
            <span>{item.frage}</span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              style={{
                transform: openIndex === index ? 'rotate(180deg)' : 'rotate(0)',
                transition: 'transform 0.2s ease',
                flexShrink: 0,
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {openIndex === index && (
            <div className="faq-answer">
              <p>{item.antwort}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
