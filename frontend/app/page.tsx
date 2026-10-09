const features = [
  {
    number: "01",
    icon: "↗",
    title: "Workspaces that scale",
    description:
      "Bring a team together in a shared space. Invite collaborators and keep every document organized around the work.",
    tag: "TEAM ORGANIZATION",
  },
  {
    number: "02",
    icon: "⌘",
    title: "Live collaboration",
    description:
      "A real-time foundation built with Socket.IO keeps document sessions connected and makes presence part of the workflow.",
    tag: "REAL-TIME SOCKETS",
  },
  {
    number: "03",
    icon: "◷",
    title: "Version history",
    description:
      "Track document revisions and restore an earlier version when the team needs to revisit a previous direction.",
    tag: "REVISION CONTROL",
  },
  {
    number: "04",
    icon: "⛨",
    title: "Access by role",
    description:
      "Workspace membership and role checks help ensure that collaboration stays within the right permissions.",
    tag: "ROLE-BASED ACCESS",
  },
];

const stack = ["Next.js", "React", "TypeScript", "Node.js", "Express", "MongoDB", "Socket.IO", "JWT"];

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="arrow-icon">
      <path d="M4 10h11M10 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Home() {
  return (
    <main>
      <nav className="navbar shell" aria-label="Main navigation">
        <a className="brand" href="#top" aria-label="Collabspace home">
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /><span /></span>
          <span>collabspace<span className="brand-period">.</span></span>
        </a>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#tech-stack">Tech stack</a>
        </div>
        <a className="nav-cta" href="#project">Explore the project <ArrowIcon /></a>
      </nav>

      <section className="hero shell" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span className="status-dot" /> BUILT FOR TEAMS THAT BUILD</div>
          <h1>Good work happens<br />when we <span>work together.</span></h1>
          <p className="hero-description">
            A collaborative workspace for teams to organize work, edit documents in real time, and keep every important change within reach.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#features">Explore features <ArrowIcon /></a>
            <a className="button button-secondary" href="#how-it-works">See how it works <span aria-hidden="true">↓</span></a>
          </div>
          <div className="hero-proof">
            <div className="avatar-stack" aria-hidden="true"><span>AK</span><span>RM</span><span>JS</span><span>+</span></div>
            <p><strong>One shared space.</strong><br /><span>Less context switching, more momentum.</span></p>
          </div>
        </div>

        <div className="product-visual" aria-label="Illustration of a collaborative workspace interface">
          <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
          <div className="workspace-window">
            <div className="window-topbar"><div className="window-dots"><i /><i /><i /></div><span>PRODUCT / PROJECT BRIEF</span><span className="window-lock">⌑ Private</span></div>
            <div className="workspace-layout">
              <aside className="mock-sidebar">
                <div className="mock-side-brand"><span className="mini-mark">c.</span><span>Acme Studio</span><b>⌄</b></div>
                <div className="side-label">WORKSPACE</div>
                <div className="side-item active"><span>▦</span> Overview</div>
                <div className="side-item"><span>▤</span> Documents <small>4</small></div>
                <div className="side-item"><span>♧</span> Team</div>
                <div className="side-label side-label-spaced">YOUR SPACE</div>
                <div className="side-item"><span className="file-dot purple" /> Product brief</div>
                <div className="side-item"><span className="file-dot yellow" /> Sprint notes</div>
                <div className="side-item"><span className="file-dot blue" /> Research</div>
                <div className="sidebar-bottom"><div className="profile-avatar">MS</div><span><b>Mehtaab Singh</b><small>Workspace owner</small></span><span className="more">···</span></div>
              </aside>
              <div className="mock-main">
                <div className="mock-breadcrumb">Documents <span>/</span> Product brief</div>
                <div className="doc-heading"><div><div className="doc-kicker">UPDATED JUST NOW</div><h2>Product brief</h2></div><div className="collaborator-avatars"><span>AK</span><span>RM</span><span>JS</span><b>+2</b></div></div>
                <div className="mock-toolbar"><b>B</b><i>I</i><u>U</u><span /> <b>≡</b><b>☷</b><span /> <b>↶</b><b>↷</b><div className="live-pill"><i /> Live</div></div>
                <div className="mock-document"><h3>Building better, together.</h3><p>Our best ideas happen when everyone has the context to contribute. This is where we turn shared thinking into meaningful progress.</p><div className="comment-highlight">A shared source of truth makes the whole team faster.<span className="comment-pin">RM</span></div><h4>What we are working toward</h4><div className="mock-check"><span>✓</span> Make collaboration feel effortless</div><div className="mock-check"><span>✓</span> Keep decisions and revisions together</div><div className="mock-check muted"><span>○</span> Ship the next milestone</div><div className="cursor-note"><span className="cursor-arrow">↖</span><span>Riya is editing</span></div></div>
                <div className="mock-footer"><span><i /> All changes saved</span><span>Version 08 <b>·</b> History ↗</span></div>
              </div>
            </div>
          </div>
          <div className="floating-card presence-card"><div className="presence-icon">◉</div><div><b>Team presence</b><span>3 people collaborating</span></div><div className="presence-pulse" /></div>
          <div className="floating-card history-card"><div className="history-icon">↶</div><div><b>Version history</b><span>Every change has a place.</span></div></div>
          <div className="visual-caption"><span>01 / COLLABORATE</span><span>DESIGNED FOR SHARED MOMENTUM ↗</span></div>
        </div>
        <div className="hero-bottom-line"><span>THOUGHTFUL BY DESIGN</span><span>CONNECTED BY DEFAULT</span><span>BUILT TO MOVE WORK FORWARD</span></div>
      </section>

      <section className="features-section" id="features">
        <div className="shell section-inner">
          <div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> THE WORKSPACE TOOLKIT</div><h2>Everything your team needs.<br /><span>Nothing in the way.</span></h2></div><p>From the first idea to the final revision, keep people, documents, and decisions connected in one focused workspace.</p></div>
          <div className="feature-grid">{features.map((feature) => <article className="feature-card" key={feature.number}><div className="feature-card-top"><span className="feature-icon">{feature.icon}</span><span className="feature-number">{feature.number}</span></div><h3>{feature.title}</h3><p>{feature.description}</p><div className="feature-tag"><span />{feature.tag}</div></article>)}</div>
        </div>
      </section>

      <section className="workflow-section shell" id="how-it-works">
        <div className="workflow-intro"><div className="eyebrow"><span className="eyebrow-line" /> A CLEARER WAY TO WORK</div><h2>Less chasing.<br /><span>More creating.</span></h2><p>A workspace should make collaboration feel natural. The architecture brings identity, permissions, documents, and real-time events into one coherent workflow.</p><a className="text-link" href="#tech-stack">Under the hood <ArrowIcon /></a></div>
        <div className="workflow-steps"><article><div className="step-index">01</div><div><h3>Create a shared space</h3><p>Set up a workspace, invite members, and keep the team around a common goal.</p></div><span className="step-symbol">↗</span></article><article><div className="step-index">02</div><div><h3>Collaborate on documents</h3><p>Work with workspace documents and use real-time events to coordinate active sessions.</p></div><span className="step-symbol">⌘</span></article><article><div className="step-index">03</div><div><h3>Keep every change accountable</h3><p>Use revision history and role-aware access to protect the integrity of team work.</p></div><span className="step-symbol">◷</span></article></div>
      </section>

      <section className="stack-section" id="tech-stack"><div className="shell stack-inner"><div><div className="eyebrow"><span className="eyebrow-line" /> BUILT WITH PURPOSE</div><h2>A modern stack.<br /><span>Practical engineering.</span></h2><p>Type-safe application code, a modular API, persistent data, and event-driven collaboration.</p></div><div className="stack-content"><div className="stack-chips">{stack.map((item) => <span key={item}>{item}</span>)}</div><div className="architecture-note"><div className="architecture-icon">⌘</div><div><b>One connected architecture</b><p>Next.js client · Express API · MongoDB persistence · Socket.IO events</p></div></div></div></div></section>

      <section className="closing-section shell" id="project"><div className="closing-panel"><div className="closing-decoration decoration-a" /><div className="closing-decoration decoration-b" /><div className="eyebrow"><span className="status-dot" /> THE PROJECT</div><h2>Make teamwork<br />feel <span>effortless.</span></h2><p>Collaborative Workspace is an ongoing full-stack project focused on shared documents, access control, and real-time team workflows.</p><a className="button button-light" href="https://github.com/MehtaabSingh25/Collaborative-Workspace" target="_blank" rel="noreferrer">View source on GitHub <ArrowIcon /></a><div className="closing-index">COLLABORATIVE WORKSPACE <span>— 2026</span></div></div></section>

      <footer className="footer shell"><a className="brand footer-brand" href="#top"><span className="brand-mark" aria-hidden="true"><span /><span /><span /><span /></span><span>collabspace<span className="brand-period">.</span></span></a><p>Built to bring good work together.</p><a href="https://github.com/MehtaabSingh25/Collaborative-Workspace" target="_blank" rel="noreferrer">GitHub ↗</a><span className="footer-copy">© 2026 Collaborative Workspace</span></footer>
    </main>
  );
}
