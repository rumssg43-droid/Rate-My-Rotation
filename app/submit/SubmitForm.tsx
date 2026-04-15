'use client';

import { useState } from 'react';
import { SPECIALTIES, DEANERIES, TRAINING_LEVELS, RATING_LABELS } from '@/lib/constants';

const STEPS = ['Rotation Details', 'Ratings', 'Free Text'];

const YEARS = Array.from({ length: 5 }, (_, i) => 2025 - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`text-2xl transition-colors ${star <= value ? 'text-yellow-400' : 'text-gray-300'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function SubmitForm() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [myReferralCode, setMyReferralCode] = useState('');
  const [trustSearch, setTrustSearch] = useState('');
  const [trustSuggestions, setTrustSuggestions] = useState<string[]>([]);

  const [form, setForm] = useState({
    training_level: '',
    specialty: '',
    deanery: '',
    trust: '',
    department: '',
    year_of_review: '',
    months_completed: '',
    rating_overall: 0,
    rating_teaching: 0,
    rating_consultant_support: 0,
    rating_operative_exposure: 0,
    rating_workload: 0,
    rating_rota_quality: 0,
    rating_wellbeing: 0,
    rating_career_value: 0,
    text_day_in_life: '',
    text_highlight: '',
    text_lowlight: '',
    text_advice: '',
    text_interview_tips: '',
    text_would_recommend: '',
    referral_code: '',
  });

  const set = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  const step1Valid = !!(form.training_level && form.specialty && form.deanery && form.trust && form.year_of_review && form.months_completed);

  async function searchTrusts(query: string) {
    setTrustSearch(query);
    set('trust', query);
    if (query.length < 2) { setTrustSuggestions([]); return; }
    const res = await fetch(`/api/rotations/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setTrustSuggestions(data.trusts || []);
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setMyReferralCode(data.referral_code);
        setDone(true);
      } else {
        alert(data.error || 'Submission failed');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="text-center py-10">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Thank you!</h2>
        <p className="text-gray-500 mb-6">Your review has been submitted and will help other doctors make better career decisions.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className={`flex-1 h-1.5 rounded-full ${i <= step ? 'bg-blue-600' : 'bg-gray-200'}`} />
        ))}
      </div>
      <div className="text-sm text-gray-400 mb-6">Step {step + 1} of {STEPS.length}: <span className="font-medium text-gray-600">{STEPS[step]}</span></div>

      {/* Step 1 */}
      {step === 0 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Training Level *</label>
            <select value={form.training_level} onChange={e => set('training_level', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">Select...</option>
              {TRAINING_LEVELS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Specialty *</label>
            <select value={form.specialty} onChange={e => set('specialty', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">Select...</option>
              {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deanery *</label>
            <select value={form.deanery} onChange={e => set('deanery', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">Select...</option>
              {DEANERIES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Trust / Hospital *</label>
            <input
              value={trustSearch}
              onChange={e => searchTrusts(e.target.value)}
              placeholder="Start typing a trust name..."
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            {trustSuggestions.length > 0 && (
              <div className="absolute z-10 w-full border rounded-lg bg-white shadow-lg mt-1 max-h-48 overflow-y-auto">
                {trustSuggestions.map(t => (
                  <button key={t} type="button" onClick={() => { set('trust', t); setTrustSearch(t); setTrustSuggestions([]); }}
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50">{t}</button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department (optional)</label>
            <input value={form.department} onChange={e => set('department', e.target.value)} placeholder="e.g. Upper GI, Spine" className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year of Rotation *</label>
              <select value={form.year_of_review} onChange={e => set('year_of_review', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="">Select...</option>
                {YEARS.map(y => <option key={y} value={y}>{y}/{(y+1).toString().slice(2)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Months in Post *</label>
              <select value={form.months_completed} onChange={e => set('months_completed', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="">Select...</option>
                {MONTHS.map(m => <option key={m} value={m}>{m} month{m !== 1 ? 's' : ''}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 1 && (
        <div className="space-y-6">
          {Object.entries(RATING_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">{label}</label>
              <StarRating value={(form as any)[key]} onChange={v => set(key, v)} />
            </div>
          ))}
        </div>
      )}

      {/* Step 3 */}
      {step === 2 && (
        <div className="space-y-5">
          {[
            { key: 'text_day_in_life', label: 'Describe a typical day on this rotation' },
            { key: 'text_highlight', label: 'What was the best thing about this post?' },
            { key: 'text_lowlight', label: 'What was the worst thing about this post?' },
            { key: 'text_advice', label: 'What advice would you give someone starting this rotation?' },
            { key: 'text_would_recommend', label: 'Would you recommend this post, and why?' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <textarea
                value={(form as any)[key]}
                onChange={e => set(key, e.target.value)}
                rows={4}
                className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                placeholder="100–200 words recommended..."
              />
              <div className="text-xs text-gray-400 text-right">{(form as any)[key].split(' ').filter(Boolean).length} words</div>
            </div>
          ))}
        </div>
      )}


      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={() => setStep(s => s - 1)}
          disabled={step === 0}
          className="px-6 py-2 border rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30"
        >
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep(s => s + 1)}
            disabled={step === 0 && !step1Valid}
            className="px-6 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        )}
      </div>
    </div>
  );
}
