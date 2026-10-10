import { notFound } from 'next/navigation';
import { HELP_TOPICS, HelpTopicPage, type HelpTopic } from '@features/help';

export function generateStaticParams() {
  return HELP_TOPICS.map((topic) => ({ topic }));
}

export default async function Page({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  if (!HELP_TOPICS.includes(topic as HelpTopic)) notFound();
  return <HelpTopicPage topic={topic as HelpTopic} />;
}
