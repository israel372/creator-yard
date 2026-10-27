const videoProductionDefaults = {
  hero: {
    visible: true,
    eyebrow: "CREATOR-YARD FILMS & CONTENT",
    headingLine1: "Make your",
    headingEmphasis: "impossible",
    headingLine2: "business",
    headingLine3: "to ignore.",
    description:
      "Professional video production and editing for businesses ready to show up, tell their story, and make a stronger impression.",
    primaryButton: "Let's plan your video",
    secondaryButton: "Explore services",
    processLabel: "IDEA → PRODUCTION → EDIT → DELIVERY",
    brandLabel: "MADE FOR YOUR BRAND.",
    frameLabel: "YOUR STORY, IN MOTION."
  },
  intro: {
    visible: true,
    kicker: "MORE THAN JUST A VIDEO",
    headingLine1: "Your business has a story.",
    headingLine2: "Let's make people feel it.",
    description:
      "People see your business before they experience it. We help you make that first impression count with thoughtful visuals, purposeful storytelling, and professional editing.",
    linkLabel: "Tell us what you have in mind"
  },
  showcase: {
    visible: true,
    kicker: "SELECTED WORK",
    headingLine1: "See the story.",
    headingLine2: "Feel the difference.",
    description:
      "A look at our video work. Every frame is an opportunity to communicate your brand, capture attention, and make an impression.",
    sampleCategory: "VIDEO SAMPLE 01",
    sampleTitle: "Stories made to move people.",
    sampleDescription: "Video production · Editing · Visual storytelling",
    sampleVideoUrl: "/videos/creator-yard-sample-01.mp4",
    sampleThumbnailUrl: "/videos/creator-yard-sample-01.jpg"
  },
  servicesSection: {
    visible: true,
    kicker: "WHAT WE CREATE",
    headingLine1: "Content with",
    headingLine2: "a job to do.",
    description:
      "From the first concept to the final export, we help you create content that fits your business and where your customers find you.",
    buttonLabel: "Discuss this service",
    services: [
      {
        number: "01",
        title: "Business promotional videos",
        description:
          "Present your business, explain what makes it different, and give potential customers a reason to choose you.",
        image:
          "https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=900&q=85",
        tags: ["Brand adverts", "Business profiles"]
      },
      {
        number: "02",
        title: "Product & commercial videos",
        description:
          "Give your products the attention they deserve with considered visuals, lighting, editing, and storytelling.",
        image:
          "https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&w=900&q=85",
        tags: ["Product showcases", "Promotional campaigns"]
      },
      {
        number: "03",
        title: "Social media reels",
        description:
          "Short-form videos designed to communicate quickly, hold attention, and give your business more content to share.",
        image:
          "https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=900&q=85",
        tags: ["Instagram", "TikTok", "YouTube Shorts"]
      },
      {
        number: "04",
        title: "Professional video editing",
        description:
          "Turn your existing footage into polished content with tighter cuts, sound, colour, captions, and a clear story.",
        image:
          "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=900&q=85",
        tags: ["Editing", "Captions", "Colour & sound"]
      }
    ]
  },
  process: {
    visible: true,
    kicker: "A CLEAR, SIMPLE PROCESS",
    headingLine1: "From your idea",
    headingLine2: "to the final cut.",
    steps: [
      {
        number: "01",
        title: "We plan",
        description:
          "We learn about your business, audience, goals, and video idea."
      },
      {
        number: "02",
        title: "We produce",
        description:
          "We agree on the shoot or footage requirements and production plan."
      },
      {
        number: "03",
        title: "We refine",
        description:
          "We edit your footage into a polished video suited to your needs."
      },
      {
        number: "04",
        title: "You share",
        description:
          "You receive the agreed deliverables, ready for your chosen platforms."
      }
    ]
  },
  packages: {
    visible: true,
    kicker: "BUILT AROUND YOUR BUSINESS",
    headingLine1: "One great video.",
    headingLine2: "Or content all month.",
    description:
      "Every project is different. Tell us what you want to achieve and we'll recommend a suitable scope, deliverables, timeline, and quote.",
    footnote:
      "Pricing is confirmed after we agree on the scope and deliverables.",
    items: [
      {
        number: "01",
        tier: "STARTER",
        title: "One-off video",
        description:
          "A focused video for a product, service, promotion, or business introduction.",
        buttonLabel: "Request a quote",
        featured: false
      },
      {
        number: "02",
        tier: "GROWTH",
        title: "Social content bundle",
        description:
          "A planned set of short-form videos to give your business more content to publish.",
        buttonLabel: "Request a quote",
        featured: true
      },
      {
        number: "03",
        tier: "ONGOING",
        title: "Monthly content",
        description:
          "Recurring video production and editing for businesses that need consistency.",
        buttonLabel: "Discuss a monthly plan",
        featured: false
      }
    ]
  },
  contact: {
    visible: true,
    kicker: "YOUR NEXT VIDEO STARTS HERE",
    headingLine1: "Let's put your",
    headingLine2: "business in motion.",
    description:
      "Tell us what your business does and what you want your next video to achieve. We'll take it from there.",
    whatsappButton: "Start on WhatsApp",
    emailButton: "Email us"
  }
};

export default videoProductionDefaults;
