import React from 'react';
import { useTranslation } from 'react-i18next';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';
import LanguageIcon from '@mui/icons-material/Language';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import { Link } from 'react-router-dom';
import { useTheme } from '../ThemeContext';

const Footer = () => {
  const { t, i18n } = useTranslation();
  const { darkMode } = useTheme();
  const isRtl = i18n.language === 'ur';

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* About Section */}
        <div className="footer-section">
          <h3 className="footer-title">{t('footer.about')}</h3>
          <p>{t('footer.aboutText')}</p>
          
        </div>

        {/* Quick Links Section */}
        <div className="footer-section">
          <h3 className="footer-title">{t('footer.quickLinks')}</h3>
          <ul className="footer-links">
            <li><Link to="/">{t('title')}</Link></li>
            <li><Link to="/new-entry">{t('createNewEntry')}</Link></li>
            <li>
              <a href="https://www.daruliftaahlesunnat.net/ur/fatawa_list" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                {t('footer.servicesLinks.fatwas')}
              </a>
            </li>
          </ul>
        </div>

        {/* Contact Section */}
        <div className="footer-section">
          <h3 className="footer-title">{t('footer.contact')}</h3>
          <div className="contact-info">
            <div className="contact-item">
              <LocationOnIcon />
              <span>{t('footer.addressText')}</span>
            </div>
            <div className="contact-item">
              <PhoneIcon />
              <span>{t('footer.phoneText')}</span>
            </div>
            <div className="contact-item">
              <EmailIcon />
              <span>{t('footer.emailText')}</span>
            </div>
          </div>
        </div>

        {/* Social Links Section */}
        <div className="footer-section">
          <h3 className="footer-title">{t('footer.followUs')}</h3>
          <div className="social-links">
            <a href="https://www.facebook.com/DarulIftaAhleSunnat" className="social-link facebook" target="_blank" rel="noopener noreferrer" aria-label={t('footer.facebook')}>
              <FacebookIcon />
            </a>
            <a href="https://www.instagram.com/darulifta_ahlesunnat" className="social-link instagram" target="_blank" rel="noopener noreferrer" aria-label={t('footer.instagram')}>
              <InstagramIcon />
            </a>
            <a href="https://www.youtube.com/@DaruliftaAhleSunnat" className="social-link youtube" target="_blank" rel="noopener noreferrer" aria-label={t('footer.youtube')}>
              <YouTubeIcon />
            </a>
            <a href="https://www.daruliftaahlesunnat.net" className="social-link website" target="_blank" rel="noopener noreferrer" aria-label={t('footer.website')}>
              <LanguageIcon />
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} {t('allRightsReserved')}. {t('madeBy')} {t('TahirAlmadni')}</p>
      </div>
    </footer>
  );
};

export default Footer;