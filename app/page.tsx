import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <h1 className="text-5xl font-bold text-gray-900 mb-6">
        Find your next rotation.<br />
        <span className="text-blue-700">Honestly.</span>
      </h1>
      <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
        Anonymous reviews from UK doctors about their training rotations.
        No NHS email, no GMC number required.
      </p>
      <div className="flex gap-4 justify-center flex-wrap">
        <Link href="/submit" className="bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-800">
          Submit a Review
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-8 mt-20 text-left max-w-2xl mx-auto">
        <div className="p-6 bg-gray-50 rounded-xl">
          <div className="text-3xl mb-3">🔒</div>
          <h3 className="font-bold text-gray-900 mb-2">Fully Anonymous</h3>
          <p className="text-gray-500 text-sm">No NHS email, no GMC number. Submit with complete anonymity.</p>
        </div>
        <div className="p-6 bg-gray-50 rounded-xl">
          <div className="text-3xl mb-3">⭐</div>
          <h3 className="font-bold text-gray-900 mb-2">Structured Reviews</h3>
          <p className="text-gray-500 text-sm">8 rated dimensions plus detailed free-text insights from fellow doctors.</p>
        </div>
      </div>
    </div>
  );
}
