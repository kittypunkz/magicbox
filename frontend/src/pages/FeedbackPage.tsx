import { useState, useCallback } from 'react';
import { Star, Send, MessageSquare } from 'lucide-react';
import { feedbackAPI } from '../api/client';

const c = {
  bg: 'bg-[#191919]',
  hover: 'hover:bg-[#2a2a2a]',
  text: 'text-[#e6e6e6]',
  gray: 'text-[#6b6b6b]',
  border: 'border-[#2f2f2f]',
  input: 'bg-[#2a2a2a]',
};

// Star rating component
function StarRating({ 
  rating, 
  onRatingChange, 
  readonly = false 
}: { 
  rating: number; 
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
}) {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onRatingChange?.(star)}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          onMouseLeave={() => !readonly && setHoverRating(0)}
          className={`p-1 transition-transform ${!readonly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
        >
          <Star 
            size={28} 
            className={`
              ${(hoverRating || rating) >= star 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-[#6b6b6b]'}
              transition-colors
            `}
          />
        </button>
      ))}
    </div>
  );
}


export function FeedbackPage() {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await feedbackAPI.submit(rating, comment);
      setSubmitSuccess(true);
      setRating(0);
      setComment('');
      
      // Reset success message after 3 seconds
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  }, [rating, comment]);

  return (
    <div
      data-area-id="feedbackpage"
      className={`feedbackpage h-full overflow-y-auto ${c.bg}`}
    >
      {/* Header */}
      <div
        data-area-id="feedbackpage-header"
        className={`feedbackpage-header sticky top-0 bg-[#202020] border-b ${c.border} px-4 sm:px-8 py-4 sm:py-6 z-10`}
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#2a2a2a] rounded-xl flex items-center justify-center flex-shrink-0">
            <MessageSquare size={20} className="text-[#6b6b6b] sm:hidden" />
            <MessageSquare size={24} className="text-[#6b6b6b] hidden sm:block" />
          </div>
          <div>
            <h1 className={`text-lg sm:text-2xl font-bold ${c.text}`}>Feedback</h1>
            <p className={`text-xs sm:text-sm ${c.gray}`}>Help us improve MagicBox</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-8 py-4 sm:py-6 max-w-xl">
        {/* Submit Form */}
        <div className={`${c.input} border ${c.border} rounded-xl p-4 sm:p-6`}>
          <h2 className={`text-sm font-semibold ${c.text} mb-4`}>
            Rate Your Experience
          </h2>

          {/* Star Rating */}
          <div className="mb-6">
            <StarRating rating={rating} onRatingChange={setRating} />
            {rating > 0 && (
              <p className={`text-sm ${c.gray} mt-2`}>
                {rating === 1 && 'Very Poor'}
                {rating === 2 && 'Poor'}
                {rating === 3 && 'Average'}
                {rating === 4 && 'Good'}
                {rating === 5 && 'Excellent!'}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="mb-4">
            <label className={`text-sm ${c.gray} block mb-2`}>
              Comments (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us what you think..."
              rows={4}
              className={`
                w-full ${c.input} border ${c.border} rounded-lg p-3
                text-sm ${c.text} placeholder-[#6b6b6b] outline-none
                focus:border-blue-500 transition-colors resize-none
              `}
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className={`
              w-full flex items-center justify-center gap-2 px-4 py-3
              bg-blue-500 hover:bg-blue-600 active:bg-blue-700
              disabled:bg-blue-500/50 disabled:cursor-not-allowed
              text-white rounded-lg font-medium text-sm
              transition-colors active:scale-[0.98] transform
            `}
          >
            {isSubmitting ? (
              <span>Submitting...</span>
            ) : (
              <>
                <Send size={16} />
                <span>Submit Feedback</span>
              </>
            )}
          </button>

          {/* Error Message */}
          {error && (
            <p className="text-sm text-red-400 mt-3 text-center">{error}</p>
          )}

          {/* Success Message */}
          {submitSuccess && (
            <p className="text-sm text-green-400 mt-3 text-center">
              Thank you for your feedback! 🎉
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
