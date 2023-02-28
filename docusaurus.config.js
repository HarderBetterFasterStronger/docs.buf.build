const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");
const path = require("path");
const gaTrackingID = process.env.GOOGLE_ANALYTICS_GTAG ?? "";

/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
    presets: [
        [
            "@docusaurus/preset-classic",
            {
                docs: {
                    path: "docs",
                    routeBasePath: "/",
                    sidebarPath: require.resolve("./sidebars.js"),
                    admonitions: {
                        icons: "none"
                    }
                },
                theme: {
                    customCss: require.resolve("./src/css/custom.css")
                },
                sitemap: {
                    changefreq: "daily",
                    priority: 0.7
                },
            },
        ]
    ],
    plugins: [
        path.resolve("src/plugins/fathom"),
        path.resolve("src/plugins/stars"),
        '@docusaurus/plugin-ideal-image',
        (gaTrackingID !== "") ?
            ["@docusaurus/plugin-google-gtag", {
                trackingID: gaTrackingID,
                anonymizeIP: true,
            }] : null
    ],
    title: "Buf®",
    tagline: "Building a better way to work with Protocol Buffers",
    url: "https://docs.buf.build",
    baseUrl: "/",
    favicon: "img/favicon.png",
    onBrokenLinks: "throw",
    onBrokenMarkdownLinks: "warn",
    organizationName: "bufbuild",
    projectName: "buf",
    // Ref: https://docusaurus.io/docs/2.0.0-beta.3/api/themes/configuration
    themeConfig: {
        algolia: {
            appId: process.env.ALGOLIA_APP_ID || "none",
            apiKey: process.env.ALGOLIA_API_KEY || "none",
            indexName: process.env.ALGOLIA_INDEX_NAME || "none"
        },
        fathomAnalytics: {
            siteId: process.env.FATHOM_ANALYTICS_SITE_ID || "none",
            customDomain: process.env.FATHOM_ANALYTICS_CUSTOM_DOMAIN || "none"
        },
        githubRepo: "bufbuild/buf",
        navbar: {
            // We override the theme's navbar and support the additional option "bufAppearance"
            // on links. It can have one of these values:
            //
            // - "button" - styles the link as a dark button
            // - "slack" - styles the link as a light button with a slack icon
            // - "github" - styles the link as a light button with a github icon
            //
            // For the "github" appearance, the stargazer count for the GitHub repository is
            // rendered as the link label (this requires a "href" to a GitHub repository).
            hideOnScroll: false,
            title: "",
            logo: {
                alt: "Buf Logo",
                src: "img/logo-docs.svg",
                href: "https://docs.buf.build",
                target: "_self"
            },
            items: [
                {
                    href: "/tutorials/getting-started-with-buf-cli",
                    label: "Guides",
                    position: "left"
                },
                {
                    href: "/manuals/cli/overview",
                    label: "Manuals",
                    position: "left"
                },
                {
                    href: "/reference/cli/buf",
                    label: "Reference",
                    position: "left"
                },
                {
                    // The search bar must be the first item on the left - otherwise, the layout of the
                    // overridden navbar will break.
                    type: "search",
                    position: "right"
                },
                {
                    href: "https://buf.build/blog",
                    label: "Blog",
                    position: "right"
                },
                {
                    href: "https://buf.build/careers",
                    label: "Careers",
                    position: "right"
                },
                {
                    href: "https://buf.build/login",
                    label: "Sign in",
                    position: "right",
                    bufAppearance: "button"
                },
                {
                    href: "https://buf.build/signup",
                    label: "Sign Up",
                    position: "right",
                    bufAppearance: "dark-button"
                },
                {
                    href: "https://buf.build/links/slack",
                    label: "Slack",
                    position: "right",
                    bufAppearance: "slack"
                },
                {
                    href: "https://github.com/bufbuild/buf",
                    label: "GitHub",
                    position: "right",
                    bufAppearance: "github"
                },
            ]
        },
        footer: {
            // We override the theme's footer and don't support all standard footer options here.
            // The "style" and "logo" properties will be ignored, and we only render links in the
            // categories "Social" and "Legal".
            links: [
                {
                    // Social links are rendered with an icon based on the URL.
                    // If we do not have an icon for the URL, the label is rendered instead.
                    title: "Social",
                    items: [
                        {
                            label: "Twitter",
                            href: "https://twitter.com/bufbuild"
                        },
                        {
                            label: "LinkedIn",
                            href: "https://www.linkedin.com/company/bufbuild"
                        },
                        {
                            label: "Mail",
                            href: "mailto:info@buf.build"
                        }
                    ]
                },
                {
                    // Legal links require a label.
                    // Note that space is constrained - adding more links will break the layout.
                    title: "Legal",
                    items: [
                        {
                            label: "Terms Of Use",
                            href: "https://buf.build/resources/terms"
                        },
                        {
                            label: "Privacy Policy",
                            href: "https://buf.build/resources/privacy"
                        },
                        {
                            label: "Cookie Policy",
                            href: "https://buf.build/resources/cookie-policy"
                        }
                    ]
                }
            ],
            copyright: `© ${new Date().getFullYear()} Buf Technologies, Inc.`
        },
        image: "img/logo.svg",
        colorMode: {
            defaultMode: "light",
            // Hides the switch in the navbar
            disableSwitch: true,
            // Should we use the prefers-color-scheme media-query,
            // using user system preferences, instead of the hardcoded defaultMode?
            respectPrefersColorScheme: false
        },
        prism: {
            theme: lightCodeTheme,
            darkTheme: darkCodeTheme,
            additionalLanguages: ["editorconfig", "protobuf"]
        }
    },
    customFields: {
        // Used to configure the release version downloaded from the installation.mdx buttons
        downloadRelease: "1.15.0"
    }
};
