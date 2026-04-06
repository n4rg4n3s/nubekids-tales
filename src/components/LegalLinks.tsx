interface LegalLinksProps {
  className?: string;
  linkColor?: string;
  textColor?: string;
}

const LEGAL_LINKS = [
  { href: '/aviso-legal.html', label: 'Aviso legal' },
  { href: '/condiciones-servicio.html', label: 'Condiciones' },
  { href: '/politica-privacidad.html', label: 'Privacidad' },
  { href: '/politica-cookies.html', label: 'Cookies' },
];

export default function LegalLinks({
  className = '',
  linkColor = '#1E293B',
  textColor = 'rgba(30, 41, 59, 0.68)',
}: LegalLinksProps) {
  return (
    <p
      className={`text-center text-xs leading-6 ${className}`.trim()}
      style={{ color: textColor }}
    >
      {LEGAL_LINKS.map((link, index) => (
        <span key={link.href}>
          {index > 0 ? <span aria-hidden="true"> · </span> : null}
          <a
            href={link.href}
            className="underline underline-offset-2 transition-opacity hover:opacity-80"
            style={{ color: linkColor }}
          >
            {link.label}
          </a>
        </span>
      ))}
    </p>
  );
}
