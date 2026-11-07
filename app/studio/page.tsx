import type { Metadata } from "next";
import { Download, Play, LockKeyhole } from "lucide-react";
import { Wordmark } from "@/components/layout/wordmark";
import { Reveal } from "@/components/shared/reveal";
import { StudioWorkspace } from "@/components/studio/studio-workspace";

export const metadata: Metadata = { title: "Studio" };

export default function Studio() {
  return (
    <>
      <header>
        <nav className="site-nav studio-nav" aria-label="Studio navigation">
          <Wordmark />
          <div className="project-title">
            <strong>Untitled color study</strong>
            <span className="pill">Demo project</span>
          </div>
          <div className="studio-actions">
            <span className="pill">Foundation preview</span>
            <button
              className="quiet-button"
              disabled
              aria-describedby="future-controls"
            >
              <Play size={13} />
              Present
            </button>
            <button
              className="quiet-button"
              disabled
              aria-describedby="future-controls"
            >
              <Download size={13} />
              Export
            </button>
          </div>
        </nav>
        <div className="studio-subnav">
          <nav className="mode-tabs" aria-label="Product modes">
            <span aria-current="page">Manual Studio</span>
            <button disabled aria-describedby="future-controls">
              Client Brief <span className="pill">Soon</span>
            </button>
          </nav>
          <span className="micro muted" id="future-controls">
            <LockKeyhole
              size={10}
              aria-hidden="true"
              style={{ display: "inline", marginRight: 5 }}
            />
            Brief, presentation & export · Coming soon
          </span>
          <span className="sr-only">
            Cinematic Presentation is coming soon.
          </span>
        </div>
      </header>
      <Reveal>
        <StudioWorkspace />
      </Reveal>
    </>
  );
}
