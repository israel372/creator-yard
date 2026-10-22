import { useEffect, useState } from "react";
import { getProfile, getProducts, getUploadUrl } from "../api/api";
import Header from "../components/Header";
import Footer from "../components/footer";
import "./home.css";

const services = [
  {
    number: "01",
    title: "Content Creation",
    description:
      "Creative content that helps businesses attract attention, communicate their value, and connect with the right audience.",
    tags: ["Social media", "Brand content", "Campaigns"],
  },
  {
    number: "02",
    title: "Website Development",
    description:
      "Modern, responsive websites designed to present your brand professionally and help your business grow online.",
    tags: ["Business websites", "Landing pages", "Web applications"],
  },
  {
    number: "03",
    title: "POS & Inventory Systems",
    description:
      "Practical business systems to help you manage sales, inventory, products, and everyday business operations.",
    tags: ["POS systems", "Stock management", "Business tools"],
  },
  {
    number: "04",
    title: "Video Editing & Training",
    description:
      "Engaging video edits and practical content creation training to help individuals and businesses improve their skills.",
    tags: ["Video editing", "Reels & shorts", "Creative training"],
  },
];

function normalizeUrl(value) {
  const trimmed = (value || "").trim();
  if (!trimmed) return "";
  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function Home() {
  const [profile, setProfile] = useState({});
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    async function loadHomepage() {
      try {
        const data = await getProfile();
        setProfile(data || {});
      } catch (error) {
        console.error("Could not load Creator-Yard profile:", error);
      }

      try {
        const data = await getProducts();
        const portfolioBrands = Array.isArray(data)
          ? data.filter((item) => item.is_portfolio === true)
          : [];

        setBrands(portfolioBrands);
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
                    whatsappLink ||
                    (profile.email
                      ? `mailto:${profile.email}?subject=${encodeURIComponent(
                          `Creator-Yard — ${service.title}`
                        )}`
                      : "#contact")
                  }
                  target={whatsappLink ? "_blank" : undefined}
                  rel={whatsappLink ? "noopener noreferrer" : undefined}
                >
                  Discuss this service <span>↗</span>
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="cy-work" id="work">
          <div className="cy-section-heading">
            <div>
              <div className="cy-section-kicker">THE WORK SPEAKS</div>
              <h2>
                Made with purpose.
                <br />
                <span>Built to stand out.</span>
              </h2>
            </div>

            <p>
              Every brand has a story. This is where we'll showcase the
              identities, websites, campaigns, videos, and digital solutions
              we create.
            </p>
          </div>

          <div className="cy-portfolio-grid">
            <article className="cy-portfolio-card cy-portfolio-feature">
              <div className="cy-portfolio-art cy-portfolio-purple">
                <span className="cy-portfolio-small">01 / BRAND IDENTITY</span>
                <span className="cy-portfolio-big">
                  MAKE
                  <br />
                  YOUR
                  <br />
                  MARK<span>.</span>
                </span>
                <span className="cy-portfolio-stamp">CY ✳</span>
              </div>
              <div className="cy-portfolio-meta">
                <div>
                  <h3>Branding & Creative Direction</h3>
                  <p>Identity · Visual storytelling</p>
                </div>
                <span>↗</span>
              </div>
            </article>

            <article className="cy-portfolio-card">
              <div className="cy-portfolio-art cy-portfolio-lime">
                <span className="cy-portfolio-small">
                  02 / DIGITAL EXPERIENCE
                </span>
                <div className="cy-browser-art">
                  <div className="cy-browser-bar">
                    <i />
                    <i />
                    <i />
                  </div>
                  <div className="cy-browser-content">
                    <span>YOUR BUSINESS.</span>
                    <strong>ONLINE.</strong>
                    <div />
                    <div />
                  </div>
                </div>
              </div>
              <div className="cy-portfolio-meta">
                <div>
                  <h3>Websites & Digital Products</h3>
                  <p>Web design · Development</p>
                </div>
                <span>↗</span>
              </div>
            </article>

            <article className="cy-portfolio-card">
              <div className="cy-portfolio-art cy-portfolio-orange">
                <span className="cy-portfolio-small">03 / CONTENT STUDIO</span>
                <div className="cy-content-symbol">
                  <span>▶</span>
                </div>
                <span className="cy-content-title">
                  STOP
                  <br />
                  THE SCROLL.
                </span>
              </div>
              <div className="cy-portfolio-meta">
                <div>
                  <h3>Content & Video Production</h3>
                  <p>Social content · Video editing</p>
                </div>
                <span>↗</span>
              </div>
            </article>
          </div>

          <div className="cy-portfolio-note">
            <span className="cy-note-star">✳</span>
            <p>
              Explore our creative direction, digital experiences, and content
              work. Get in touch to discuss a project for your business.
            </p>
          </div>
        </section>

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
                const logo = brand.image ? getUploadUrl(brand.image) : "";

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
                    {brand.link ? (
                      <a
                        href={normalizeUrl(brand.link)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Visit ${brand.name}`}
                      >
                        {logoContent}
                      </a>
                    ) : (
                      <div className="cy-client-static">{logoContent}</div>
                    )}
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