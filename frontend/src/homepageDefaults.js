const homepageDefaults = {
  hero: {
    visible: true,
    eyebrow: "CREATIVE THINKING. DIGITAL RESULTS.",
    heading: "We turn your ideas into something unforgettable.",
    description:
      "Your ideas deserve more than ordinary. We help brands create, build, and grow with digital experiences that make an impact.",
    primaryButton: "Let's work together",
    secondaryButton: "Explore our work",
  },

  portfolio: {
    visible: true,
    kicker: "THE WORK SPEAKS",
    heading: "Made with purpose. Built to stand out.",
    description:
      "Every brand has a story. This is where we'll showcase the identities, websites, campaigns, videos, and digital solutions we create.",
    note:
      "Explore our creative direction, digital experiences, and content work. Get in touch to discuss a project for your business.",
  },

  services: {
    visible: true,
    items: [
      {
        number: "01",
        title: "Retail Management Solutions",
        description:
          "Manage sales, inventory, products, and daily operations with practical retail management tools built for small businesses.",
        tags: ["Point of sale", "Inventory", "Business operations"],
        href: "/retail-management",
      },
      {
        number: "02",
        title: "Video Production & Content Creation",
        description:
          "Create promotional videos, business adverts, and social media content that help your brand communicate and attract customers.",
        tags: ["Business videos", "Social content", "Video editing"],
        href: "/video-production",
      },
      {
        number: "03",
        title: "Digital & Creative Training",
        description:
          "Build practical skills in video editing, content creation, and digital tools through hands-on training for individuals and businesses.",
        tags: ["Video editing", "Content creation", "Digital skills"],
        href: "/training",
      },
    ],
  },

  trainingCta: {
    visible: true,
    kicker: "LEARN BY DOING",
    heading: "Ready to build the skill yourself?",
    description:
      "Get practical training in video production, editing, and retail software setup through hands-on learning.",
    buttonLabel: "Explore practical training",
    buttonHref: "/training",
  },
};

export default homepageDefaults;
