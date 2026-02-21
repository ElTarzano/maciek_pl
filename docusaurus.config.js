// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Maciek Orłowski',
  tagline: 'Kompleksowy trening wspinaczkowy dla wszystkich, którzy kochają wspinanie.',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://ElTarzano.github.io',
  baseUrl: '/maciek_pl/',
  organizationName: 'ElTarzano',
  projectName: 'maciek_pl',
  deploymentBranch: "gh-pages",
  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'pl',
    locales: ['pl'],
    localeConfigs: {
      pl: {
        label: 'Polski',
      },
    },
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          editUrl:
              'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          editUrl:
              'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  // ✨ Dodaj sekcję plugins
  plugins: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      /** @type {import('@easyops-cn/docusaurus-search-local').PluginOptions} */
      ({
        hashed: true,
        language: ['en'],
        indexBlog: true,
        indexDocs: true,
        indexPages: true,
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
      }),
    ],
  ],

  themeConfig:
  /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
      ({
        image: 'img/maciek-social-card.jpg',
        colorMode: {
          respectPrefersColorScheme: false,
        },
        navbar: {
          title: 'Maciek Orłowski',
          logo: {
            alt: 'Maciek Orłowski Logo',
            src: 'img/logo.svg',
          },
          hideOnScroll: true, // ✅ WŁĄCZONE chowanie paska nawigacji podczas scrollu
          items: [
            {
              type: 'dropdown',
              label: 'Trening',
              position: 'left',
              items: [
                {
                  label: 'Indywidualny',
                  to: '/trening/indywidualny',
                },
                {
                  label: 'Kalkulator 1rm',
                  to: '/trening/kalkulator',
                },
                {
                  label: 'timer',
                  to: '/trening/timer',
                },
                {
                  label: 'grafik',
                  to: '/trening/grafik',
                },
              ],
            },
            {
              type: 'docSidebar',
              sidebarId: 'tutorialSidebar',
              position: 'left',
              label: 'Dokumentacja',
            },
            { to: '/blog', label: 'Blog', position: 'left' },
          ],
        },
        footer: {
          style: 'dark',
          links: [
            {
              title: 'Docs',
              items: [
                {
                  label: 'Tutorial',
                  to: '/docs/intro',
                },
              ],
            },
            {
              title: 'Community',
              items: [
                {
                  label: 'Stack Overflow',
                  href: 'https://stackoverflow.com/',
                },
                {
                  label: 'Discord',
                  href: 'https://discordapp.com/',
                },
                {
                  label: 'X',
                  href: 'https://x.com/',
                },
              ],
            },
            {
              title: 'More',
              items: [
                {
                  label: 'Blog',
                  to: '/blog',
                },
                {
                  label: 'GitHub',
                  href: 'https://github.com/',
                },
              ],
            },
          ],
          copyright: `Copyright © ${new Date().getFullYear()} Maciek Orłowski`,
        },
        prism: {
          theme: prismThemes.github,
          darkTheme: prismThemes.dracula,
        },
      }),
};

export default config;
``