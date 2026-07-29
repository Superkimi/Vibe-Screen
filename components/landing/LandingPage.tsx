import {
  ArrowRight,
  Check,
  CursorClick,
  Export,
  FilmSlate,
  LockKey,
  MagicWand,
  Record,
  Scissors,
  VideoCamera,
} from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { landingCopy, type LandingLocale } from "@/lib/landing-copy";
import { CapabilityCheck } from "./CapabilityCheck";
import { LanguageSwitcher } from "./LanguageSwitcher";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function LandingPage({ locale }: { locale: LandingLocale }) {
  const copy = landingCopy[locale];

  return (
    <div className="landing-page" lang={locale === "zh" ? "zh-CN" : "en"}>
      <header className="landing-nav">
        <Link className="landing-brand" href={`/${locale}`}>
          <span className="brand-mark">V</span>
          <strong>Vibe Screen</strong>
        </Link>
        <nav aria-label={copy.nav.aria}>
          <a href="#workflow">{copy.nav.workflow}</a>
          <a href="#features">{copy.nav.features}</a>
          <a href="#privacy">{copy.nav.privacy}</a>
        </nav>
        <div className="landing-nav-actions">
          <LanguageSwitcher locale={locale} ariaLabel={copy.nav.language} />
          <Link className="nav-cta" href="/studio">
            {copy.nav.studio}
            <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="hero-copy">
            <span className="landing-eyebrow">{copy.hero.eyebrow}</span>
            <h1>{copy.hero.title}</h1>
            <p>{copy.hero.description}</p>
            <div className="hero-actions">
              <Link className="landing-primary" href="/studio">
                {copy.hero.primary}
                <Record size={18} weight="fill" />
              </Link>
              <a className="landing-secondary" href="#workflow">{copy.hero.secondary}</a>
            </div>
            <CapabilityCheck locale={locale} />
          </div>
          <div className="hero-product">
            <div className="product-window">
              <div className="window-chrome">
                <span><i /><i /><i /></span>
                <b>{copy.hero.product}</b>
                <em>{copy.hero.localProject}</em>
              </div>
              <Image
                src={`${basePath}/images/vibe-screen-studio.png`}
                width="1500"
                height="960"
                priority
                alt={copy.hero.imageAlt}
              />
            </div>
            <span className="floating-note note-record"><Record size={15} weight="fill" /> {copy.hero.captureNote}</span>
            <span className="floating-note note-local"><LockKey size={15} /> {copy.hero.localNote}</span>
          </div>
        </section>

        <section className="trust-strip" aria-label={copy.principles.aria}>
          <span><LockKey size={18} /> {copy.principles.upload}</span>
          <span><VideoCamera size={18} /> {copy.principles.source}</span>
          <span><Export size={18} /> {copy.principles.export}</span>
          <span><CursorClick size={18} /> {copy.principles.focus}</span>
        </section>

        <section className="workflow-section" id="workflow">
          <header>
            <h2>{copy.workflow.title}</h2>
            <p>{copy.workflow.description}</p>
          </header>
          <div className="workflow-grid">
            <article className="workflow-record">
              <div className="workflow-copy">
                <span><Record size={18} weight="fill" /></span>
                <h3>{copy.workflow.captureTitle}</h3>
                <p>{copy.workflow.captureBody}</p>
              </div>
              <Image
                src={`${basePath}/images/vibe-screen-recorder.png`}
                width="960"
                height="680"
                alt={copy.workflow.captureAlt}
              />
            </article>
            <article className="workflow-edit">
              <Image
                src={`${basePath}/images/vibe-screen-timeline.png`}
                width="960"
                height="680"
                alt={copy.workflow.editAlt}
              />
              <div className="workflow-copy">
                <span><Scissors size={18} /></span>
                <h3>{copy.workflow.editTitle}</h3>
                <p>{copy.workflow.editBody}</p>
              </div>
            </article>
            <article className="workflow-export">
              <div className="export-orbit"><Export size={30} /><i /><i /></div>
              <h3>{copy.workflow.exportTitle}</h3>
              <p>{copy.workflow.exportBody}</p>
            </article>
          </div>
        </section>

        <section className="feature-section" id="features">
          <div className="feature-title">
            <h2>{copy.features.title}</h2>
            <p>{copy.features.description}</p>
          </div>
          <div className="feature-ledger">
            <article>
              <FilmSlate size={23} />
              <div><h3>{copy.features.canvasTitle}</h3><p>{copy.features.canvasBody}</p></div>
              <Check size={18} weight="bold" />
            </article>
            <article>
              <MagicWand size={23} />
              <div><h3>{copy.features.focusTitle}</h3><p>{copy.features.focusBody}</p></div>
              <Check size={18} weight="bold" />
            </article>
            <article>
              <LockKey size={23} />
              <div><h3>{copy.features.localTitle}</h3><p>{copy.features.localBody}</p></div>
              <Check size={18} weight="bold" />
            </article>
            <article>
              <Export size={23} />
              <div><h3>{copy.features.qualityTitle}</h3><p>{copy.features.qualityBody}</p></div>
              <Check size={18} weight="bold" />
            </article>
          </div>
        </section>

        <section className="privacy-section" id="privacy">
          <div className="privacy-symbol"><LockKey size={36} weight="duotone" /></div>
          <div>
            <h2>{copy.privacy.title}</h2>
            <p>{copy.privacy.body}</p>
          </div>
          <ul>
            <li><Check size={17} weight="bold" /> {copy.privacy.upload}</li>
            <li><Check size={17} weight="bold" /> {copy.privacy.account}</li>
            <li><Check size={17} weight="bold" /> {copy.privacy.source}</li>
          </ul>
        </section>

        <section className="landing-closing">
          <div>
            <h2>{copy.closing.title}</h2>
            <p>{copy.closing.body}</p>
          </div>
          <Link className="landing-primary" href="/studio">
            {copy.closing.action}
            <ArrowRight size={18} />
          </Link>
        </section>
      </main>

      <footer className="landing-footer">
        <Link className="landing-brand" href={`/${locale}`}>
          <span className="brand-mark">V</span>
          <strong>Vibe Screen</strong>
        </Link>
        <p>{copy.footer}</p>
        <a href="https://github.com/Superkimi/Vibe-Screen" target="_blank" rel="noreferrer">GitHub</a>
      </footer>
    </div>
  );
}
