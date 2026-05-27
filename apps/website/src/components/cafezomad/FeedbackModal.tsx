import { useState } from 'react'
import { supabase } from '../../config/supabase'
import { formatPaise } from './types'
import type { CafeOrderWithItems } from './types'

interface FeedbackModalProps {
  order: CafeOrderWithItems
  onClose: () => void
  onSubmitted: (rating: number) => void
}

const MAX_COMMENT_LENGTH = 1000

// Rating copy ladder. Mirrors the warmth of Uber's post-trip flow — the
// downside has a "we'll fix it" tone, the upside celebrates without sounding
// like marketing copy. Index n-1 maps to n stars.
const RATING_HEADLINES = [
  'Sorry we missed it',
  'Could have been better',
  'Pretty good',
  'Really good',
  'Made my day',
] as const

const RATING_SUBLINES = [
  'Tell us what went wrong — the chef will hear it.',
  'What would have made it land?',
  'Glad you liked it.',
  'Thanks — kitchen will be smiling.',
  'You\'re the reason the kitchen shows up.',
] as const

// Friendly fallback when the order row predates accepted_by capture (or the
// kitchen accepted via a code path that didn't pass an actor). Keeps the
// "from a real person" feel without inventing a name.
const KITCHEN_FALLBACK_NAME = 'the Zomad kitchen'

function cookDisplay(acceptedBy: string | null | undefined): string {
  if (!acceptedBy) return KITCHEN_FALLBACK_NAME
  const trimmed = acceptedBy.trim()
  if (!trimmed) return KITCHEN_FALLBACK_NAME
  // "arun.zo" → "Arun.zo". Title-case the leading segment only so the
  // ".zo" handle convention is preserved (Title-casing the whole thing
  // gives "Arun.Zo" which reads wrong).
  const dot = trimmed.indexOf('.')
  if (dot > 0) {
    const head = trimmed.slice(0, dot)
    const tail = trimmed.slice(dot)
    return head.charAt(0).toUpperCase() + head.slice(1).toLowerCase() + tail.toLowerCase()
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

export function FeedbackModal({ order, onClose, onSubmitted }: FeedbackModalProps) {
  const [rating, setRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const displayRating = hoverRating || rating
  const cookName = cookDisplay(order.accepted_by)

  const activeItems = order.order_items.filter((i) => i.item_status === 'active')
  const itemSummary = activeItems
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
        if (insertError.code === '23505') {
          onSubmitted(rating)
          return
        }
        throw insertError
      }
      onSubmitted(rating)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not submit feedback'
      setError(msg)
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl shadow-black/30 overflow-hidden">
        {/* Header */}
        <div className="bg-[#F1563F] px-6 pt-5 pb-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center"
            aria-label="Skip feedback"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/65">
            Order #{order.display_number} · {formatPaise(order.total)}
          </p>
          <h2 className="font-serif text-[26px] italic font-semibold leading-tight mt-1.5">
            How was your meal?
          </h2>
          <p className="text-[13px] text-white/90 font-medium mt-2 leading-snug">
            Made with love by{' '}
            <span className="font-bold underline decoration-white/40 underline-offset-2">
              {cookName}
            </span>
          </p>
          {itemSummary && (
            <p className="text-[11px] text-white/70 font-medium mt-1.5 leading-snug line-clamp-2">
              {itemSummary}
            </p>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Stars */}
          <div className="flex items-center justify-center gap-1">
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
                  className="p-1 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F1563F]/40 active:scale-90 transition-transform"
                >
                  <svg
                    className={`w-10 h-10 ${active ? 'text-[#F1563F]' : 'text-stone-300'}`}
                    fill="currentColor"
                    stroke="rgba(0,0,0,0.18)"
                    strokeWidth={0.7}
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.5l2.92 6.55 7.08.66-5.36 4.83 1.6 7-6.24-3.8-6.24 3.8 1.6-7L1.99 9.71l7.09-.66L12 2.5z" />
                  </svg>
                </button>
              )
            })}
          </div>

          {rating > 0 && (
            <div className="text-center -mt-1">
              <p className="text-sm font-extrabold tracking-tight text-black">
                {RATING_HEADLINES[rating - 1]}
              </p>
              <p className="text-[12px] text-black/55 font-medium mt-0.5 leading-snug">
                {RATING_SUBLINES[rating - 1]}
              </p>
            </div>
          )}

          {/* Optional comment */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-black/40 mb-1.5">
              {rating >= 4 ? 'Anything to share with the kitchen?' : 'Help us fix it (optional)'}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, MAX_COMMENT_LENGTH))}
              placeholder={
                rating === 0
                  ? 'What stood out? What could be better?'
                  : rating >= 4
                  ? `${cookName} would love to hear it…`
                  : 'What didn\'t land?'
              }
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
              Maybe later
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={rating < 1 || submitting}
              className="flex-[1.4] h-11 rounded-2xl bg-[#F1563F] text-white text-sm font-extrabold tracking-wide active:scale-[0.98] transition-transform disabled:opacity-40 disabled:active:scale-100"
            >
              {submitting ? 'Sending…' : rating >= 4 ? 'Send love' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
