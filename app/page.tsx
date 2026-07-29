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
import { CapabilityCheck } from "@/components/landing/CapabilityCheck";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-nav">
        <Link className="landing-brand" href="/">
          <span className="brand-mark">V</span>
          <strong>Vibe Screen</strong>
        </Link>
        <nav aria-label="Primary navigation">
          <a href="#workflow">Workflow</a>
          <a href="#features">Features</a>
          <a href="#privacy">Privacy</a>
        </nav>
        <Link className="nav-cta" href="/studio">
          Open studio
          <ArrowRight size={16} />
        </Link>
      </header>

      <main>
        <section className="landing-hero">
          <div className="hero-copy">
            <span className="landing-eyebrow">Record. Refine. Publish.</span>
            <h1>Your screen, edited with intention.</h1>
            <p>Capture crisp demos, shape every frame, and export polished video directly in your browser.</p>
            <div className="hero-actions">
              <Link className="landing-primary" href="/studio">
                Start recording
                <Record size={18} weight="fill" />
              </Link>
              <a className="landing-secondary" href="#workflow">See the workflow</a>
            </div>
            <CapabilityCheck />
          </div>
          <div className="hero-product">
            <div className="product-window">
              <div className="window-chrome">
                <span><i /><i /><i /></span>
                <b>Vibe Screen Studio</b>
                <em>Local project</em>
              </div>
              <Image
                src={`${basePath}/images/vibe-screen-studio.png`}
                width="1500"
                height="960"
                priority
                alt="Vibe Screen editor showing the media directory, video canvas, inspector, and timeline"
              />
            </div>
            <span className="floating-note note-record"><Record size={15} weight="fill" /> Browser capture</span>
            <span className="floating-note note-local"><LockKey size={15} /> Local by default</span>
          </div>
        </section>

        <section className="trust-strip" aria-label="Product principles">
          <span><LockKey size={18} /> No upload required</span>
          <span><VideoCamera size={18} /> Up to 4K source capture</span>
          <span><Export size={18} /> Browser-native export</span>
          <span><CursorClick size={18} /> Editable zoom and focus</span>
        </section>

        <section className="workflow-section" id="workflow">
          <header>
            <h2>From capture to a finished cut.</h2>
            <p>A focused workflow for product demos, tutorials, and walkthroughs.</p>
          </header>
          <div className="workflow-grid">
            <article className="workflow-record">
              <div className="workflow-copy">
                <span><Record size={18} weight="fill" /></span>
                <h3>Capture the right source</h3>
                <p>Choose a tab, window, or display. Add microphone, shared audio, and a separately editable camera layer.</p>
              </div>
              <Image
                src={`${basePath}/images/vibe-screen-recorder.png`}
                width="960"
                height="680"
                alt="Vibe Screen browser capture dialog with microphone, shared audio, camera, and frame-rate controls"
              />
            </article>
            <article className="workflow-edit">
              <Image
                src={`${basePath}/images/vibe-screen-timeline.png`}
                width="960"
                height="680"
                alt="Vibe Screen timeline with screen, zoom, and text tracks"
              />
              <div className="workflow-copy">
                <span><Scissors size={18} /></span>
                <h3>Cut without clutter</h3>
                <p>Trim the clip, place focus zooms, add text callouts, and adjust the frame in a compact timeline.</p>
              </div>
            </article>
            <article className="workflow-export">
              <div className="export-orbit"><Export size={30} /><i /><i /></div>
              <h3>Export on your machine</h3>
              <p>Render the final composition locally at 30 or 60 fps with resolution and bitrate controls.</p>
            </article>
          </div>
        </section>

        <section className="feature-section" id="features">
          <div className="feature-title">
            <h2>Professional where it matters.</h2>
            <p>The first release keeps the core small, fast, and dependable.</p>
          </div>
          <div className="feature-ledger">
            <article>
              <FilmSlate size={23} />
              <div><h3>Real editing canvas</h3><p>Aspect ratios, padding, radii, shadows, backgrounds, and synchronized camera overlays.</p></div>
              <Check size={18} weight="bold" />
            </article>
            <article>
              <MagicWand size={23} />
              <div><h3>Timeline focus effects</h3><p>Place zoom regions with adjustable scale and focal point, then preview them before export.</p></div>
              <Check size={18} weight="bold" />
            </article>
            <article>
              <LockKey size={23} />
              <div><h3>Local-first projects</h3><p>Draft metadata and source blobs persist in IndexedDB. Nothing is sent to a Vibe Screen server.</p></div>
              <Check size={18} weight="bold" />
            </article>
            <article>
              <Export size={23} />
              <div><h3>Quality controls</h3><p>Choose source, 1080p, 1440p, or 4K output with explicit frame rate and bitrate.</p></div>
              <Check size={18} weight="bold" />
            </article>
          </div>
        </section>

        <section className="privacy-section" id="privacy">
          <div className="privacy-symbol"><LockKey size={36} weight="duotone" /></div>
          <div>
            <h2>Your raw footage stays yours.</h2>
            <p>Recording, project storage, preview, and export run locally. Vibe Screen does not need an account to make a video.</p>
          </div>
          <ul>
            <li><Check size={17} weight="bold" /> No source upload</li>
            <li><Check size={17} weight="bold" /> No account required</li>
            <li><Check size={17} weight="bold" /> Open-source project</li>
          </ul>
        </section>

        <section className="landing-closing">
          <div>
            <h2>Make the next demo worth watching.</h2>
            <p>Open the studio, choose your screen, and keep the edit moving.</p>
          </div>
          <Link className="landing-primary" href="/studio">
            Open studio
            <ArrowRight size={18} />
          </Link>
        </section>
      </main>

      <footer className="landing-footer">
        <Link className="landing-brand" href="/">
          <span className="brand-mark">V</span>
          <strong>Vibe Screen</strong>
        </Link>
        <p>Built for focused browser-native screen video.</p>
        <a href="https://github.com/Superkimi/Vibe-Screen" target="_blank" rel="noreferrer">GitHub</a>
      </footer>
    </div>
  );
}
