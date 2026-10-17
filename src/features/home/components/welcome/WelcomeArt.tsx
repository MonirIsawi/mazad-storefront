import Image from 'next/image';
import { BrandMark } from '@shared/components/brand';
import { cn } from '@shared/lib';

/**
 * The welcome's picture: the photo of a real live auction when the API has one with a photo,
 * otherwise the brand mark in its gold glow. Never a stock photo. On phones it fills the top of
 * the screen and fades into the copy; from 960px it is the left (start) half.
 */
export function WelcomeArt({ photo, isLoading }: { photo: string | null; isLoading: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        'absolute inset-x-0 top-0 h-[72%] overflow-hidden',
        'lg:relative lg:h-auto lg:min-h-dvh',
      )}
    >
      {photo ? (
        <Image
          src={photo}
          alt=""
          fill
          priority
          sizes="(min-width: 960px) 55vw, 100vw"
          className="object-cover"
        />
      ) : isLoading ? null : (
        <div className="absolute inset-0 grid place-items-center pb-[18%] lg:pb-0">
          <span className="absolute size-[min(120vw,640px)] bg-glow" />
          <BrandMark
            size={148}
            className="relative drop-shadow-[0_24px_48px_rgb(0_0_0/55%)] lg:size-[220px]"
          />
        </div>
      )}
      {/* phones: into the copy below; desktop: into the copy beside it */}
      <span className="absolute inset-0 bg-[linear-gradient(180deg,rgb(8_7_6/45%)_0%,transparent_16%,transparent_38%,rgb(8_7_6/88%)_70%,var(--color-background)_86%)] lg:hidden" />
      <span className="absolute inset-0 hidden bg-[linear-gradient(to_right,transparent_60%,var(--color-background))] lg:block rtl:bg-[linear-gradient(to_left,transparent_60%,var(--color-background))]" />
    </div>
  );
}
