import { useState, useEffect } from "react";
import { getProfile } from "../api/api";
import "./header.css";

function Header() {
  const [profile, setProfile] = useState({});
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    getProfile()
      .then((data) => setProfile(data || {}))
      .catch(() => {});
  }, []);

  const brandName = profile.store_name || "Creator-Yard";
  const closeMenu = () => setMenuOpen(false);

  const isVideoProductionPage =
    window.location.pathname === "/video-production";

  const homePrefix = isVideoProductionPage ? "/" : "";

  const navLinks = [
    { label: "Home", href: `${homePrefix}#home` },
    { label: "About", href: `${homePrefix}#about` },
    { label: "Services", href: `${homePrefix}#services` },
    { label: "Our Work", href: `${homePrefix}#work` },
    { label: "Video Production", href: "/video-production" },
    { label: "Contact", href: `${homePrefix}#contact` },
  ];

  return (
    <header className="cy-header">
      <div className="container">
        <a className="cy-header-brand" href="/" onClick={closeMenu}>
          {profile.logo ? (
            <img src={profile.logo} alt={brandName} />
          ) : (
            <span>{brandName}</span>
          )}
        </a>

        <button
          type="button"
          className="cy-menu-toggle"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? "?" : "?"}
        </button>

        <nav className={menuOpen ? "cy-nav open" : "cy-nav"}>
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} onClick={closeMenu}>
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default Header;
