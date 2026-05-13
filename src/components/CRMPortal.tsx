import {useState, type ChangeEvent, type FormEvent} from 'react';
import {
  Bell,
  BriefcaseBusiness,
  CircleArrowUp,
  Files,
  FolderKanban,
  MessageSquareMore,
  Plus,
  Search,
  Send,
  Sparkles,
  Users,
} from 'lucide-react';

type Client = {
  id: string;
  name: string;
  company: string;
  email: string;
  tier: string;
  health: 'Strong' | 'Watch' | 'At risk';
  lead: string;
};

type Project = {
  id: string;
  clientId: string;
  name: string;
  stage: 'Discovery' | 'In progress' | 'Review' | 'Delivered';
  owner: string;
  progress: number;
  dueLabel: string;
  summary: string;
  nextStep: string;
};

type Proposal = {
  id: string;
  title: string;
  client: string;
  value: string;
  status: 'Draft' | 'Sent' | 'Negotiation';
  summary: string;
};

type UpdateItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
  tone: 'Internal' | 'Client' | 'Delivery';
};

type FileItem = {
  id: string;
  name: string;
  project: string;
  audience: string;
  uploadedAt: string;
};

type MessageItem = {
  id: string;
  sender: string;
  role: string;
  body: string;
  time: string;
};

const initialClients: Client[] = [
  {
    id: 'client-1',
    name: 'Maya Chen',
    company: 'Atelier North',
    email: 'maya@ateliernorth.com',
    tier: 'Strategic',
    health: 'Strong',
    lead: 'Ali Ahmed',
  },
  {
    id: 'client-2',
    name: 'Jordan Ellis',
    company: 'Field Theory Studio',
    email: 'jordan@fieldtheory.studio',
    tier: 'Growth',
    health: 'Watch',
    lead: 'Ali Ahmed',
  },
  {
    id: 'client-3',
    name: 'Nadia Rahal',
    company: 'Monograph House',
    email: 'nadia@monographhouse.co',
    tier: 'Advisory',
    health: 'Strong',
    lead: 'Ali Ahmed',
  },
];

const initialProjects: Project[] = [
  {
    id: 'project-1',
    clientId: 'client-1',
    name: 'Portfolio system redesign',
    stage: 'In progress',
    owner: 'Ali Ahmed',
    progress: 68,
    dueLabel: 'May 8',
    summary: 'Refining layout logic, visual hierarchy, and delivery views for a multi-page design portfolio.',
    nextStep: 'Send second-round homepage and project-detail mockups for review.',
  },
  {
    id: 'project-2',
    clientId: 'client-2',
    name: 'Creative proposal template suite',
    stage: 'Review',
    owner: 'Ali Ahmed',
    progress: 86,
    dueLabel: 'May 3',
    summary: 'Building reusable proposal structures, pricing tiers, and visual modules for new design engagements.',
    nextStep: 'Finalize cover direction and lock the presentation-ready scope deck.',
  },
  {
    id: 'project-3',
    clientId: 'client-3',
    name: 'Editorial site concept',
    stage: 'Discovery',
    owner: 'Ali Ahmed',
    progress: 24,
    dueLabel: 'May 18',
    summary: 'Defining tone, references, navigation, and motion principles for a new editorial brand site.',
    nextStep: 'Present moodboard and sitemap options before the first full comp.',
  },
];

const initialProposals: Proposal[] = [
  {
    id: 'proposal-1',
    title: 'Atelier North launch package',
    client: 'Atelier North',
    value: '$28,000',
    status: 'Sent',
    summary: 'Brand expression, responsive portfolio system, and content structure for launch.',
  },
  {
    id: 'proposal-2',
    title: 'Field Theory proposal refresh',
    client: 'Field Theory Studio',
    value: '$19,500',
    status: 'Negotiation',
    summary: 'New proposal language, cleaner pricing options, and a presentation-ready client deck.',
  },
];

const initialUpdates: UpdateItem[] = [
  {
    id: 'update-1',
    title: 'Homepage revision set is ready',
    detail: 'Updated hero direction, typography balance, and case-study ordering are bundled for review.',
    time: '10 min ago',
    tone: 'Delivery',
  },
  {
    id: 'update-2',
    title: 'Weekly design summary drafted',
    detail: 'Progress notes, pending approvals, and the next review checkpoint are ready to send to the client.',
    time: '42 min ago',
    tone: 'Client',
  },
  {
    id: 'update-3',
    title: 'Internal follow-up on visual references',
    detail: 'Need one decision on art direction before locking the final page composition set.',
    time: '1 hr ago',
    tone: 'Internal',
  },
];

const initialFiles: FileItem[] = [
  {
    id: 'file-1',
    name: 'atelier-north-round-2-review.pdf',
    project: 'Portfolio system redesign',
    audience: 'Client',
    uploadedAt: 'Today',
  },
  {
    id: 'file-2',
    name: 'field-theory-proposal-v3.pptx',
    project: 'Creative proposal template suite',
    audience: 'Internal',
    uploadedAt: 'Yesterday',
  },
];

const initialMessages: MessageItem[] = [
  {
    id: 'message-1',
    sender: 'Ali Ahmed',
    role: 'Lead',
    body: 'The second review package is assembled. Next I am tightening spacing, image rhythm, and the project narrative.',
    time: '9:14 AM',
  },
  {
    id: 'message-2',
    sender: 'Maya Chen',
    role: 'Client',
    body: 'Please keep the presentation minimal and include which layouts are final versus still under exploration.',
    time: '9:27 AM',
  },
];

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function CRMPortal() {
  const [section, setSection] = useState<'overview' | 'proposals' | 'projects' | 'clients' | 'inbox' | 'files'>('overview');
  const [clients, setClients] = useState(initialClients);
  const [projects, setProjects] = useState(initialProjects);
  const [proposals, setProposals] = useState(initialProposals);
  const [updates, setUpdates] = useState(initialUpdates);
  const [files, setFiles] = useState(initialFiles);
  const [messages, setMessages] = useState(initialMessages);
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjects[0]?.id ?? '');
  const [proposalDraft, setProposalDraft] = useState({
    client: 'Atelier North',
    title: '',
    value: '',
    summary: '',
  });
  const [projectDraft, setProjectDraft] = useState({
    clientId: initialClients[0]?.id ?? '',
    name: '',
    stage: 'Discovery' as Project['stage'],
    dueLabel: '',
    summary: '',
    nextStep: '',
  });
  const [clientDraft, setClientDraft] = useState({
    name: '',
    company: '',
    email: '',
    tier: 'Growth',
  });
  const [updateDraft, setUpdateDraft] = useState({
    title: '',
    detail: '',
    tone: 'Client' as UpdateItem['tone'],
  });
  const [messageDraft, setMessageDraft] = useState('');

  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? projects[0];
  const selectedClient = clients.find((client) => client.id === selectedProject?.clientId);

  const openProposalCount = proposals.filter((proposal) => proposal.status !== 'Sent').length;
  const activeProjectCount = projects.filter((project) => project.stage !== 'Delivered').length;
  const clientReadyFiles = files.filter((file) => file.audience === 'Client').length;

  function handleProposalSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!proposalDraft.title || !proposalDraft.summary || !proposalDraft.value) {
      return;
    }

    setProposals((current) => [
      {
        id: createId('proposal'),
        title: proposalDraft.title,
        client: proposalDraft.client,
        value: proposalDraft.value,
        status: 'Draft',
        summary: proposalDraft.summary,
      },
      ...current,
    ]);
    setUpdates((current) => [
      {
        id: createId('update'),
        title: `Proposal drafted for ${proposalDraft.client}`,
        detail: proposalDraft.summary,
        time: 'Just now',
        tone: 'Delivery',
      },
      ...current,
    ]);
    setProposalDraft({client: proposalDraft.client, title: '', value: '', summary: ''});
  }

  function handleProjectSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!projectDraft.clientId || !projectDraft.name || !projectDraft.summary) {
      return;
    }

    setProjects((current) => [
      {
        id: createId('project'),
        clientId: projectDraft.clientId,
        name: projectDraft.name,
        stage: projectDraft.stage,
        owner: 'Ali Ahmed',
        progress: 12,
        dueLabel: projectDraft.dueLabel || 'TBD',
        summary: projectDraft.summary,
        nextStep: projectDraft.nextStep || 'Define next milestone.',
      },
      ...current,
    ]);
    setProjectDraft({
      clientId: projectDraft.clientId,
      name: '',
      stage: 'Discovery',
      dueLabel: '',
      summary: '',
      nextStep: '',
    });
  }

  function handleClientSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!clientDraft.name || !clientDraft.company || !clientDraft.email) {
      return;
    }

    setClients((current) => [
      {
        id: createId('client'),
        name: clientDraft.name,
        company: clientDraft.company,
        email: clientDraft.email,
        tier: clientDraft.tier,
        health: 'Strong',
        lead: 'Ali Ahmed',
      },
      ...current,
    ]);
    setClientDraft({name: '', company: '', email: '', tier: 'Growth'});
  }

  function handleUpdateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!updateDraft.title || !updateDraft.detail) {
      return;
    }

    setUpdates((current) => [
      {
        id: createId('update'),
        title: updateDraft.title,
        detail: updateDraft.detail,
        time: 'Just now',
        tone: updateDraft.tone,
      },
      ...current,
    ]);
    setUpdateDraft({title: '', detail: '', tone: 'Client'});
  }

  function handleMessageSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!messageDraft.trim()) {
      return;
    }

    setMessages((current) => [
      ...current,
      {
        id: createId('message'),
        sender: 'Ali Ahmed',
        role: 'Lead',
        body: messageDraft.trim(),
        time: 'Just now',
      },
    ]);
    setMessageDraft('');
  }

  function handleFileAdd(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !selectedProject) {
      return;
    }

    setFiles((current) => [
      {
        id: createId('file'),
        name: file.name,
        project: selectedProject.name,
        audience: 'Client',
        uploadedAt: 'Just now',
      },
      ...current,
    ]);
    event.target.value = '';
  }

  const navItems = [
    {id: 'overview', label: 'Overview', icon: Sparkles},
    {id: 'proposals', label: 'Proposals', icon: BriefcaseBusiness},
    {id: 'projects', label: 'Projects', icon: FolderKanban},
    {id: 'clients', label: 'Clients', icon: Users},
    {id: 'inbox', label: 'Client updates', icon: MessageSquareMore},
    {id: 'files', label: 'Files', icon: Files},
  ] as const;

  return (
    <section className="crm-app-shell">
      <aside className="crm-sidebar">
        <div className="crm-brand">
          <div className="crm-brand-mark">A</div>
          <div>
            <p className="crm-brand-eyebrow">Ali Ahmed Co</p>
            <h1>Design Client Portal</h1>
          </div>
        </div>

        <nav className="crm-nav" aria-label="Portal sections">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={section === item.id ? 'is-active' : ''}
                onClick={() => setSection(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="crm-sidebar-card">
          <p className="crm-kicker">Workspace mode</p>
          <strong>Design review workspace</strong>
          <p>This portal is isolated from the public homepage and tuned for proposals, approvals, assets, and client communication.</p>
        </div>
      </aside>

      <div className="crm-main">
        <header className="crm-topbar">
          <div className="crm-search">
            <Search size={16} />
            <input value="" readOnly aria-label="Search workspace" placeholder="Search clients, proposals, files, and design updates" />
          </div>
          <div className="crm-topbar-actions">
            <button type="button" className="crm-ghost-button">
              <Bell size={16} />
              <span>3 reviews</span>
            </button>
            <div className="crm-user-pill">Ali Ahmed</div>
          </div>
        </header>

        <main className="crm-content">
          <section className="crm-hero-card">
            <div>
              <p className="crm-kicker">Studio workspace</p>
              <h2>Manage design proposals, active work, approvals, files, and client communication in one place.</h2>
            </div>
            <div className="crm-hero-meta">
              <div>
                <span>Open proposals</span>
                <strong>{openProposalCount}</strong>
              </div>
              <div>
                <span>Active projects</span>
                <strong>{activeProjectCount}</strong>
              </div>
              <div>
                <span>Client-ready files</span>
                <strong>{clientReadyFiles}</strong>
              </div>
            </div>
          </section>

          <section className="crm-stat-grid">
            <article className="crm-stat-card">
              <p className="crm-kicker">Pipeline</p>
              <strong>{proposals.length}</strong>
                <span>proposal drafts</span>
            </article>
            <article className="crm-stat-card">
              <p className="crm-kicker">Accounts</p>
              <strong>{clients.length}</strong>
                <span>client accounts</span>
            </article>
            <article className="crm-stat-card">
              <p className="crm-kicker">Engagement</p>
              <strong>{messages.length}</strong>
                <span>review messages</span>
            </article>
            <article className="crm-stat-card">
              <p className="crm-kicker">Delivery</p>
              <strong>{files.length}</strong>
                <span>shared files</span>
            </article>
          </section>

          {section === 'overview' ? (
            <section className="crm-grid crm-grid-overview">
              <article className="crm-panel">
                <div className="crm-panel-head">
                  <div>
                    <p className="crm-kicker">Recent activity</p>
                    <h3>What needs review now</h3>
                  </div>
                  <CircleArrowUp size={18} />
                </div>
                <div className="crm-timeline">
                  {updates.map((update) => (
                    <div key={update.id} className="crm-timeline-item">
                      <span className={`crm-tone crm-tone-${update.tone.toLowerCase()}`}>{update.tone}</span>
                      <div>
                        <strong>{update.title}</strong>
                        <p>{update.detail}</p>
                      </div>
                      <span>{update.time}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="crm-panel">
                <div className="crm-panel-head">
                  <div>
                    <p className="crm-kicker">Client pulse</p>
                    <h3>Active design clients</h3>
                  </div>
                  <Users size={18} />
                </div>
                <div className="crm-list">
                  {clients.map((client) => (
                    <div key={client.id} className="crm-list-row">
                      <div>
                        <strong>{client.company}</strong>
                        <p>{client.name} · {client.email}</p>
                      </div>
                      <div className="crm-row-meta">
                        <span>{client.tier}</span>
                        <span className={`crm-health crm-health-${client.health.toLowerCase().replace(' ', '-')}`}>{client.health}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          ) : null}

          {section === 'proposals' ? (
            <section className="crm-grid crm-grid-two-up">
              <article className="crm-panel">
                <div className="crm-panel-head">
                  <div>
                    <p className="crm-kicker">Proposal builder</p>
                    <h3>Create a new design proposal</h3>
                  </div>
                  <Plus size={18} />
                </div>
                <form className="crm-form" onSubmit={handleProposalSubmit}>
                  <select value={proposalDraft.client} onChange={(event) => setProposalDraft((current) => ({...current, client: event.target.value}))}>
                    {clients.map((client) => (
                      <option key={client.id} value={client.company}>{client.company}</option>
                    ))}
                  </select>
                  <input placeholder="Proposal title" value={proposalDraft.title} onChange={(event) => setProposalDraft((current) => ({...current, title: event.target.value}))} />
                  <input placeholder="Value" value={proposalDraft.value} onChange={(event) => setProposalDraft((current) => ({...current, value: event.target.value}))} />
                  <textarea placeholder="Scope, deliverables, timeline, and creative direction" value={proposalDraft.summary} onChange={(event) => setProposalDraft((current) => ({...current, summary: event.target.value}))} />
                  <button type="submit" className="crm-primary-button">Save proposal</button>
                </form>
              </article>

              <article className="crm-panel">
                <div className="crm-panel-head">
                  <div>
                    <p className="crm-kicker">Pipeline</p>
                    <h3>Proposal pipeline</h3>
                  </div>
                  <BriefcaseBusiness size={18} />
                </div>
                <div className="crm-card-stack">
                  {proposals.map((proposal) => (
                    <article key={proposal.id} className="crm-proposal-card">
                      <div className="crm-proposal-topline">
                        <strong>{proposal.title}</strong>
                        <span>{proposal.status}</span>
                      </div>
                      <p>{proposal.client} · {proposal.value}</p>
                      <p>{proposal.summary}</p>
                    </article>
                  ))}
                </div>
              </article>
            </section>
          ) : null}

          {section === 'projects' ? (
            <section className="crm-grid crm-grid-two-up">
              <article className="crm-panel">
                <div className="crm-panel-head">
                  <div>
                    <p className="crm-kicker">Project board</p>
                    <h3>Create and track design projects</h3>
                  </div>
                  <FolderKanban size={18} />
                </div>
                <form className="crm-form" onSubmit={handleProjectSubmit}>
                  <select value={projectDraft.clientId} onChange={(event) => setProjectDraft((current) => ({...current, clientId: event.target.value}))}>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>{client.company}</option>
                    ))}
                  </select>
                  <input placeholder="Project name" value={projectDraft.name} onChange={(event) => setProjectDraft((current) => ({...current, name: event.target.value}))} />
                  <select value={projectDraft.stage} onChange={(event) => setProjectDraft((current) => ({...current, stage: event.target.value as Project['stage']}))}>
                    <option value="Discovery">Discovery</option>
                    <option value="In progress">In progress</option>
                    <option value="Review">Review</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                  <input placeholder="Due label" value={projectDraft.dueLabel} onChange={(event) => setProjectDraft((current) => ({...current, dueLabel: event.target.value}))} />
                  <textarea placeholder="Project summary, scope, and design goals" value={projectDraft.summary} onChange={(event) => setProjectDraft((current) => ({...current, summary: event.target.value}))} />
                  <textarea placeholder="Next review step or approval needed" value={projectDraft.nextStep} onChange={(event) => setProjectDraft((current) => ({...current, nextStep: event.target.value}))} />
                  <button type="submit" className="crm-primary-button">Create project</button>
                </form>
              </article>

              <article className="crm-panel">
                <div className="crm-panel-head">
                  <div>
                    <p className="crm-kicker">Execution</p>
                    <h3>Live project board</h3>
                  </div>
                  <BriefcaseBusiness size={18} />
                </div>
                <div className="crm-card-stack">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      className={`crm-project-card ${selectedProjectId === project.id ? 'is-selected' : ''}`}
                      onClick={() => setSelectedProjectId(project.id)}
                    >
                      <div className="crm-proposal-topline">
                        <strong>{project.name}</strong>
                        <span>{project.stage}</span>
                      </div>
                      <p>{project.summary}</p>
                      <div className="crm-progress-row">
                        <div className="crm-progress-track">
                          <span style={{width: `${project.progress}%`}} />
                        </div>
                        <small>{project.progress}%</small>
                      </div>
                    </button>
                  ))}
                </div>
              </article>
            </section>
          ) : null}

          {section === 'clients' ? (
            <section className="crm-grid crm-grid-two-up">
              <article className="crm-panel">
                <div className="crm-panel-head">
                  <div>
                    <p className="crm-kicker">Client registry</p>
                    <h3>Add or manage client accounts</h3>
                  </div>
                  <Users size={18} />
                </div>
                <form className="crm-form" onSubmit={handleClientSubmit}>
                  <input placeholder="Primary contact" value={clientDraft.name} onChange={(event) => setClientDraft((current) => ({...current, name: event.target.value}))} />
                  <input placeholder="Company" value={clientDraft.company} onChange={(event) => setClientDraft((current) => ({...current, company: event.target.value}))} />
                  <input placeholder="Email" value={clientDraft.email} onChange={(event) => setClientDraft((current) => ({...current, email: event.target.value}))} />
                  <select value={clientDraft.tier} onChange={(event) => setClientDraft((current) => ({...current, tier: event.target.value}))}>
                    <option value="Strategic">Strategic</option>
                    <option value="Growth">Growth</option>
                    <option value="Advisory">Advisory</option>
                  </select>
                  <button type="submit" className="crm-primary-button">Add client</button>
                </form>
              </article>

              <article className="crm-panel">
                <div className="crm-panel-head">
                  <div>
                    <p className="crm-kicker">Relationship map</p>
                    <h3>Contacts and relationship health</h3>
                  </div>
                  <Users size={18} />
                </div>
                <div className="crm-list">
                  {clients.map((client) => (
                    <div key={client.id} className="crm-list-row">
                      <div>
                        <strong>{client.name}</strong>
                        <p>{client.company} · {client.lead}</p>
                      </div>
                      <div className="crm-row-meta">
                        <span>{client.tier}</span>
                        <span className={`crm-health crm-health-${client.health.toLowerCase().replace(' ', '-')}`}>{client.health}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          ) : null}

          {section === 'inbox' ? (
            <section className="crm-grid crm-grid-two-up">
              <article className="crm-panel">
                <div className="crm-panel-head">
                  <div>
                    <p className="crm-kicker">Client updates</p>
                    <h3>Draft updates and review notes</h3>
                  </div>
                  <MessageSquareMore size={18} />
                </div>
                <form className="crm-form" onSubmit={handleUpdateSubmit}>
                  <input placeholder="Update title" value={updateDraft.title} onChange={(event) => setUpdateDraft((current) => ({...current, title: event.target.value}))} />
                  <select value={updateDraft.tone} onChange={(event) => setUpdateDraft((current) => ({...current, tone: event.target.value as UpdateItem['tone']}))}>
                    <option value="Client">Client</option>
                    <option value="Internal">Internal</option>
                    <option value="Delivery">Delivery</option>
                  </select>
                  <textarea placeholder="Share design progress, approvals needed, blockers, or delivery notes" value={updateDraft.detail} onChange={(event) => setUpdateDraft((current) => ({...current, detail: event.target.value}))} />
                  <button type="submit" className="crm-primary-button">Publish update</button>
                </form>
              </article>

              <article className="crm-panel">
                <div className="crm-panel-head">
                  <div>
                    <p className="crm-kicker">Conversation</p>
                    <h3>{selectedClient?.company || 'Client thread'}</h3>
                  </div>
                  <Send size={18} />
                </div>
                <div className="crm-message-stack">
                  {messages.map((message) => (
                    <article key={message.id} className="crm-message-card">
                      <div className="crm-proposal-topline">
                        <strong>{message.sender}</strong>
                        <span>{message.time}</span>
                      </div>
                      <p>{message.role}</p>
                      <p>{message.body}</p>
                    </article>
                  ))}
                </div>
                <form className="crm-inline-compose" onSubmit={handleMessageSubmit}>
                  <textarea placeholder="Write a client-facing update, feedback response, or internal note" value={messageDraft} onChange={(event) => setMessageDraft(event.target.value)} />
                  <button type="submit" className="crm-primary-button">Send</button>
                </form>
              </article>
            </section>
          ) : null}

          {section === 'files' ? (
            <section className="crm-grid crm-grid-two-up">
              <article className="crm-panel">
                <div className="crm-panel-head">
                  <div>
                    <p className="crm-kicker">Delivery assets</p>
                    <h3>Upload deliverables for the selected project</h3>
                  </div>
                  <Files size={18} />
                </div>
                <div className="crm-form">
                  <select value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)}>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                  <label className="crm-file-drop">
                    <input type="file" onChange={handleFileAdd} />
                    <span>Choose file</span>
                    <small>Add a design review, proposal deck, export, or delivery package.</small>
                  </label>
                  {selectedProject ? (
                    <div className="crm-context-card">
                      <p className="crm-kicker">Selected project</p>
                      <strong>{selectedProject.name}</strong>
                      <p>{selectedProject.nextStep}</p>
                    </div>
                  ) : null}
                </div>
              </article>

              <article className="crm-panel">
                <div className="crm-panel-head">
                  <div>
                    <p className="crm-kicker">File room</p>
                    <h3>Shared file room</h3>
                  </div>
                  <Files size={18} />
                </div>
                <div className="crm-list">
                  {files.map((file) => (
                    <div key={file.id} className="crm-list-row">
                      <div>
                        <strong>{file.name}</strong>
                        <p>{file.project}</p>
                      </div>
                      <div className="crm-row-meta">
                        <span>{file.audience}</span>
                        <span>{file.uploadedAt}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          ) : null}
        </main>
      </div>
    </section>
  );
}
