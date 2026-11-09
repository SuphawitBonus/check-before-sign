'use client';

import { getPackById } from '../../../lib/packs/registry';
import EngineContainer from '../../../components/engine/EngineContainer';

/**
 * Client boundary for the questionnaire. Rule evaluators are functions, which cannot
 * be passed from a Server Component as props, so the pack is looked up here by id.
 * All answers stay in the browser (docs/principles.md).
 */
export default function CheckPackClient({ packId }: { packId: string }) {
  const packItem = getPackById(packId);
  // The server page already returned 404 for unknown ids; this is only a guard.
  if (!packItem) return null;
  return <EngineContainer pack={packItem.pack} rules={packItem.rules} />;
}
