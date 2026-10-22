
import { useState, useEffect } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import { getProfile, getUploadUrl } from "../api/api";
import "./header.css";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] = useState({});

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getProfile();
        setProfile(data || {});
      } catch (error) {
        console.error("Could not load Creator-Yard profile:", error);
      }
    }

    loadProfile();
  }, []);

  const brandName = profile.store_name || "Creator-Yard";

  const closeMenu = () => setMenuOpen(false);

  const navLinks = [
    { label: "Home", href: "#home" },
    { label: "Services", href: "#services" },
    { label: "Our Work", href: "#work" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <header className="cy-header">
      <div className="container">
        <nav aria-label="Main navigation">
          <a
            className="logo-area"
            href="#home"
            onClick={closeMenu}
            aria-label={`${brandName} home`}
          >
            {(profile.logo_type === "image" ||
              profile.logo_type === "both") &&
              profile.logo && (
                <img
                  src={getUploadUrl(profile.logo)}
                  alt=""
                  className="header-logo"
                />
              )}

            {(profile.logo_type === "text" ||
              profile.logo_type === "both" ||
              !profile.logo_type) && <span>{brandName}</span>}
          </a>

          <ul className="nav-links">
            {navLinks.map((link) => (
              <li key={link.label}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="menu-btn"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </nav>

        {menuOpen && (
          <div className="mobile-menu">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} onClick={closeMenu}>
                {link.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
