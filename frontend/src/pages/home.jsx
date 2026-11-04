import { useEffect, useRef, useState } from "react";
import {
  getProfile,
  getPublishedClientBrands,
  getUploadUrl,
  getPublishedHomepageContent,
  getPublishedVideos,
} from "../api/api";
import homepageDefaults from "../homepageDefaults.js";
import Header from "../components/Header";
import Footer from "../components/footer";
import "./home.css";

const services = [
  {
    number: "01",
    title: "Retail Management Solutions",
    href: "/retail-management",
    description:
      "Manage sales, inventory, products, and daily operations with practical retail management tools built for small businesses.",
    tags: ["Point of sale", "Inventory", "Business operations"],
  },
  {
    number: "02",
    title: "Video Production & Content Creation",
    href: "/video-production",
    description:
      "Create promotional videos, business adverts, and social media content that help your brand communicate and attract customers.",
    tags: ["Business videos", "Social content", "Video editing"],
  },
  {
    number: "03",
    title: "Digital & Creative Training",
    href: "/training",
    description:
      "Build practical skills in video editing, content creation, and digital tools through hands-on training for individuals and businesses.",
    tags: ["Video editing", "Content creation", "Digital skills"],
  },
];

function normalizeUrl(value) {
  const trimmed = (value || "").trim();
  if (!trimmed) return "";
  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function Home() {

  const [homepageContent, setHomepageContent] = useState(homepageDefaults);
  const [profile, setProfile] = useState({});
  const [brands, setBrands] = useState([]);
  const [portfolioVideos, setPortfolioVideos] = useState([]);
  const portfolioTrackRef = useRef(null);

  const scrollPortfolio = (direction) => {
    const track = portfolioTrackRef.current;
    const firstCard = track?.querySelector(".cy-portfolio-card");

    if (!track || !firstCard) return;

    const styles = window.getComputedStyle(track);
    const gap = parseFloat(styles.columnGap || styles.gap) || 0;

    track.scrollBy({
      left: direction * (firstCard.getBoundingClientRect().width + gap),
      behavior: "smooth",
    });
  };



  useEffect(() => {
    let active = true;

    getPublishedHomepageContent()
      .then((data) => {
        if (!active || !data?.content) return;
        const saved = data.content;
        setHomepageContent({
          ...homepageDefaults,
          ...saved,
          hero: { ...homepageDefaults.hero, ...(saved.hero || {}) },
          portfolio: {
            ...homepageDefaults.portfolio,
            ...(saved.portfolio || {}),
          },
          services: {
            ...homepageDefaults.services,
            ...(saved.services || {}),
            items: Array.isArray(saved.services?.items)
              ? saved.services.items
              : homepageDefaults.services.items,
          },
          trainingCta: {
            ...homepageDefaults.trainingCta,
            ...(saved.trainingCta || {}),
          },
        });
      })
      .catch(() => {
        // Keep the local defaults when no published homepage is available.
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    getPublishedVideos()
      .then((data) => {
        if (active) {
          setPortfolioVideos(Array.isArray(data) ? data : []);
        }
      })
      .catch((error) => {
        console.error("Could not load homepage portfolio videos:", error);
        if (active) setPortfolioVideos([]);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    async function loadHomepage() {
      try {
        const data = await getProfile();
        setProfile(data || {});
      } catch (error) {
        console.error("Could not load Creator-Yard profile:", error);
      }

      try {
        const data = await getPublishedClientBrands();
        setBrands(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Could not load client brands:", error);
      }
    }

    loadHomepage();
  }, []);

  const whatsappValue = (profile.whatsapp || "").trim();
  const whatsappNumber = whatsappValue.replace(/\D/g, "");

  const whatsappLink = whatsappValue
    ? /^https?:\/\//i.test(whatsappValue)
      ? whatsappValue
      : `https://wa.me/${whatsappNumber.replace(/^0/, "234")}?text=${encodeURIComponent(
          "Hello Creator-Yard! I would like to discuss your services."
        )}`
    : profile.phone
      ? `https://wa.me/${profile.phone.replace(/\D/g, "").replace(/^0/, "234")}?text=${encodeURIComponent(
          "Hello Creator-Yard! I would like to discuss your services."
        )}`
      : "";

  const brandName = profile.store_name || "Creator-Yard";

  return (
    <>
      <Header />

      <main className="cy-home" id="home">
        <section className="cy-hero">
          <div className="cy-hero-glow" />

          <div className="cy-hero-inner">
            <div className="cy-hero-copy">
              <span className="cy-eyebrow">
                <span className="cy-status-dot" />
                CREATIVE THINKING. DIGITAL RESULTS.
              </span>

              <h1>
                We turn your
                <br />
                ideas into
                <br />
                <span>something</span>
                <br />
                unforgettable.
              </h1>

              <p className="cy-hero-description">
                Your ideas deserve more than ordinary. We help brands create,
                build, and grow with digital experiences that make an impact.
              </p>

              <div className="cy-hero-actions">
                {whatsappLink ? (
                  <a
                    className="cy-button cy-button-primary"
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Let's work together <span>↗</span>
                  </a>
                ) : (
                  <a
                    className="cy-button cy-button-primary"
                    href="#contact"
                  >
                    Let's work together <span>↗</span>
                  </a>
                )}

                <a className="cy-button cy-button-outline" href="#work">
                  Explore our work <span>↓</span>
                </a>
              </div>

              <div className="cy-hero-note">
                <span className="cy-note-line" />
                <span>Content · Websites · Systems · Creative skills</span>
              </div>
            </div>

            <div
              className="cy-hero-art"
              aria-label="Creator-Yard creative studio"
            >
              <div className="cy-art-orbit cy-art-orbit-one" />
              <div className="cy-art-orbit cy-art-orbit-two" />

              <div className="cy-art-panel cy-art-panel-back">
                <span className="cy-art-label">YOUR NEXT BIG IDEA</span>
                <div className="cy-art-bars">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <span className="cy-art-caption">MAKE IT MATTER.</span>
              </div>

              <div className="cy-art-panel cy-art-panel-front">
                <div className="cy-art-topline">
                  <span>CY®</span>
                  <span>CREATIVE STUDIO</span>
                </div>

                <div className="cy-art-symbol">✳</div>

                <p>
                  THINK
                  <br />
                  <span>BEYOND.</span>
                </p>

                <div className="cy-art-bottomline">
                  <span>IDEA → DESIGN → IMPACT</span>
                  <span>2026</span>
                </div>
              </div>

              <div className="cy-floating-tag cy-floating-tag-top">
                <span>✳</span> Think creatively
              </div>

              <div className="cy-floating-tag cy-floating-tag-bottom">
                <span>↗</span> Build boldly
              </div>

              <div className="cy-art-star">✳</div>
            </div>
          </div>

          <div className="cy-hero-index">
            <span>INDEPENDENT CREATIVE STUDIO</span>
            <span>01 — 04</span>
          </div>
        </section>

        <section className="cy-intro" id="about">
          <div className="cy-section-kicker">A LITTLE ABOUT US</div>

          <div className="cy-intro-content">
            <h2>
              Good ideas are everywhere.
              <br />
              <span>We help yours stand out.</span>
            </h2>

            <div className="cy-intro-copy">
              <p>
                Creator-Yard brings creative thinking and practical technology
                together to help businesses show up better, work smarter, and
                grow with confidence.
              </p>

              <a className="cy-text-link" href="#services">
                Discover what we do <span>↗</span>
              </a>
            </div>
          </div>
        </section>

        <section className="cy-services" id="services">
          <div className="cy-section-heading">
            <div>
              <div className="cy-section-kicker">
                WHAT WE BRING TO THE TABLE
              </div>
              <h2>
                Creative ideas.
                <br />
                <span>Real solutions.</span>
              </h2>
            </div>

            <p>
              From your first idea to your next big move, we help turn plans
              into work you can see, use, and grow with.
            </p>
          </div>

          <div className="cy-service-grid">
            {services.map((service) => (
              <article className="cy-service-card" key={service.number}>
                <div className="cy-service-card-top">
                  <span>{service.number}</span>
                  <span className="cy-service-arrow">↗</span>
                </div>

                <h3>{service.title}</h3>
                <p>{service.description}</p>

                <div className="cy-service-tags">
                  {service.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>

                <a
                  className="cy-service-link"
                  href={
                    service.href ||
                    whatsappLink ||
                    (profile.email
                      ? `mailto:${profile.email}?subject=${encodeURIComponent(
                          `Creator-Yard — ${service.title}`
                        )}`
                      : "#contact")
                  }
                  target={!service.href && whatsappLink ? "_blank" : undefined}
                  rel={!service.href && whatsappLink ? "noopener noreferrer" : undefined}
                >
                  Discuss this service <span>↗</span>
                </a>
              </article>
            ))}
          </div>
        <div className="cy-training-cta">
            <div>
              <span className="cy-training-cta-kicker">LEARN BY DOING</span>
              <h3>Ready to build the skill yourself?</h3>
              <p>
                Join practical training in video production, editing, and retail
                software setup — or combine both programmes.
              </p>
            </div>
            <a className="cy-button cy-button-primary" href="/training">
              Explore practical training <span>↗</span>
            </a>
          </div>
        </section>

          {homepageContent.portfolio?.visible !== false && (
          <section className="cy-work" id="work">
            <div className="cy-section-heading">
              <div>
                <div className="cy-section-kicker">
                  {homepageContent.portfolio?.kicker}
                </div>
                <h2>{homepageContent.portfolio?.heading}</h2>
              </div>
              <p>{homepageContent.portfolio?.description}</p>
            </div>

          <div className="cy-home-video-carousel">
            <div className="cy-home-video-controls" aria-label="Video navigation">
              <button
                type="button"
                onClick={() => scrollPortfolio(-1)}
                aria-label="Previous video"
              >
                &#8592;
              </button>
              <button
                type="button"
                onClick={() => scrollPortfolio(1)}
                aria-label="Next video"
              >
                &#8594;
              </button>
            </div>

            <div
              className="cy-portfolio-grid cy-home-video-grid"
              ref={portfolioTrackRef}
            >
            {portfolioVideos.length > 0 ? (
              portfolioVideos.map((video) => (
                <article className="cy-portfolio-card" key={video.id}>
                  <div className="cy-home-video-media">
                    {video.video_url ? (
                      <video
                        controls
                        playsInline
                        preload="metadata"
                        poster={video.thumbnail_url || undefined}
                        aria-label={video.title || "Creator-Yard portfolio video"}
                      >
                        <source src={video.video_url} />
                        Your browser does not support HTML video.
                      </video>
                    ) : video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title || "Creator-Yard portfolio preview"}
                        loading="lazy"
                      />
                    ) : (
                      <div className="cy-home-video-empty">
                        Video preview unavailable
                      </div>
                    )}
                  </div>
                  <div className="cy-portfolio-meta">
                    <div>
                      <p className="cy-home-video-category">
                        {video.category || "Featured work"}
                      </p>
                      <h3>{video.title || "Creator-Yard project"}</h3>
                      {video.description && <p>{video.description}</p>}
                    </div>
                    <a
                      href="/video-production"
                      aria-label={`View video production services for ${video.title || "this project"}`}
                    >
                      ↗
                    </a>
                  </div>
                </article>
              ))
            ) : (
              <div className="cy-home-video-empty-state">
                <span className="cy-note-star">✳</span>
                <h3>Our next feature could be your project.</h3>
                <p>
                  Our video portfolio is being updated. Visit our video
                  production page to explore the service or discuss a project.
                </p>
                <a className="cy-button cy-button-primary" href="/video-production">
                  Explore video production <span>↗</span>
                </a>
              </div>
            )}
          </div>
          </div>
          <div className="cy-portfolio-note">
            <span className="cy-note-star">✳</span>
            <p>{homepageContent.portfolio?.note}</p>
          </div>
          </section>
          )}

        <section className="cy-approach">
          <div className="cy-approach-left">
            <div className="cy-section-kicker">SMALL STUDIO. BIG ENERGY.</div>
            <h2>
              Let's make
              <br />
              <span>something</span>
              <br />
              meaningful.
            </h2>
          </div>

          <div className="cy-approach-right">
            <p>
              Whether you're starting a business, refreshing your brand,
              building a website, organising your stock, or learning to create
              better content, let's build something that works for you.
            </p>

            <a className="cy-button cy-button-light" href="#contact">
              Start a conversation <span>↗</span>
            </a>

            <div className="cy-approach-decoration">CY®</div>
          </div>
        </section>

        <section className="cy-clients" id="clients">
          <div className="cy-section-kicker">GOOD WORK IS A TEAM SPORT</div>

          <h2>
            Brands we&apos;ve worked <span>with.</span>
          </h2>

          <p>
            A selection of the clients and partner brands that are part of our
            creative journey.
          </p>

          {brands.length > 0 ? (
            <div className="cy-client-grid">
              {brands.map((brand) => {
                const logo = brand.logo ? getUploadUrl(brand.logo) : "";

                const logoContent = (
                  <>
                    {logo ? (
                      <img
                        src={logo}
                        alt={`${brand.name} logo`}
                        loading="lazy"
                      />
                    ) : (
                      <span className="cy-client-name">{brand.name}</span>
                    )}
                    {logo && (
                      <span className="cy-client-label">{brand.name}</span>
                    )}
                  </>
                );

                return (
                  <div className="cy-client-item" key={brand.id}>
                    <div className="cy-client-brand-identity">
                      {logoContent}
                    </div>

                    <div className="cy-client-actions">
                      {brand.website && (
                        <a
                          className="cy-client-action cy-client-action-visit"
                          href={normalizeUrl(brand.website)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Visit Brand <span>↗</span>
                        </a>
                      )}

                      {brand.contact_url && (
                        <a
                          className="cy-client-action cy-client-action-contact"
                          href={normalizeUrl(brand.contact_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Contact Brand <span>↗</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="cy-client-empty">
              <span className="cy-client-empty-mark">✳</span>
              <p>
                Our client brands will appear here as we add them to the
                Creator-Yard dashboard.
              </p>
            </div>
          )}
        </section>

        <section className="cy-contact" id="contact">
          <div className="cy-contact-orb">✳</div>

          <div className="cy-section-kicker">HAVE SOMETHING IN MIND?</div>
          <h2>
            Let&apos;s make it
            <br />
            <span>happen.</span>
          </h2>

          <p>
            Tell us what you&apos;re working on. Let&apos;s talk about how
            Creator-Yard can help bring it to life.
          </p>

          <div className="cy-contact-actions">
            {whatsappLink && (
              <a
                className="cy-button cy-button-primary"
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                Chat with us on WhatsApp <span>↗</span>
              </a>
            )}

            {profile.email && (
              <a
                className="cy-button cy-button-outline"
                href={`mailto:${profile.email}`}
              >
                Send us an email <span>↗</span>
              </a>
            )}
          </div>
        </section>
      </main>

      <Footer profile={profile} />
    </>
  );
}

export default Home;