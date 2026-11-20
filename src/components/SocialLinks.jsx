import { FaFacebookF, FaGithub, FaInstagram, FaLinkedinIn, FaXTwitter, FaYoutube } from 'react-icons/fa6';
import { site } from '../config/site';

// One list of social profiles for the footer, menu and contact page.
// Any profile left as '' in site.social is hidden.
export const socialProfiles = () =>
  [
    { href: site.social.facebook, label: 'Facebook', Icon: FaFacebookF },
    { href: site.social.x, label: 'X (Twitter)', Icon: FaXTwitter },
    { href: site.social.youtube, label: 'YouTube', Icon: FaYoutube },
    { href: site.social.instagram, label: 'Instagram', Icon: FaInstagram },
    { href: site.social.linkedin, label: 'LinkedIn', Icon: FaLinkedinIn },
    { href: site.social.github, label: 'GitHub', Icon: FaGithub },
  ].filter((x) => x.href);

export default function SocialLinks({ className, size = 17 }) {
  const list = socialProfiles();
  if (!list.length) return null;
  return (
    <ul role="list" className={className}>
      {list.map(({ href, label, Icon }) => (
        <li key={label}>
          <a href={href} target="_blank" rel="noreferrer" aria-label={`${site.name} on ${label}`} title={label}>
            <Icon size={size} aria-hidden />
          </a>
        </li>
      ))}
    </ul>
  );
}
