import LiquidChrome from './LiquidChrome';
import DecayCard from './DecayCard';

const sections = [
  { id: 'home', label: 'Home' },
  { id: 'archive', label: 'Archive' },
  { id: 'notes', label: 'Notes' },
  { id: 'contact', label: 'Contact' },
];

const archiveCards = [
  {
    title: 'Quiet',
    subtitle: 'Essays',
    image: 'https://picsum.photos/id/1011/900/1200?grayscale',
  },
  {
    title: 'Motion',
    subtitle: 'Build Log',
    image: 'https://picsum.photos/id/1005/900/1200?grayscale',
  },
  {
    title: 'Archive',
    subtitle: 'Notes',
    image: 'https://picsum.photos/id/1025/900/1200?grayscale',
  },
];

const notes = [
  '에세이, 개발 기록, 북마크를 하나의 페이지 흐름 안에서 정리합니다.',
  '복잡한 라우팅 없이도 첫 버전의 개인 블로그를 빠르게 시작할 수 있습니다.',
  '필요해지면 이후에 Markdown, MDX, 라우터 기반 상세 페이지로 확장하면 됩니다.',
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
          speed={1}
          amplitude={0.6}
          frequencyX={3}
          frequencyY={3}
          interactive={false}
        />
        <div className="background-vignette" />
      </div>

      <header className="top-nav">
        <div className="brand">
          <BrandMark />
          <span>My Page</span>
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
          <div className="hero-badge">New Background</div>
          <h1>Swirl through a long-form page on one liquid chrome backdrop.</h1>
          <p className="hero-copy">
            상단은 랜딩처럼 보이되, 아래로는 실제 블로그 섹션이 이어지도록 구성했습니다.
            배경은 한 번만 깔리고 스크롤 동안 계속 유지됩니다.
          </p>
          <div className="hero-actions">
            <button type="button" className="cta-primary" onClick={() => scrollToSection('archive')}>
              Get Started
            </button>
            <button type="button" className="cta-secondary" onClick={() => scrollToSection('notes')}>
              Learn More
            </button>
          </div>
        </section>

        <section id="archive" className="content-section">
          <div className="section-heading">
            <p className="section-kicker">Archive</p>
            <h2>메인 콘텐츠는 이미지 카드 중심으로 보이게</h2>
          </div>

          <div className="card-grid">
            {archiveCards.map((card) => (
              <DecayCard
                key={card.title}
                width="100%"
                height={520}
                image={card.image}
              >
                <span>{card.title}</span>
                <small>{card.subtitle}</small>
              </DecayCard>
            ))}
          </div>
        </section>

        <section id="notes" className="content-section content-section-split">
          <div className="section-heading">
            <p className="section-kicker">Notes</p>
            <h2>아래 섹션도 같은 배경 위에서 이어집니다</h2>
          </div>

          <div className="glass-panel">
            {notes.map((note) => (
              <p key={note}>{note}</p>
            ))}
          </div>
        </section>

        <section id="contact" className="content-section">
          <div className="section-heading">
            <p className="section-kicker">Contact</p>
            <h2>마지막 섹션까지 스크롤 이동</h2>
          </div>

          <div className="contact-card">
            <p>
              이 영역은 이후 소개, 링크 모음, 이메일, GitHub, 프로젝트 인덱스로 바꿔 넣으면 됩니다.
            </p>
            <button type="button" className="cta-primary" onClick={() => scrollToSection('home')}>
              Back To Top
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
