import SubmitForm from './SubmitForm';

export default function SubmitPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit a Review</h1>
      <p className="text-gray-500 mb-8">Completely anonymous. Your review helps other doctors make informed decisions.</p>
      <SubmitForm />
    </div>
  );
}
