import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  MoveUpRight,
} from "lucide-react";
import { Wordmark } from "@/components/layout/wordmark";
import { Reveal } from "@/components/shared/reveal";
import { blueHour } from "@/lib/color/demo-palettes";

function PaletteIllustration() {
  return (
    <div
      className="palette-scene"
      role="img"
      aria-label="Static palette illustration: Blue hour with blue, warm ochre and terracotta color studies"
      data-reveal
    >
      <span className="scene-coordinate">COLOR STUDY — 001</span>
      <div className="palette-paper main-paper" aria-hidden="true">
        <div className="paper-head">
          <span>CHROMA / COLLECTION</span>
          <MoveUpRight size={13} />
        </div>
        <div className="paper-color">
          <span>
            Blue
            <br />
            hour.
          </span>
          <span>#5479B8</span>
        </div>
        <div className="paper-foot">
          <span className="micro muted">
            A starting point. Endless possibility.
          </span>
          <span className="color-dot" />
        </div>
      </div>
      <div className="palette-paper scale-paper" aria-hidden="true">
        <div className="paper-head">
          <span>THE TONAL STUDY</span>
          <span>50 — 900</span>
        </div>
        <div className="scene-scale">
          {blueHour.map((shade) => (
            <span key={shade.step} style={{ background: shade.hex }} />
          ))}
        </div>
        <h3>Room for every shade.</h3>
        <span className="micro muted">One family. A considered spectrum.</span>
      </div>
      <div className="palette-paper mini-paper" aria-hidden="true">
        <span className="eyebrow" style={{ fontSize: 8 }}>
          Better together
        </span>
        <div className="mini-chips">
          <i style={{ background: "#5479B8" }} />
          <i style={{ background: "#D7B66D" }} />
          <i style={{ background: "#BD7964" }} />
        </div>
        <span className="micro muted" style={{ fontSize: 8 }}>
          A little contrast. A lot of character.
        </span>
      </div>
      <span className="annotation" aria-hidden="true">
        It starts with a feeling. ↗
      </span>
      <span className="scene-cross" aria-hidden="true">
        +
      </span>
    </div>
  );
}

export default function Landing() {
  return (
    <>
      <header>
        <nav className="site-nav" aria-label="Main navigation">
          <Wordmark />
          <div className="nav-right">
            <span className="status-dot">An independent color playground</span>
            <Link href="/studio" className="nav-link">
              Open studio <ArrowUpRight size={14} />
            </Link>
          </div>
        </nav>
      </header>
      <Reveal>
        <main id="main" tabIndex={-1} className="landing-main">
          <section className="hero" aria-labelledby="hero-heading">
            <div className="hero-copy">
              <p className="eyebrow hero-kicker" data-reveal>
                A space for color to become something
              </p>
              <h1 id="hero-heading" data-reveal>
                One color. <br />
                An entire <br />
                <em>design language.</em>
              </h1>
              <p className="hero-description" data-reveal>
                From a single spark to a thoughtful system. A creative workspace
                for palettes, possibilities, and everything that comes together
                in between.
              </p>
              <div data-reveal>
                <Link href="/studio" className="primary-link">
                  Enter the Studio <ArrowRight size={16} />
                </Link>
                <span className="hero-caption">
                  Foundation preview · Made for curious minds
                </span>
              </div>
            </div>
            <PaletteIllustration />
          </section>
          <section className="landing-bottom" aria-label="Our approach">
            <p className="bottom-intro" data-reveal>
              A little intuition. <br />
              <em>A lot of intention.</em>{" "}
              <ArrowDownRight
                size={23}
                style={{ display: "inline", marginLeft: 8 }}
              />
            </p>
            <div className="principles">
              <article data-reveal>
                <span className="principle-number">01 /</span>
                <h2>Start with a feeling</h2>
                <p>
                  A color, a mood, a small idea. Every good system begins
                  somewhere.
                </p>
              </article>
              <article data-reveal>
                <span className="principle-number">02 /</span>
                <h2>Find the relationships</h2>
                <p>
                  A considered approach to tones, contrast, and colors that
                  belong together.
                </p>
              </article>
              <article data-reveal>
                <span className="principle-number">03 /</span>
                <h2>See the bigger picture</h2>
                <p>
                  Explore the foundation. The full design-system toolkit is on
                  its way.
                </p>
              </article>
            </div>
          </section>
        </main>
      </Reveal>
      <footer className="site-footer">
        <span>CHROMA LAB © 2026</span>
        <span>Considered color. By design.</span>
        <span>V.01 / FOUNDATION</span>
      </footer>
    </>
  );
}
