
import "./footer.css";
import { getUploadUrl } from "../api/api";

function Footer({ profile = {} }) {
  const brandName = profile.store_name || "Creator-Yard";

  const socials = [
    { name: "Facebook", url: profile.facebook },
    { name: "Instagram", url: profile.instagram },
    { name: "TikTok", url: profile.tiktok },
    { name: "X", url: profile.twitter },
  ].filter((item) => item.url?.trim());

  const phone = (profile.phone || "").trim();
  const whatsapp = (profile.whatsapp || "").trim();
  const email = (profile.email || "").trim();

  const digits = (whatsapp || phone).replace(/\D/g, "");
  const internationalDigits = digits.startsWith("0")
    ? `234${digits.slice(1)}`
    : digits;

  const whatsappUrl = /^https?:\/\//i.test(whatsapp)
    ? whatsapp
    : internationalDigits
      ? `https://wa.me/${internationalDigits}`
      : "";

  const formatUrl = (value) => {
    const url = value.trim();
    return /^(https?:\/\/|mailto:|tel:)/i.test(url)
      ? url
      : `https://${url}`;
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-main">
          <a
            className="footer-brand"
            href="#home"
            aria-label={`${brandName} home`}
          >
            {profile.logo ? (
              <img
                src={getUploadUrl(profile.logo)}
                alt={`${brandName} logo`}
                className="footer-logo"
              />
            ) : (
              <span className="footer-logo-fallback">
                {brandName}
              </span>
            )}
          </a>

          <nav className="footer-connect" aria-label="Social media and contact">
            {socials.map((item) => (
              <a
                key={item.name}
                href={formatUrl(item.url)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.name}
                <span aria-hidden="true">↗</span>
              </a>
            ))}

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp <span aria-hidden="true">↗</span>
              </a>
            )}

            {email && (
              <a href={`mailto:${email}`}>
                Email <span aria-hidden="true">↗</span>
              </a>
            )}

            {phone && (
              <a href={`tel:${phone}`}>
                Call <span aria-hidden="true">↗</span>
              </a>
            )}
          </nav>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} {brandName}. All rights reserved.</p>
          <a href="#home">Back to top ↑</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
