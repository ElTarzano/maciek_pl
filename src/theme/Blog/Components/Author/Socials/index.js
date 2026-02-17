import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Twitter from '@theme/Icon/Socials/Twitter';
import GitHub from '@theme/Icon/Socials/GitHub';
import X from '@theme/Icon/Socials/X';
import StackOverflow from '@theme/Icon/Socials/StackOverflow';
import LinkedIn from '@theme/Icon/Socials/LinkedIn';
import DefaultSocialIcon from '@theme/Icon/Socials/Default';
import Bluesky from '@theme/Icon/Socials/Bluesky';
import Instagram from '@theme/Icon/Socials/Instagram';
import Threads from '@theme/Icon/Socials/Threads';
import Youtube from '@theme/Icon/Socials/YouTube';
import Mastodon from '@theme/Icon/Socials/Mastodon';
import Twitch from '@theme/Icon/Socials/Twitch';
import Email from '@theme/Icon/Socials/Email';
import styles from './styles.module.css';

/** Prosta ikona Facebooka jako komponent React (SVG) */
function FacebookIcon(props) {
  return (
      <svg
          viewBox="0 0 24 24"
          width="1em"
          height="1em"
          aria-hidden="true"
          focusable="false"
          {...props}
      >
        {/* Używamy currentColor, aby ikona dziedziczyła kolor z motywu */}
        <path
            fill="currentColor"
            d="M22 12.07C22 6.48 17.52 2 11.93 2S1.86 6.48 1.86 12.07c0 5 3.66 9.15 8.44 9.93v-7.02H7.9v-2.91h2.4V9.41c0-2.37 1.41-3.68 3.57-3.68 1.03 0 2.1.18 2.1.18v2.32h-1.18c-1.16 0-1.52.72-1.52 1.46v1.76h2.59l-.41 2.91h-2.18V22c4.78-.78 8.44-4.93 8.44-9.93Z"
        />
      </svg>
  );
}

const SocialPlatformConfigs = {
  twitter: { Icon: Twitter, label: 'Twitter' },
  github: { Icon: GitHub, label: 'GitHub' },
  stackoverflow: { Icon: StackOverflow, label: 'Stack Overflow' },
  linkedin: { Icon: LinkedIn, label: 'LinkedIn' },
  x: { Icon: X, label: 'X' },
  bluesky: { Icon: Bluesky, label: 'Bluesky' },
  instagram: { Icon: Instagram, label: 'Instagram' },
  threads: { Icon: Threads, label: 'Threads' },
  mastodon: { Icon: Mastodon, label: 'Mastodon' },
  youtube: { Icon: Youtube, label: 'YouTube' },
  twitch: { Icon: Twitch, label: 'Twitch' },
  email: { Icon: Email, label: 'Email' },
  /** NOWOŚĆ: Facebook */
  facebook: { Icon: FacebookIcon, label: 'Facebook' },
};

function getSocialPlatformConfig(platformKey) {
  return (
      SocialPlatformConfigs[platformKey] ?? {
        Icon: DefaultSocialIcon,
        label: platformKey,
      }
  );
}

function SocialLink({ platform, link }) {
  const { Icon, label } = getSocialPlatformConfig(platform);
  return (
      <Link className={styles.authorSocialLink} href={link} title={label}>
        <Icon className={clsx(styles.authorSocialIcon)} />
      </Link>
  );
}

export default function BlogAuthorSocials({ author }) {
  const entries = Object.entries(author.socials ?? {});
  if (entries.length === 0) return null;
  return (
      <div className={styles.authorSocials}>
        {entries.map(([platform, linkUrl]) => (
            <SocialLink key={platform} platform={platform} link={linkUrl} />
        ))}
      </div>
  );
}