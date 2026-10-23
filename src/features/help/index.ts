// Public surface of the help feature (the help centre, help topics, and Terms and Privacy).
// No 'use client' here: the route's generateStaticParams reads HELP_TOPICS on the server; the
// pages carry their own directive.
export { HelpIndexPage } from './pages/HelpIndexPage';
export { HelpTopicPage, type HelpTopicPageProps } from './pages/HelpTopicPage';
export { HELP_TOPICS, type HelpTopic } from './content';
