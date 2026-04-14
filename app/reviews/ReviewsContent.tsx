'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Review } from '@/types';
import { RATING_LABELS } from '@/lib/constants';

interface ReactionState {
  agree: number;
  disagree: number;
  userReaction: 'agree' | 'disagree' | null;
}

interface Comment {
  id: string;
  content: string;
  author: string;
  created_at: string;
}

function StarDisplay({ value }: { value?: number }) {
  if (!value) return <span className="text-gray-400 text-sm">N/A</span>;
  return (
    <span>
      <span className="text-yellow-400">{'★'.repeat(value)}{'☆'.repeat(5 - value)}</span>
      <span className="text-gray-500 text-sm ml-1">{value}/5</span>
    </span>
  );
}

function CommentsSection({ reviewId, token, userId, initialCount }: {
  reviewId: string;
  token: string;
  userId: string | null;
  initialCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [count, setCount] = useState(initialCount);

  async function loadComments() {
    if (loaded) return;
    const res = await fetch(`/api/reviews/${reviewId}/comments?token=${token}`);
    const data = await res.json();
    setComments(data.comments || []);
    setLoaded(true);
  }

  function toggleOpen() {
    if (!open) loadComments();
    setOpen(o => !o);
  }

  async function postComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setPosting(true);
    const res = await fetch(`/api/reviews/${reviewId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newComment.trim(), token }),
    });
    const data = await res.json();
    setPosting(false);
    if (res.ok) {
      setComments(c => [...c, data.comment]);
      setCount(n => n + 1);
      setNewComment('');
    } else {
      alert(data.error || 'Failed to post comment');
    }
  }

  return (
    <div className="mt-4 pt-4 border-t">
      <button
        onClick={toggleOpen}
        className="text-sm text-gray-500 hover:text-gray-700 font-medium"
      >
        {open ? '▾' : '▸'} {count} comment{count !== 1 ? 's' : ''}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {comments.map(c => (
            <div key={c.id} className="bg-gray-50 rounded-lg px-3 py-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-600">{c.author}</span>
                <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-gray-700">{c.content}</p>
            </div>
          ))}

          {loaded && comments.length === 0 && (
            <p className="text-xs text-gray-400">No comments yet.</p>
          )}

          {userId ? (
            <form onSubmit={postComment} className="flex gap-2 mt-2">
              <input
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                maxLength={1000}
                className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="submit"
                disabled={posting || !newComment.trim()}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {posting ? '...' : 'Post'}
              </button>
            </form>
          ) : (
            <p className="text-xs text-gray-400 mt-2">
              <a href="/login" className="underline hover:text-blue-600">Sign in</a> to leave a comment.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ReviewCard({ review, token, userId, reactions: initialReactions, commentCount }: {
  review: Review;
  token: string;
  userId: string | null;
  reactions: ReactionState;
  commentCount: number;
}) {
  const [reactions, setReactions] = useState(initialReactions);
  const [flagged, setFlagged] = useState(review.is_flagged);

  const ratingKeys = Object.keys(RATING_LABELS) as (keyof typeof RATING_LABELS)[];
  const scores = ratingKeys.map(k => (review as any)[k]).filter(Boolean);
  const avgRating = scores.length ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : null;

  async function react(type: 'agree' | 'disagree') {
    if (!userId) { alert('Sign in to react to reviews.'); return; }
    const res = await fetch(`/api/reviews/${review.id}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reaction: type, token }),
    });
    if (!res.ok) { const d = await res.json(); alert(d.error); return; }
    const { reaction: newReaction } = await res.json();

    setReactions(prev => {
      const next = { ...prev };
      // Remove old reaction count
      if (prev.userReaction === 'agree') next.agree--;
      if (prev.userReaction === 'disagree') next.disagree--;
      // Add new reaction count
      if (newReaction === 'agree') next.agree++;
      if (newReaction === 'disagree') next.disagree++;
      next.userReaction = newReaction;
      return next;
    });
  }

  async function flagReview() {
    if (flagged) return;
    await fetch(`/api/reviews/${review.id}/flag`, { method: 'POST' });
    setFlagged(true);
  }

  return (
    <div className="border rounded-xl p-6 bg-white">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          {review.rotation && (
            <p className="text-sm text-gray-600 font-medium">
              {(review.rotation as any).trust}
              {(review.rotation as any).department && ` · ${(review.rotation as any).department}`}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-0.5">
            {(review.rotation as any)?.training_level}
            {review.months_completed && ` · ${review.months_completed} months`}
            {review.year_of_review && ` · ${review.year_of_review}/${(review.year_of_review + 1).toString().slice(2)}`}
          </p>
        </div>
        {avgRating && (
          <div className="text-right ml-4">
            <div className="text-xl font-bold text-gray-900">{avgRating.toFixed(1)}</div>
            <div className="text-xs text-gray-400">avg</div>
          </div>
        )}
      </div>

      {/* Ratings grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-4">
        {ratingKeys.map(key => (
          <div key={key} className="flex items-center justify-between text-xs">
            <span className="text-gray-500">{RATING_LABELS[key]}</span>
            <StarDisplay value={(review as any)[key]} />
          </div>
        ))}
      </div>

      {/* Free text */}
      {[
        { key: 'text_day_in_life', label: 'Typical day', color: 'text-gray-500' },
        { key: 'text_highlight', label: 'Highlight', color: 'text-green-600' },
        { key: 'text_lowlight', label: 'Lowlight', color: 'text-red-500' },
        { key: 'text_advice', label: 'Advice', color: 'text-blue-600' },
        { key: 'text_would_recommend', label: 'Would recommend?', color: 'text-gray-500' },
      ].map(({ key, label, color }) =>
        (review as any)[key] ? (
          <div key={key} className="mb-3">
            <p className={`text-xs font-semibold uppercase mb-1 ${color}`}>{label}</p>
            <p className="text-sm text-gray-700">{(review as any)[key]}</p>
          </div>
        ) : null
      )}

      {/* Agree / Disagree */}
      <div className="flex items-center gap-3 mt-4 pt-4 border-t">
        <button
          onClick={() => react('agree')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            reactions.userReaction === 'agree'
              ? 'bg-green-100 border-green-400 text-green-700'
              : 'border-gray-200 text-gray-500 hover:border-green-400 hover:text-green-600'
          }`}
        >
          👍 Agree <span className="text-xs font-bold">{reactions.agree}</span>
        </button>
        <button
          onClick={() => react('disagree')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            reactions.userReaction === 'disagree'
              ? 'bg-red-100 border-red-400 text-red-700'
              : 'border-gray-200 text-gray-500 hover:border-red-400 hover:text-red-600'
          }`}
        >
          👎 Disagree <span className="text-xs font-bold">{reactions.disagree}</span>
        </button>
        <div className="ml-auto">
          <button
            onClick={flagReview}
            disabled={flagged}
            className="text-xs text-gray-300 hover:text-red-400 disabled:opacity-50 transition-colors"
          >
            {flagged ? '⚑ Flagged' : '⚑ Flag'}
          </button>
        </div>
      </div>

      {/* Comments */}
      <CommentsSection
        reviewId={review.id}
        token={token}
        userId={userId}
        initialCount={commentCount}
      />
    </div>
  );
}

export default function ReviewsContent({ reviews, deanery, trainingLevel, token, userId, reactionsMap, commentCounts }: {
  reviews: Review[];
  deanery: string;
  trainingLevel: string;
  token: string;
  userId: string | null;
  reactionsMap: Record<string, { agree: number; disagree: number; userReaction: 'agree' | 'disagree' | null }>;
  commentCounts: Record<string, number>;
}) {
  const ratingKeys = Object.keys(RATING_LABELS) as (keyof typeof RATING_LABELS)[];

  const aggregated = ratingKeys.reduce((acc, key) => {
    const values = reviews.map(r => (r as any)[key]).filter(Boolean);
    acc[key] = values.length ? values.reduce((a: number, b: number) => a + b, 0) / values.length : 0;
    return acc;
  }, {} as Record<string, number>);

  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
      <div className="mb-6">
        <Link href="/browse" className="text-sm text-gray-400 hover:text-blue-600 mb-4 inline-block">
          ← Back to browse
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{trainingLevel}</h1>
            <p className="text-blue-600 font-medium">{deanery}</p>
            <p className="text-gray-400 text-sm mt-1">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={copyLink}
            className="flex-shrink-0 text-xs border rounded-lg px-3 py-1.5 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            {copied ? '✓ Copied' : '🔗 Share'}
          </button>
        </div>
      </div>

      {reviews.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <h2 className="font-bold text-gray-800 mb-4">Aggregated Ratings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ratingKeys.map(key => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{RATING_LABELS[key]}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-1.5">
                    <div className="bg-yellow-400 h-1.5 rounded-full" style={{ width: `${(aggregated[key] / 5) * 100}%` }} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 w-6 text-right">
                    {aggregated[key] ? aggregated[key].toFixed(1) : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {reviews.map(review => (
          <ReviewCard
            key={review.id}
            review={review}
            token={token}
            userId={userId}
            reactions={reactionsMap[review.id] || { agree: 0, disagree: 0, userReaction: null }}
            commentCount={commentCounts[review.id] || 0}
          />
        ))}
      </div>

      {reviews.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p>No reviews yet for this combination.</p>
        </div>
      )}
    </div>
  );
}
