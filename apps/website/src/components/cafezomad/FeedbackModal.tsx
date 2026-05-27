import { useState } from 'react'
import { supabase } from '../../config/supabase'
import { formatPaise } from './types'
import type { CafeOrderWithItems } from './types'

interface FeedbackModalProps {
  order: CafeOrderWithItems
  onClose: () => void
  onSubmitted: () => void
}

const MAX_COMMENT_LENGTH = 1000

export function FeedbackModal({ order, onClose, onSubmitted }: FeedbackModalProps) {
  const [rating, setRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const itemSummary = order.order_items
    .filter((i) => i.item_status === 'active')
    .map((i) => (i.quantity > 1 ? `${i.name} ×${i.quantity}` : i.name))
    .join(', ')

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5 || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const { error: insertError } = await supabase.from('cafe_order_feedback').insert({
        order_id: order.id,
        zo_user_id: order.zo_user_id,
        property_id: order.property_id,
        rating,
        comment: comment.trim() ? comment.trim().slice(0, MAX_COMMENT_LENGTH) : null,
      })

      if (insertError) {
        // 23505 = unique_violation. Treat as "already rated" — silently close
        // so the user isn't punished for clicking through twice.
        if (insertError.code === '23505') {
          onSubmitted()
          return
        }
        throw insertError
      }
      onSubmitted()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not submit feedback'
      setError(msg)
      setSubmitting(false)
    }
  }

  const displayRating = hoverRating || rating

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl shadow-black/30 overflow-hidden">
        {/* Header */}
        <div className="bg-[#F1563F] px-6 pt-5 pb-4 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
                Order #{order.display_number} · {formatPaise(order.total)}
              </p>
              <h2 className="font-serif text-2xl italic font-semibold leading-tight mt-1">
                How was your meal?
              </h2>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center"
              aria-label="Skip feedback"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {itemSummary && (
            <p className="text-[12px] text-white/85 font-medium mt-2 leading-snug line-clamp-2">
              {itemSummary}
            </p>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Stars */}
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => {
              const active = n <= displayRating
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={`${n} star${n === 1 ? '' : 's'}`}
                  className="p-1 active:scale-90 transition-transform"
                >
                  <svg
                    className={`w-9 h-9 ${active ? 'text-[#F1563F]' : 'text-black/15'}`}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.5l2.92 6.55 7.08.66-5.36 4.83 1.6 7-6.24-3.8-6.24 3.8 1.6-7L1.99 9.71l7.09-.66L12 2.5z" />
                  </svg>
                </button>
              )
            })}
          </div>

          {rating > 0 && (
            <p className="text-center text-xs font-bold uppercase tracking-widest text-black/50">
              {rating === 5
                ? 'Amazing'
                : rating === 4
                ? 'Pretty good'
                : rating === 3
                ? 'It was okay'
                : rating === 2
                ? 'Could be better'
                : 'Not great'}
            </p>
          )}

          {/* Optional comment */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-black/40 mb-1.5">
              Tell us more (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
              placeholder="What stood out? What could be better?"
              rows={3}
              className="w-full px-3 py-2.5 text-sm text-black bg-stone-50 rounded-xl ring-1 ring-black/10 focus:outline-none focus:ring-2 focus:ring-[#F1563F]/40 placeholder:text-black/30 resize-none"
            />
            <p className="text-[10px] text-black/30 text-right mt-1 font-mono">
              {comment.length}/{MAX_COMMENT_LENGTH}
            </p>
          </div>

          {error && (
            <p className="text-xs font-semibold text-red-600 bg-red-50 ring-1 ring-red-100 px-3 py-2 rounded-xl">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 h-11 rounded-2xl bg-stone-100 text-black/70 text-sm font-bold tracking-wide active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={rating < 1 || submitting}
              className="flex-[1.4] h-11 rounded-2xl bg-[#F1563F] text-white text-sm font-extrabold tracking-wide active:scale-[0.98] transition-transform disabled:opacity-40 disabled:active:scale-100"
            >
              {submitting ? 'Sending…' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
