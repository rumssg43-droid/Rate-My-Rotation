'use client';

import { useState, useMemo } from 'react';
import { Review } from '@/types';
import { DEANERIES, TRAINING_LEVELS, RATING_LABELS } from '@/lib/constants';

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border rounded-xl p-4">
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm font-medium text-gray-600 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function exportCSV(reviews: Review[]) {
  const ratingKeys = Object.keys(RATING_LABELS);
  const headers = [
    'id', 'created_at', 'deanery', 'training_level', 'trust', 'department',
    'year_of_review', 'months_completed', 'is_approved', 'is_flagged',
    ...ratingKeys,
    'text_day_in_life', 'text_highlight', 'text_lowlight',
    'text_advice', 'text_interview_tips', 'text_would_recommend',
  ];

  const rows = reviews.map(r => {
    const rot = r.rotation as any;
    return [
      r.id, r.created_at,
      rot?.deanery, rot?.training_level, rot?.trust, rot?.department,
      r.year_of_review, r.months_completed, r.is_approved, r.is_flagged,
      ...ratingKeys.map(k => (r as any)[k] ?? ''),
      r.text_day_in_life, r.text_highlight, r.text_lowlight,
      r.text_advice, r.text_interview_tips, r.text_would_recommend,
    ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rmr-reviews-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminPanel({ reviews, referrals, tokens, secret }: {
  reviews: Review[];
  referrals: any[];
  tokens: any[];
  secret: string;
}) {
  const [list, setList] = useState(reviews);
  const [search, setSearch] = useState('');
  const [filterDeanery, setFilterDeanery] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'flagged' | 'removed'>('all');
  const [tab, setTab] = useState<'all' | 'flagged'>('all');

  const totalRevenue = tokens.reduce((sum: number, t: any) => sum + (t.amount_paid_pence || 0), 0);
  const avgRating = useMemo(() => {
    const ratingKeys = Object.keys(RATING_LABELS);
    const all: number[] = [];
    list.forEach(r => ratingKeys.forEach(k => { const v = (r as any)[k]; if (v) all.push(v); }));
    return all.length ? (all.reduce((a, b) => a + b, 0) / all.length).toFixed(1) : '—';
  }, [list]);

  const filtered = useMemo(() => {
    return list.filter(r => {
      const rot = r.rotation as any;
      if (filterDeanery && rot?.deanery !== filterDeanery) return false;
      if (filterLevel && rot?.training_level !== filterLevel) return false;
      if (filterStatus === 'approved' && (!r.is_approved || r.is_flagged)) return false;
      if (filterStatus === 'flagged' && !r.is_flagged) return false;
      if (filterStatus === 'removed' && r.is_approved) return false;
      if (tab === 'flagged' && !r.is_flagged) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack = [
          rot?.trust, rot?.deanery, rot?.training_level,
          r.text_highlight, r.text_lowlight, r.text_advice,
          r.text_day_in_life, r.text_interview_tips, r.text_would_recommend,
        ].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [list, search, filterDeanery, filterLevel, filterStatus, tab]);

  async function updateReview(id: string, action: 'approve' | 'remove') {
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      setList(l => l.map(r => r.id === id
        ? { ...r, is_approved: action === 'approve', is_flagged: false }
        : r
      ));
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <button
          onClick={() => exportCSV(filtered)}
          className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
        >
          Export CSV ({filtered.length})
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Reviews" value={list.length} />
        <StatCard label="Avg Rating" value={avgRating} sub="across all dimensions" />
        <StatCard label="Flagged" value={list.filter(r => r.is_flagged).length} />
        <StatCard
          label="Revenue"
          value={`£${(totalRevenue / 100).toFixed(2)}`}
          sub={`${tokens.length} purchases`}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search reviews..."
          className="border rounded-lg px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <select
          value={filterDeanery}
          onChange={e => setFilterDeanery(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">All deaneries</option>
          {DEANERIES.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select
          value={filterLevel}
          onChange={e => setFilterLevel(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">All levels</option>
          {TRAINING_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as any)}
          className="border rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="approved">Approved</option>
          <option value="flagged">Flagged</option>
          <option value="removed">Removed</option>
        </select>
        {(search || filterDeanery || filterLevel || filterStatus !== 'all') && (
          <button
            onClick={() => { setSearch(''); setFilterDeanery(''); setFilterLevel(''); setFilterStatus('all'); }}
            className="text-sm text-gray-400 hover:text-gray-600 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b mb-6">
        {(['all', 'flagged'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {t === 'all' ? `All (${filtered.length})` : `Flagged (${list.filter(r => r.is_flagged).length})`}
          </button>
        ))}
      </div>

      {/* Reviews */}
      <div className="space-y-4">
        {filtered.map(review => {
          const rot = review.rotation as any;
          const ratingKeys = Object.keys(RATING_LABELS);
          const scores = ratingKeys.map(k => (review as any)[k]).filter(Boolean);
          const avg = scores.length ? (scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(1) : null;

          return (
            <div
              key={review.id}
              className={`border rounded-xl p-5 ${review.is_flagged ? 'border-yellow-300 bg-yellow-50' : !review.is_approved ? 'opacity-50' : 'bg-white'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-sm text-gray-900">{rot?.trust}</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{rot?.training_level}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{rot?.deanery}</span>
                    {rot?.department && <span className="text-xs text-gray-400">{rot.department}</span>}
                    {review.is_flagged && <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">Flagged</span>}
                    {!review.is_approved && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Removed</span>}
                  </div>
                  <p className="text-xs text-gray-400 mb-2">
                    {new Date(review.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {review.year_of_review && ` · ${review.year_of_review}/${(review.year_of_review + 1).toString().slice(2)}`}
                    {review.months_completed && ` · ${review.months_completed} months`}
                    {avg && ` · avg rating ${avg}`}
                  </p>

                  {/* Ratings row */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
                    {ratingKeys.map(k => {
                      const v = (review as any)[k];
                      if (!v) return null;
                      return (
                        <span key={k} className="text-xs text-gray-500">
                          {RATING_LABELS[k].split(' ')[0]}: <strong>{v}/5</strong>
                        </span>
                      );
                    })}
                  </div>

                  {/* Text snippets */}
                  {review.text_highlight && (
                    <p className="text-xs text-gray-600 mb-1">
                      <span className="font-semibold text-green-600">+</span> {review.text_highlight.slice(0, 200)}{review.text_highlight.length > 200 ? '…' : ''}
                    </p>
                  )}
                  {review.text_lowlight && (
                    <p className="text-xs text-gray-600">
                      <span className="font-semibold text-red-500">−</span> {review.text_lowlight.slice(0, 200)}{review.text_lowlight.length > 200 ? '…' : ''}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {!review.is_approved ? (
                    <button onClick={() => updateReview(review.id, 'approve')} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">Restore</button>
                  ) : (
                    <>
                      {review.is_flagged && (
                        <button onClick={() => updateReview(review.id, 'approve')} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">Keep</button>
                      )}
                      <button onClick={() => updateReview(review.id, 'remove')} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700">Remove</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p className="text-center text-gray-400 py-12">No reviews match your filters.</p>
        )}
      </div>
    </div>
  );
}
