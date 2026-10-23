import { notFound } from 'next/navigation';
import { HELP_TOPICS, type HelpTopic } from '@features/help';
import { HelpTopicRoute } from '../help-routes';

export function generateStaticParams() {
  return HELP_TOPICS.map((topic) => ({ topic }));
}

export default async function Page({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  if (!HELP_TOPICS.includes(topic as HelpTopic)) notFound();
  return <HelpTopicRoute topic={topic as HelpTopic} />;
}
