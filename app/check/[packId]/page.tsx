import { notFound } from 'next/navigation';
import { PACK_REGISTRY, getPackById } from '../../../lib/packs/registry';
import CheckPackClient from './CheckPackClient';

interface CheckPackPageProps {
  // Next.js 15+ passes route params as a Promise.
  params: Promise<{ packId: string }>;
}

// Only the packs in the registry exist; any other /check/<id> is a real HTTP 404
// (rendered by app/not-found.tsx) instead of a 200 page that says "not found".
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.entries(PACK_REGISTRY)
    .filter(([, item]) => item.isAvailable)
    .map(([packId]) => ({ packId }));
}

export default async function CheckPackPage({ params }: CheckPackPageProps) {
  const { packId } = await params;
  const packItem = getPackById(packId);

  if (!packItem || !packItem.isAvailable) {
    notFound();
  }

  return (
    <div className="min-h-full">
      <CheckPackClient packId={packId} />
    </div>
  );
}
