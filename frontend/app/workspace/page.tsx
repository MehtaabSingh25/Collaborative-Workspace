"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import "./workspace.css";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

type User = { id: string; name: string; email: string };
type Workspace = { _id: string; name: string; description?: string; updatedAt?: string };
type WorkspaceMembership = { role: "OWNER" | "EDITOR" | "VIEWER"; workspace: Workspace };
type WorkspaceDocument = { _id: string; title: string; version: number; updatedAt?: string; lastEditedBy?: { name?: string } };
type DocumentDetail = WorkspaceDocument & { content: string };
type ApiResult<T> = { success: boolean; data: T; message?: string };

async function request<T>(path: string, token: string | null, init: RequestInit = {}): Promise<ApiResult<T>> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || `Request failed (${response.status})`);
  return payload as ApiResult<T>;
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "U";
}

export default function WorkspacePage() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [workspaces, setWorkspaces] = useState<WorkspaceMembership[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState("");
  const [documents, setDocuments] = useState<WorkspaceDocument[]>([]);
  const [activeDocument, setActiveDocument] = useState<DocumentDetail | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceDescription, setWorkspaceDescription] = useState("");
  const [documentTitle, setDocumentTitle] = useState("");
  const [showWorkspaceForm, setShowWorkspaceForm] = useState(false);
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const activeMembership = useMemo(() => workspaces.find((item) => item.workspace._id === activeWorkspaceId), [workspaces, activeWorkspaceId]);
  const canEdit = activeMembership?.role === "OWNER" || activeMembership?.role === "EDITOR";

  const loadWorkspaces = useCallback(async (accessToken: string) => {
    const result = await request<WorkspaceMembership[]>("/api/workspaces", accessToken);
    const list = Array.isArray(result.data) ? result.data : [];
    setWorkspaces(list);
    setActiveWorkspaceId((current) => list.some((item) => item.workspace._id === current) ? current : list[0]?.workspace._id || "");
  }, []);

  const establishSession = useCallback(async (accessToken: string) => {
    const result = await request<User>("/api/auth/me", accessToken);
    setToken(accessToken);
    setUser(result.data);
    await loadWorkspaces(accessToken);
  }, [loadWorkspaces]);

  useEffect(() => {
    let mounted = true;
    async function restoreSession() {
      try {
        const refreshed = await request<{ accessToken: string }>("/api/auth/refresh", null, { method: "POST" });
        if (!mounted) return;
        const me = await request<User>("/api/auth/me", refreshed.data.accessToken);
        if (!mounted) return;
        setToken(refreshed.data.accessToken);
        setUser(me.data);
        const workspaceResult = await request<WorkspaceMembership[]>("/api/workspaces", refreshed.data.accessToken);
        if (!mounted) return;
        const list = Array.isArray(workspaceResult.data) ? workspaceResult.data : [];
        setWorkspaces(list);
        setActiveWorkspaceId(list[0]?.workspace._id || "");
      } catch {
        // A missing refresh cookie simply means the user needs to sign in.
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void restoreSession();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!token || !activeWorkspaceId) return;
    let cancelled = false;
    async function loadDocuments() {
      setError("");
      try {
        const result = await request<WorkspaceDocument[]>(`/api/workspaces/${activeWorkspaceId}/documents`, token);
        if (!cancelled) setDocuments(Array.isArray(result.data) ? result.data : []);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Could not load documents.");
      }
    }
    void loadDocuments();
    return () => { cancelled = true; };
  }, [token, activeWorkspaceId]);

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      if (authMode === "register") {
        await request<unknown>("/api/auth/register", null, { method: "POST", body: JSON.stringify({ name: authName, email: authEmail, password: authPassword }) });
      }
      const login = await request<{ accessToken: string; user: User }>("/api/auth/login", null, { method: "POST", body: JSON.stringify({ email: authEmail, password: authPassword }) });
      await establishSession(login.data.accessToken);
      setNotice(authMode === "register" ? "Account created. Welcome to your workspace." : "You are signed in.");
      setAuthPassword("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Authentication failed.");
    } finally { setBusy(false); }
  }

  async function createWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!token) return;
    setBusy(true); setError("");
    try {
      await request<Workspace>("/api/workspaces", token, { method: "POST", body: JSON.stringify({ name: workspaceName, description: workspaceDescription }) });
      await loadWorkspaces(token);
      setWorkspaceName(""); setWorkspaceDescription(""); setShowWorkspaceForm(false); setNotice("Workspace created successfully.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create workspace."); }
    finally { setBusy(false); }
  }

  async function createDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!token || !activeWorkspaceId) return;
    setBusy(true); setError("");
    try {
      const created = await request<DocumentDetail>(`/api/workspaces/${activeWorkspaceId}/documents`, token, { method: "POST", body: JSON.stringify({ title: documentTitle, content: "" }) });
      setDocuments((current) => [created.data, ...current]);
      setActiveDocument(created.data); setDraftTitle(created.data.title); setDraftContent(created.data.content || "");
      setDocumentTitle(""); setShowDocumentForm(false); setNotice("Document created.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create document."); }
    finally { setBusy(false); }
  }

  async function openDocument(document: WorkspaceDocument) {
    if (!token || !activeWorkspaceId) return;
    setBusy(true); setError("");
    try {
      const result = await request<DocumentDetail>(`/api/workspaces/${activeWorkspaceId}/documents/${document._id}`, token);
      setActiveDocument(result.data); setDraftTitle(result.data.title); setDraftContent(result.data.content || "");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not open document."); }
    finally { setBusy(false); }
  }

  async function saveDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!token || !activeWorkspaceId || !activeDocument || !canEdit) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await request<DocumentDetail>(`/api/workspaces/${activeWorkspaceId}/documents/${activeDocument._id}`, token, {
        method: "PATCH", body: JSON.stringify({ title: draftTitle, content: draftContent, expectedVersion: activeDocument.version }),
      });
      setActiveDocument(result.data); setDraftTitle(result.data.title); setDraftContent(result.data.content);
      setDocuments((current) => [result.data, ...current.filter((item) => item._id !== result.data._id)]);
      setNotice(`Saved as version ${result.data.version}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save document. If another collaborator updated it, reopen the document and try again.");
    } finally { setBusy(false); }
  }

  async function logout() {
    try { await request<unknown>("/api/auth/logout", token, { method: "POST" }); } catch { /* Clear local session even if the API is unavailable. */ }
    setToken(null); setUser(null); setWorkspaces([]); setActiveWorkspaceId(""); setDocuments([]); setActiveDocument(null); setNotice("You have been signed out.");
  }

  if (loading) return <main className="app-loading"><div className="loading-mark">C</div><p>Preparing your workspace…</p></main>;

  if (!user) return (
    <main className="auth-shell">
      <Link className="app-brand" href="/"><span className="app-brand-mark">C</span> collabspace<span className="brand-period">.</span></Link>
      <section className="auth-card">
        <div className="app-eyebrow"><span /> YOUR TEAM, IN SYNC</div>
        <h1>{authMode === "login" ? "Welcome back." : "Make room for great work."}</h1>
        <p className="auth-subtitle">{authMode === "login" ? "Sign in to pick up where your team left off." : "Create an account to start organizing work together."}</p>
        <form className="app-form" onSubmit={handleAuth}>
          {authMode === "register" && <label>Full name<input value={authName} onChange={(event) => setAuthName(event.target.value)} minLength={3} maxLength={80} autoComplete="name" required placeholder="Your name" /></label>}
          <label>Email address<input type="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} autoComplete="email" required placeholder="you@example.com" /></label>
          <label>Password<input type="password" value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} minLength={authMode === "register" ? 8 : 1} maxLength={128} autoComplete={authMode === "login" ? "current-password" : "new-password"} required placeholder="At least 8 characters" /></label>
          {error && <p className="app-alert app-alert-error" role="alert">{error}</p>}
          <button className="app-button app-button-primary app-button-wide" disabled={busy}>{busy ? "Please wait…" : authMode === "login" ? "Sign in" : "Create account"}<span>↗</span></button>
        </form>
        <p className="auth-switch">{authMode === "login" ? "New to collabspace?" : "Already have an account?"} <button onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setError(""); }}>{authMode === "login" ? "Create an account" : "Sign in"}</button></p>
        <p className="auth-footnote">Your session uses an API access token and an HTTP-only refresh cookie.</p>
      </section>
      <Link className="back-home" href="/">← Back to product overview</Link>
    </main>
  );

  return (
    <main className="workspace-app">
      <aside className="app-sidebar">
        <Link className="app-brand" href="/"><span className="app-brand-mark">C</span> collabspace<span className="brand-period">.</span></Link>
        <div className="sidebar-section-label">YOUR WORKSPACE</div>
        <div className="sidebar-section-heading"><span>Workspaces</span><button aria-label="Create workspace" title="Create workspace" onClick={() => setShowWorkspaceForm((value) => !value)}>＋</button></div>
        <div className="workspace-nav-list">
          {workspaces.map((item) => <button key={item.workspace._id} className={`workspace-nav-item ${item.workspace._id === activeWorkspaceId ? "selected" : ""}`} onClick={() => { setActiveWorkspaceId(item.workspace._id); setActiveDocument(null); }}><span className="workspace-glyph">{item.workspace.name.slice(0, 1).toUpperCase()}</span><span className="workspace-nav-name">{item.workspace.name}<small>{item.role.toLowerCase()}</small></span>{item.workspace._id === activeWorkspaceId && <span className="selected-dot" />}</button>)}
          {!workspaces.length && <p className="sidebar-empty">Your workspaces will appear here.</p>}
        </div>
        <div className="sidebar-bottom"><div className="user-avatar">{initials(user.name)}</div><div className="sidebar-user"><strong>{user.name}</strong><span>{user.email}</span></div><button className="logout-button" onClick={() => void logout()} title="Sign out" aria-label="Sign out">↪</button></div>
      </aside>

      <section className="app-main">
        <header className="app-topbar"><div><span className="topbar-label">WORKSPACE / </span><strong>{activeMembership?.workspace.name || "Overview"}</strong></div><div className="topbar-right"><span className="secure-indicator"><i /> Session active</span><div className="user-avatar small-avatar">{initials(user.name)}</div></div></header>
        <div className="app-content">
          {error && <div className="app-alert app-alert-error app-alert-banner" role="alert"><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss error">×</button></div>}
          {notice && <div className="app-alert app-alert-success app-alert-banner" role="status"><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss notice">×</button></div>}

          {showWorkspaceForm && <form className="inline-create-card" onSubmit={createWorkspace}><div><strong>Create a workspace</strong><p>A shared home for a project or team.</p></div><label>Workspace name<input value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} minLength={3} maxLength={100} required placeholder="e.g. Product team" /></label><label>Description <span>(optional)</span><input value={workspaceDescription} onChange={(event) => setWorkspaceDescription(event.target.value)} maxLength={500} placeholder="What is this workspace for?" /></label><div className="inline-form-actions"><button type="button" className="app-button app-button-quiet" onClick={() => setShowWorkspaceForm(false)}>Cancel</button><button className="app-button app-button-primary" disabled={busy}>{busy ? "Creating…" : "Create workspace"}</button></div></form>}

          {!activeMembership ? (
            <div className="empty-state large-empty"><div className="empty-icon">▦</div><div className="app-eyebrow"><span /> A CLEAR SPACE TO START</div><h1>Make work happen<br /><em>together.</em></h1><p>Create your first workspace to bring documents, decisions, and teammates into one organized place.</p><button className="app-button app-button-primary" onClick={() => setShowWorkspaceForm(true)}>＋ Create your first workspace</button></div>
          ) : (
            <>
              <div className="dashboard-heading"><div><div className="app-eyebrow"><span /> TEAM SPACE</div><h1>{activeMembership.workspace.name}<span className="role-pill">{activeMembership.role.toLowerCase()}</span></h1><p>{activeMembership.workspace.description || "Keep your team's working documents in one place."}</p></div><div className="dashboard-actions">{canEdit && <button className="app-button app-button-primary" onClick={() => setShowDocumentForm((value) => !value)}>＋ New document</button>}</div></div>
              <div className="stats-row"><div className="stat-card"><span className="stat-icon">▤</span><div><strong>{documents.length.toString().padStart(2, "0")}</strong><span>Documents</span></div></div><div className="stat-card"><span className="stat-icon green-icon">⌘</span><div><strong>{activeMembership.role === "OWNER" ? "Full" : activeMembership.role === "EDITOR" ? "Edit" : "Read"}</strong><span>Your access</span></div></div><div className="stat-card"><span className="stat-icon amber-icon">◷</span><div><strong>Versioned</strong><span>Document history</span></div></div></div>

              {showDocumentForm && <form className="inline-create-card document-create-card" onSubmit={createDocument}><div><strong>Create a document</strong><p>Start a shared document in this workspace.</p></div><label>Document title<input value={documentTitle} onChange={(event) => setDocumentTitle(event.target.value)} minLength={1} maxLength={200} required autoFocus placeholder="e.g. Sprint planning notes" /></label><div className="inline-form-actions"><button type="button" className="app-button app-button-quiet" onClick={() => setShowDocumentForm(false)}>Cancel</button><button className="app-button app-button-primary" disabled={busy}>{busy ? "Creating…" : "Create document"}</button></div></form>}

              <div className={`document-area ${activeDocument ? "has-editor" : ""}`}>
                <section className="document-list-panel"><div className="panel-heading"><div><h2>Documents</h2><p>Shared files in this workspace</p></div><span className="count-pill">{documents.length}</span></div>
                  {documents.length ? <div className="document-list">{documents.map((document) => <button key={document._id} className={`document-row ${activeDocument?._id === document._id ? "active-document" : ""}`} onClick={() => void openDocument(document)}><span className="document-file-icon">▤</span><span className="document-row-copy"><strong>{document.title}</strong><small>Version {document.version} · {document.lastEditedBy?.name || "Workspace member"}</small></span><span className="document-row-arrow">↗</span></button>)}</div> : <div className="empty-state compact-empty"><div className="empty-icon">▤</div><strong>No documents yet</strong><p>Create the first document to start capturing your team&apos;s work.</p>{canEdit && <button className="app-button app-button-secondary" onClick={() => setShowDocumentForm(true)}>Create document</button>}</div>}
                </section>

                <section className="editor-panel">{activeDocument ? <form className="document-editor" onSubmit={saveDocument}><div className="editor-toolbar"><span className="editor-status"><i /> DOCUMENT EDITOR</span><span className="version-label">v{activeDocument.version}</span></div><label className="editor-title-label" htmlFor="document-title">Document title</label><input id="document-title" className="editor-title-input" value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} maxLength={200} disabled={!canEdit} required /><div className="editor-meta">Last saved version {activeDocument.version} <span>·</span> Changes are saved when you select Save changes</div><label className="editor-title-label content-label" htmlFor="document-content">Content</label><textarea id="document-content" className="editor-content-input" value={draftContent} onChange={(event) => setDraftContent(event.target.value)} maxLength={500000} disabled={!canEdit} placeholder={canEdit ? "Start writing your team's ideas, plans, and decisions…" : "You have read-only access to this document."} /><div className="editor-footer"><span>{draftContent.length.toLocaleString()} characters</span>{canEdit ? <button className="app-button app-button-primary" disabled={busy || (draftTitle === activeDocument.title && draftContent === activeDocument.content)}>{busy ? "Saving…" : "Save changes ↗"}</button> : <span className="read-only-note">Read-only access</span>}</div></form> : <div className="editor-placeholder"><div className="placeholder-art"><span>▤</span><i>✳</i><b>✎</b></div><h2>Your next great idea<br /><em>starts here.</em></h2><p>Select a document to read or edit it. Your changes create versioned updates through the workspace API.</p><div className="placeholder-points"><span>✓ Role-aware permissions</span><span>✓ Version-checked saves</span><span>✓ Shared workspace documents</span></div></div>}</section>
              </div>
            </>
          )}
          <footer className="app-footer"><span>collabspace<span className="brand-period">.</span></span><span>Built for thoughtful collaboration</span><Link href="/">Product overview ↗</Link></footer>
        </div>
      </section>
    </main>
  );
}
