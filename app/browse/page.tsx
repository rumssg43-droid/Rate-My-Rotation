import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase';
import { DEANERIES, TRAINING_LEVELS } from '@/lib/constants';

export const revalidate = 60;

async function getReviewCounts() {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('reviews')
      .select('rotation_id, rotations(deanery, training_level)')
      .eq('is_approved', true);

    const counts: Record<string, number> = {};
    if (data) {
      for (const row of data as any[]) {
        if (row.rotations) {
          const key = `${row.rotations.deanery}__${row.rotations.training_level}`;
          counts[key] = (counts[key] || 0) + 1;
        }
      }
    }
    return counts;
  } catch {
    return {};
  }
}

export default async function BrowsePage() {
  const counts = await getReviewCounts();

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Rotations</h1>
      <p className="text-gray-500 mb-8">
        Pay <strong>£20</strong> for a single training pathway, or <strong>£40</strong> to unlock all pathways in a deanery.
      </p>

      <div className="grid gap-6">
        {DEANERIES.map(deanery => {
          const pathways = TRAINING_LEVELS.map(level => ({
            level,
            count: counts[`${deanery}__${level}`] || 0,
          })).filter(p => p.count > 0);

          if (pathways.length === 0) return null;

          const totalReviews = pathways.reduce((sum, p) => sum + p.count, 0);

          return (
            <div key={deanery} className="border rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{deanery}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{totalReviews} total review{totalReviews !== 1 ? 's' : ''} across {pathways.length} pathway{pathways.length !== 1 ? 's' : ''}</p>
                </div>
                <Link
                  href={`/checkout?deanery=${encodeURIComponent(deanery)}&bundle=true`}
                  className="flex-shrink-0 ml-4 border-2 border-blue-600 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  All pathways — £40
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {pathways.map(({ level, count }) => (
                  <Link
                    key={level}
                    href={`/checkout?deanery=${encodeURIComponent(deanery)}&training_level=${encodeURIComponent(level)}`}
                    className="block border rounded-lg p-3 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <div className="font-semibold text-sm text-gray-800">{level}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{count} review{count !== 1 ? 's' : ''}</div>
                    <div className="text-xs text-blue-600 font-medium mt-1">£20</div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}

        {Object.keys(counts).length === 0 && (
          <div className="text-center py-20 max-w-md mx-auto">
            <div className="text-5xl mb-4">📋</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">No reviews yet</h2>
            <p className="text-gray-500 text-sm mb-6">
              Be the first to submit a review. It only takes a few minutes and helps hundreds of doctors make better career decisions.
            </p>
            <Link href="/submit" className="inline-block bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800">
              Submit the first review
            </Link>
            <p className="text-xs text-gray-400 mt-4">Completely anonymous · No login required</p>
          </div>
        )}
      </div>
    </div>
  );
}
