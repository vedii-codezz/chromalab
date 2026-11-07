import { ArrowUpRight } from "lucide-react";

export function ComponentPreview({ live = false }: { live?: boolean }) {
  return (
    <section className="preview-panel" aria-labelledby="preview-heading">
      <div className="section-top">
        <h2 id="preview-heading" className="eyebrow">
          In context
        </h2>
        <span className="micro muted">
          {live
            ? "Temporary mappings · 600 / 100 / 400 / 800"
            : "Static component preview"}
        </span>
      </div>
      <div className="preview-grid">
        <div className="type-example">
          <span className="micro muted">01 / TYPOGRAPHY</span>
          <p>
            Good things
            <br />
            <em>take shape.</em>
          </p>
          <span className="micro muted">
            A little intention goes a long way.
          </span>
        </div>
        <div className="button-example">
          <span className="micro muted">02 / INTERFACE</span>
          <button className="sample-button" disabled>
            Explore collection <ArrowUpRight size={15} />
          </button>
          <span className="micro muted">Example button · not interactive</span>
          <div className="sample-tags">
            <span>Considered</span>
            <span>Collected</span>
          </div>
        </div>
        <article className="surface-example">
          <div className="surface-art" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div>
            <span className="micro muted">03 / SURFACE</span>
            <h3>A quieter kind of bold.</h3>
            <p>A palette with room to breathe.</p>
          </div>
        </article>
      </div>
    </section>
  );
}
