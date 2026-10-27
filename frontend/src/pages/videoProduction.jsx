import { useEffect, useState } from "react";
import {
  getProfile,
  getPublishedVideos,
  getPublishedVideoProductionContent,
} from "../api/api";
import videoProductionDefaults from "../videoProductionDefaults";
import Header from "../components/Header";
import Footer from "../components/footer";
import "./videoProduction.css";

const services = [
  {
    number: "01",
    title: "Business promotional videos",
    description:
      "Present your business, explain what makes it different, and give potential customers a reason to choose you.",
    image:
      "https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=900&q=85",
    tags: ["Brand adverts", "Business profiles"],
  },
  {
    number: "02",
    title: "Product & commercial videos",
    description:
      "Give your products the attention they deserve with considered visuals, lighting, editing, and storytelling.",
    image:
      "https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&w=900&q=85",
    tags: ["Product showcases", "Promotional campaigns"],
  },
  {
    number: "03",
    title: "Social media reels",
    description:
      "Short-form videos designed to communicate quickly, hold attention, and give your business more content to share.",
    image:
      "https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=900&q=85",
    tags: ["Instagram", "TikTok", "YouTube Shorts"],
  },
  {
    number: "04",
    title: "Professional video editing",
    description:
      "Turn your existing footage into polished content with tighter cuts, sound, colour, captions, and a clear story.",
    image:
      "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=900&q=85",
    tags: ["Editing", "Captions", "Colour & sound"],
  },
];

function VideoProduction() {
  const [profile, setProfile] = useState({});
  const [showSampleVideo, setShowSampleVideo] = useState(false);
  const [portfolioVideos, setPortfolioVideos] = useState([]);
  const [pageContent, setPageContent] = useState(videoProductionDefaults);

  useEffect(() => {
    let active = true;

    getPublishedVideoProductionContent()
      .then((data) => {
        if (active && data?.is_published && data?.content) {
          setPageContent({
            ...videoProductionDefaults,
            ...data.content,
          });
        }
      })
      .catch((error) => {
        // Keep the existing default content if nothing is published yet.
        console.info("Using default video production page content:", error.message);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    getProfile()
      .then((data) => setProfile(data || {}))
      .catch((error) =>
        console.error("Could not load Creator-Yard profile:", error)
      );
  }, []);

  useEffect(() => {
    getPublishedVideos()
      .then((data) => setPortfolioVideos(Array.isArray(data) ? data : []))
      .catch((error) => {
        console.error("Could not load published portfolio videos:", error);
        setPortfolioVideos([]);
      });
  }, []);

  const whatsappValue = (profile.whatsapp || "").trim();
  const phone = (whatsappValue || profile.phone || "").replace(/\D/g, "");

  const whatsappLink = /^https?:\/\//i.test(whatsappValue)
    ? whatsappValue
    : phone
      ? `https://wa.me/${phone.replace(/^0/, "234")}?text=${encodeURIComponent(
          "Hello Creator-Yard! I would like to discuss professional video production for my business."
        )}`
      : "#contact";

  const emailLink = profile.email
    ? `mailto:${profile.email}?subject=${encodeURIComponent(
        "Video production enquiry - Creator-Yard"
      )}`
    : "#contact";

  return (
    <>
      <Header />

      <main className="cy-video">
        {pageContent.hero.visible !== false && (
          <section className="cy-video-hero">
          <div className="cy-video-hero-image" aria-hidden="true" />
          <div className="cy-video-hero-overlay" />

          <div className="cy-video-hero-content">
            <div className="cy-video-eyebrow">
              <span />
              {pageContent.hero.eyebrow}
            </div>

            <h1>
              {pageContent.hero.headingLine1}
              <br />
              {pageContent.hero.headingLine2} <em>{pageContent.hero.headingEmphasis}</em>
              <br />
              {pageContent.hero.headingLine3}
            </h1>

            <p>
              {pageContent.hero.description}
            </p>

            <div className="cy-video-actions">
              <a className="cy-video-button cy-video-button-lime" href={whatsappLink}
                target={whatsappLink.startsWith("https://") ? "_blank" : undefined}
                rel="noopener noreferrer">
                {pageContent.hero.primaryButton} <span>↗</span>
              </a>
              <a className="cy-video-button cy-video-button-outline" href="#video-services">
                {pageContent.hero.secondaryButton} <span>↓</span>
              </a>
            </div>

            <div className="cy-video-hero-foot">
              <span>{pageContent.hero.processLabel}</span>
              <span>{pageContent.hero.brandLabel}</span>
            </div>
          </div>

          <div className="cy-video-frame-label">{pageContent.hero.frameLabel}</div>
        </section>
        )}

        {pageContent.intro.visible !== false && (
          <section className="cy-video-intro">
          <div className="cy-video-kicker">{pageContent.intro.kicker}</div>
          <div className="cy-video-intro-grid">
            <h2>
              {pageContent.intro.headingLine1}
              <br />
              <span>{pageContent.intro.headingLine2}</span>
            </h2>
            <div>
              <p>
                {pageContent.intro.description}
              </p>
              <a className="cy-video-text-link" href="#video-contact">
                {pageContent.intro.linkLabel} <span>↗</span>
              </a>
            </div>
          </div>
        </section>
        )}


        {pageContent.showcase.visible !== false && (
          <section className="cy-video-showcase" id="selected-work">
          <div className="cy-video-kicker">{pageContent.showcase.kicker}</div>

          <div className="cy-video-showcase-heading">
            <div>
              <h2>
                {pageContent.showcase.headingLine1}
                <br />
                <span>{pageContent.showcase.headingLine2}</span>
              </h2>
            </div>
            <p>
              {pageContent.showcase.description}
            </p>
          </div>

          {portfolioVideos.length > 0 ? (
            <div className="cy-video-portfolio-grid">
              {portfolioVideos.map((video) => (
                <article
                  className="cy-video-showcase-card"
                  key={video.id}
                >
                  <div className="cy-video-showcase-media">
                    <video
                      controls
                      playsInline
                      preload="metadata"
                      poster={video.thumbnail_url || undefined}
                      aria-label={video.title}
                    >
                      <source src={video.video_url} />
                      Your browser does not support HTML video.
                    </video>
                  </div>

                  <div className="cy-video-showcase-caption">
                    <div>
                      <span>{video.category}</span>
                      <h3>{video.title}</h3>
                    </div>
                    <p>{video.description}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <article className="cy-video-showcase-card">
              <div className="cy-video-showcase-media">
                {showSampleVideo ? (
                  <video
                    controls
                    autoPlay
                    playsInline
                    preload="metadata"
                    poster={pageContent.showcase.sampleThumbnailUrl || undefined}
                    aria-label="Creator-Yard video sample"
                  >
                    <source
                      src={pageContent.showcase.sampleVideoUrl}
                      type="video/mp4"
                    />
                    Your browser does not support HTML video.
                  </video>
                ) : (
                  <button
                    className="cy-video-showcase-play"
                    type="button"
                    onClick={() => setShowSampleVideo(true)}
                    aria-label="Play Creator-Yard video sample"
                  >
                    <img
                      src={pageContent.showcase.sampleThumbnailUrl || undefined}
                      alt="Preview frame from a Creator-Yard video sample"
                      loading="lazy"
                      decoding="async"
                    />
                    <span
                      className="cy-video-showcase-play-icon"
                      aria-hidden="true"
                    >
                      ▶
                    </span>
                    <span className="cy-video-showcase-play-label">
                      PLAY VIDEO
                    </span>
                  </button>
                )}
              </div>

              <div className="cy-video-showcase-caption">
                <div>
                  <span>{pageContent.showcase.sampleCategory}</span>
                  <h3>{pageContent.showcase.sampleTitle}</h3>
                </div>
                <p>{pageContent.showcase.sampleDescription}</p>
              </div>
            </article>
          )}
        </section>
        )}


        {pageContent.servicesSection.visible !== false && (
          <section className="cy-video-services" id="video-services">
          <div className="cy-video-section-heading">
            <div>
              <div className="cy-video-kicker">{pageContent.servicesSection.kicker}</div>
              <h2>
                {pageContent.servicesSection.headingLine1}
                <br />
                <span>{pageContent.servicesSection.headingLine2}</span>
              </h2>
            </div>
            <p>
              {pageContent.servicesSection.description}
            </p>
          </div>

          <div className="cy-video-service-grid">
            {(pageContent.servicesSection.services || videoProductionDefaults.servicesSection.services).map((service) => (
              <article className="cy-video-service-card" key={service.number}>
                <div className="cy-video-service-image">
                  <img src={service.image} alt={service.title} loading="lazy" />
                  <span className="cy-video-service-number">{service.number}</span>
                  <span className="cy-video-image-arrow">↗</span>
                </div>
                <div className="cy-video-service-copy">
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                  <div className="cy-video-tags">
                    {service.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                  <a
                    href={whatsappLink}
                    target={whatsappLink.startsWith("https://") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                  >
                    {pageContent.servicesSection.buttonLabel} <span>↗</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
        )}

        {pageContent.process.visible !== false && (
          <section className="cy-video-process">
          <div className="cy-video-kicker">{pageContent.process.kicker}</div>
          <h2>
            {pageContent.process.headingLine1}
            <br />
            <span>{pageContent.process.headingLine2}</span>
          </h2>

          <div className="cy-video-process-grid">
            {(pageContent.process.steps || videoProductionDefaults.process.steps).map((step) => (
              <article key={step.number}>
                <span>{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </section>
        )}

        {pageContent.packages.visible !== false && (
          <section className="cy-video-packages">
            <div>
              <div className="cy-video-kicker">{pageContent.packages.kicker}</div>
              <h2>
                {pageContent.packages.headingLine1}
                <br />
                <span>{pageContent.packages.headingLine2}</span>
              </h2>
            </div>
            <p>{pageContent.packages.description}</p>
            <div className="cy-video-package-grid">
              {(pageContent.packages.items || videoProductionDefaults.packages.items).map((item) => (
                <article
                  className={item.featured ? "cy-video-package-featured" : undefined}
                  key={item.number}
                >
                  <span>{item.number} / {item.tier}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <a
                    href={whatsappLink}
                    target={whatsappLink.startsWith("https://") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                  >
                    {item.buttonLabel} ↗
                  </a>
                </article>
              ))}
            </div>
            <small>{pageContent.packages.footnote}</small>
          </section>
        )}

        {pageContent.contact.visible !== false && (
          <section className="cy-video-contact" id="video-contact">
          <div className="cy-video-contact-orb">CY®</div>
          <div className="cy-video-kicker">{pageContent.contact.kicker}</div>
          <h2>
            {pageContent.contact.headingLine1}
            <br />
            <span>{pageContent.contact.headingLine2}</span>
          </h2>
          <p>
            {pageContent.contact.description}
          </p>
          <div className="cy-video-actions">
            <a className="cy-video-button cy-video-button-lime" href={whatsappLink}
              target={whatsappLink.startsWith("https://") ? "_blank" : undefined}
              rel="noopener noreferrer">
              {pageContent.contact.whatsappButton} <span>↗</span>
            </a>
            {profile.email && (
              <a className="cy-video-button cy-video-button-outline" href={emailLink}>
                {pageContent.contact.emailButton} <span>↗</span>
              </a>
            )}
          </div>
        </section>
        )}
      </main>

      <Footer profile={profile} />
    </>
  );
}

export default VideoProduction;
