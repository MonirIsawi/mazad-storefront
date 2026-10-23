'use client';

import { HelpIndexPage, HelpTopicPage, type HelpTopic } from '@features/help';
import { SupportEntry, SupportInlineLink, useSupportContact } from '@features/support';

/*
 * Help composed with support (features never import each other): the help centre ends with the way
 * to reach us, and the help and policy pages swap their "to be announced" notes for it, only when
 * this deployment really has one (the support-reports API, or a configured chat channel).
 */

export function HelpIndexRoute() {
  return <HelpIndexPage contact={<SupportEntry />} />;
}

export function HelpTopicRoute({ topic }: { topic: HelpTopic }) {
  const { hasContact } = useSupportContact();
  return <HelpTopicPage topic={topic} contact={hasContact ? <SupportInlineLink /> : undefined} />;
}
