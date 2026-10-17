import Link from 'next/link';

/** "New to Bidoom? Create an account" under the form. */
export function AuthSwitchLine({
  question,
  linkLabel,
  href,
}: {
  question: string;
  linkLabel: string;
  href: string;
}) {
  return (
    <p className="text-center text-sm text-foreground-soft">
      {question}{' '}
      <Link
        href={href}
        className="font-semibold text-gold underline-offset-4 hover:underline light:text-gold-lo"
      >
        {linkLabel}
      </Link>
    </p>
  );
}
