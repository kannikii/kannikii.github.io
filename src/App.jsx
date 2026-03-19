import LiquidChrome from './LiquidChrome';
import DecayCard from './DecayCard';
import LogoLoop from '@/components/LogoLoop/LogoLoop';
import {
  SiCplusplus,
  SiGithub,
  SiJavascript,
  SiMysql,
  SiNodedotjs,
  SiOpenjdk,
  SiPython,
  SiReact,
  SiSpringboot,
} from 'react-icons/si';

const sections = [
  { id: 'home', label: 'Home' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
  { id: 'skills', label: 'Skills' },
  { id: 'contact', label: 'Contact' },
];

const projectCards = [
  {
    title: 'Studio',
    subtitle: 'Interactive Landing Page',
    image: 'https://picsum.photos/id/1011/900/1200?grayscale',
  },
  {
    title: 'System',
    subtitle: 'Design System Library',
    image: 'https://picsum.photos/id/1005/900/1200?grayscale',
  },
  {
    title: 'Commerce',
    subtitle: 'Product Experience',
    image: 'https://picsum.photos/id/1025/900/1200?grayscale',
  },
];

const experienceItems = [
  {
    role: 'Full Stack Developer',
    company: 'Product Engineering',
    description:
      'Built end-to-end product features across frontend and backend, from responsive interfaces and API integration to deployment-ready application flows.',
  },
  {
    role: 'Frontend & Backend Collaboration',
    company: 'Design Systems + Services',
    description:
      'Worked closely with designers and backend teams to translate product requirements into scalable UI components, service layers, and consistent user experiences.',
  },
  {
    role: 'Web Application Development',
    company: 'Interfaces, APIs, and Data',
    description:
      'Focused on building maintainable web applications with thoughtful interaction, reliable data handling, and a strong eye for product polish.',
  },
];

const skillLogos = [
  {
    node: <SiGithub style={{ color: '#f5f5f5' }} />,
    title: 'GitHub',
    href: 'https://github.com/kannikii',
  },
  {
    node: <SiReact style={{ color: '#61dafb' }} />,
    title: 'React',
    href: 'https://react.dev',
  },
  {
    node: <SiNodedotjs style={{ color: '#5fa04e' }} />,
    title: 'Node.js',
    href: 'https://nodejs.org',
  },
  {
    node: <SiSpringboot style={{ color: '#6db33f' }} />,
    title: 'Spring Boot',
    href: 'https://spring.io/projects/spring-boot',
  },
  {
    node: <SiMysql style={{ color: '#4479a1' }} />,
    title: 'MySQL',
    href: 'https://www.mysql.com',
  },
  {
    node: <SiJavascript style={{ color: '#f7df1e' }} />,
    title: 'JavaScript',
    href: 'https://developer.mozilla.org/docs/Web/JavaScript',
  },
  {
    node: <SiOpenjdk style={{ color: '#f89820' }} />,
    title: 'Java',
    href: 'https://openjdk.org',
  },
  {
    node: <SiPython style={{ color: '#3776ab' }} />,
    title: 'Python',
    href: 'https://www.python.org',
  },
  {
    node: <SiCplusplus style={{ color: '#00599c' }} />,
    title: 'C++',
    href: 'https://isocpp.org',
  },
];

function scrollToSection(id) {
  const target = document.getElementById(id);

  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function BrandMark() {
  return (
    <svg
      className="brand-mark"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M24 6C28 10 31 16 31 24C31 32 28 38 24 42C20 38 17 32 17 24C17 16 20 10 24 6Z"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M6 24C10 20 16 17 24 17C32 17 38 20 42 24C38 28 32 31 24 31C16 31 10 28 6 24Z"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M11 11C16 10 22 11 28 17C34 23 37 29 37 37C31 38 25 37 19 31C13 25 10 19 11 11Z"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function App() {
  return (
    <div className="site-shell">
      <div className="site-background" aria-hidden="true">
        <LiquidChrome
          baseColor={[0.1, 0.1, 0.1]}
          speed={0.72}
          amplitude={0.6}
          frequencyX={3}
          frequencyY={3}
          interactive={true}
        />
        <div className="background-vignette" />
      </div>

      <header className="top-nav">
        <div className="brand">
          <BrandMark />
          <span>Kannikii</span>
        </div>

        <nav className="nav-actions" aria-label="Primary">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              className="nav-button"
              onClick={() => scrollToSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="page-content">
        <section id="home" className="hero-section">
          <div className="hero-badge">Full Stack Developer</div>
          <h1>Building reliable products across interfaces, APIs, and data.</h1>
          <p className="hero-copy">
            I build full stack web experiences with a focus on clean frontend systems,
            practical backend architecture, and product-driven development from concept to
            deployment.
          </p>
          <div className="hero-actions">
            <button
              type="button"
              className="cta-primary"
              onClick={() => scrollToSection('projects')}
            >
              View Projects
            </button>
            <button
              type="button"
              className="cta-secondary"
              onClick={() => scrollToSection('experience')}
            >
              See Experience
            </button>
          </div>
        </section>

        <section id="experience" className="content-section content-section-split">
          <div className="section-heading">
            <p className="section-kicker">Experience</p>
            <h2>Shipping product features across frontend, backend, and user experience.</h2>
          </div>

          <div className="glass-panel experience-list">
            {experienceItems.map((item) => (
              <article key={item.role} className="experience-item">
                <div className="experience-meta">
                  <h3>{item.role}</h3>
                  <span>{item.company}</span>
                </div>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="projects" className="content-section">
          <div className="section-heading">
            <p className="section-kicker">Projects</p>
            <h2>Selected projects spanning product UI, platform thinking, and modern web stacks.</h2>
          </div>

          <div className="card-grid">
            {projectCards.map((card) => (
              <DecayCard key={card.title} width="100%" height={520} image={card.image}>
                <span>{card.title}</span>
                <small>{card.subtitle}</small>
              </DecayCard>
            ))}
          </div>
        </section>

        <section id="skills" className="content-section">
          <div className="section-heading">
            <p className="section-kicker">Skills</p>
            <h2>Core tools and technologies I use across frontend, backend, and data work.</h2>
          </div>

          <div className="contact-card contact-card--stack">
            <p>
              A quick view of the stack I use most often while building product interfaces,
              application services, and data-backed web experiences.
            </p>
            <div className="logo-loop-shell">
              <LogoLoop
                logos={skillLogos}
                speed={80}
                direction="left"
                logoHeight={48}
                gap={56}
                hoverSpeed={20}
                scaleOnHover
                fadeOut
                fadeOutColor="#120b1d"
                ariaLabel="Skills and technology logos"
              />
            </div>
          </div>
        </section>

        <section id="contact" className="content-section">
          <div className="section-heading">
            <p className="section-kicker">Contact</p>
            <h2>Open to product builds, full stack work, and thoughtful collaborations.</h2>
          </div>

          <div className="contact-card contact-card--stack">
            <p>
              You can reach me through my GitHub profile for project context, code samples,
              and ongoing work. This section can also expand later with email, resume, or
              other contact links.
            </p>
            <div className="contact-actions">
              <a
                className="cta-primary contact-link"
                href="https://github.com/kannikii"
                target="_blank"
                rel="noreferrer noopener"
              >
                Visit GitHub / kannikii
              </a>
            </div>
            <button type="button" className="cta-primary" onClick={() => scrollToSection('home')}>
              Back To Top
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
