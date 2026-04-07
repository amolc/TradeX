import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const S = {
  shell: { display: 'grid', gap: 24 },
  hero: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 26,
    padding: 28,
    border: '1px solid rgba(191,219,254,.9)',
    background:
      'linear-gradient(135deg, rgba(255,255,255,.98), rgba(239,246,255,.96) 46%, rgba(224,242,254,.94))',
    boxShadow: '0 22px 54px rgba(15,23,42,.08)',
  },
  glowA: {
    position: 'absolute',
    top: -100,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 999,
    background: 'rgba(37,99,235,.16)',
  },
  glowB: {
    position: 'absolute',
    bottom: -100,
    left: -50,
    width: 180,
    height: 180,
    borderRadius: 999,
    background: 'rgba(20,184,166,.12)',
  },
  heroContent: { position: 'relative', zIndex: 1, display: 'grid', gap: 22 },
  heroGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 20,
    alignItems: 'center',
  },
  eyebrow: {
    margin: 0,
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: '.18em',
    textTransform: 'uppercase',
    color: '#2563eb',
  },
  title: {
    margin: '12px 0',
    fontSize: 'clamp(2rem, 4vw, 3.2rem)',
    lineHeight: 1.02,
    color: '#0f172a',
  },
  text: { margin: 0, color: '#475569', lineHeight: 1.72 },
  ctas: { display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 22 },
  primary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 48,
    padding: '0 18px',
    borderRadius: 14,
    fontWeight: 700,
    color: '#fff',
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    boxShadow: '0 16px 30px rgba(37,99,235,.18)',
  },
  secondary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 48,
    padding: '0 18px',
    borderRadius: 14,
    fontWeight: 700,
    color: '#0f172a',
    background: 'rgba(255,255,255,.78)',
    border: '1px solid rgba(148,163,184,.25)',
  },
  card: {
    borderRadius: 22,
    border: '1px solid rgba(226,232,240,.95)',
    background: 'rgba(255,255,255,.9)',
    boxShadow: '0 18px 40px rgba(15,23,42,.06)',
  },
  darkCard: {
    padding: 20,
    display: 'grid',
    gap: 16,
    color: '#e2e8f0',
    background: 'linear-gradient(155deg, rgba(15,23,42,.98), rgba(30,41,59,.95))',
  },
  metricGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 },
  metric: {
    padding: 14,
    borderRadius: 16,
    border: '1px solid rgba(148,163,184,.16)',
    background: 'rgba(255,255,255,.06)',
  },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 },
  section: { padding: 22 },
  sectionGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 },
  item: {
    padding: 18,
    borderRadius: 18,
    border: '1px solid rgba(226,232,240,.9)',
    background: '#f8fafc',
    display: 'grid',
    gap: 14,
  },
  split: { display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(280px, .9fr)', gap: 24 },
  list: { display: 'grid', gap: 12, marginTop: 18 },
  row: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 16,
    border: '1px solid rgba(226,232,240,.9)',
    background: '#f8fafc',
  },
}

const badge = (bg, color) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 10px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  background: bg,
  color,
})

const tones = {
  blue: { background: 'rgba(219,234,254,.95)', color: '#2563eb' },
  emerald: { background: 'rgba(209,250,229,.95)', color: '#059669' },
  amber: { background: 'rgba(254,243,199,.95)', color: '#d97706' },
  violet: { background: 'rgba(237,233,254,.95)', color: '#7c3aed' },
}

function IconWrap({ children, tone = 'blue' }) {
  return (
    <span
      style={{
        width: 42,
        height: 42,
        borderRadius: 14,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...tones[tone],
      }}
    >
      {children}
    </span>
  )
}

function MarketCard({ title, text, tone, icon }) {
  return (
    <article style={S.item}>
      <IconWrap tone={tone}>{icon}</IconWrap>
      <div>
        <h3 style={{ margin: 0, color: '#0f172a' }}>{title}</h3>
        <p style={{ margin: '8px 0 0', color: '#475569', lineHeight: 1.62 }}>{text}</p>
      </div>
    </article>
  )
}

function SectionHead({ title, text, action }) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
        alignItems: 'flex-start',
      }}
    >
      <div>
        <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>{title}</h2>
        <p style={{ margin: '6px 0 0', color: '#64748b', lineHeight: 1.6 }}>{text}</p>
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  )
}

function MarketplacePage() {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate replace to="/dashboard" />
  }

  const highlights = [
    { label: 'Verified suppliers', value: '1,200+' },
    { label: 'Trade corridors', value: '18' },
    { label: 'Shipment visibility', value: '24/7' },
    { label: 'Buyer response SLA', value: '< 2 hrs' },
  ]

  const platformAreas = [
    {
      title: 'Buyer Flow',
      text: 'Discover products, compare suppliers, send enquiries, place orders, and track every shipment milestone.',
      tone: 'blue',
      icon: <CubeIcon />,
    },
    {
      title: 'Supplier Flow',
      text: 'Publish listings, receive qualified enquiries, confirm orders, and keep dispatch activity visible.',
      tone: 'emerald',
      icon: <FactoryIcon />,
    },
    {
      title: 'Logistics Oversight',
      text: 'Coordinate air and sea movement with operational transparency from pickup to final delivery.',
      tone: 'violet',
      icon: <TruckIcon />,
    },
    {
      title: 'Marketplace Trust',
      text: 'Operate with verified partners, secure transactions, and real-time cross-border trade coordination.',
      tone: 'amber',
      icon: <ShieldIcon />,
    },
  ]

  const trustRows = [
    {
      id: 1,
      title: 'Verified supplier onboarding',
      text: 'Compliance checks and profile validation help buyers move faster with more confidence.',
      tone: 'emerald',
      icon: <ShieldIcon />,
    },
    {
      id: 2,
      title: 'Real-time shipment tracking',
      text: 'Give teams a shared view of dispatch, transit, customs, and delivery status.',
      tone: 'blue',
      icon: <RadarIcon />,
    },
    {
      id: 3,
      title: 'Built for Asia trade lanes',
      text: 'Designed for multi-country sourcing, warehousing, and regional logistics execution.',
      tone: 'violet',
      icon: <GlobeIcon />,
    },
  ]

  const quickStarts = [
    {
      id: 1,
      title: 'Create Account',
      text: 'Join as a buyer or supplier and enter the marketplace with your preferred role.',
      to: '/register',
      primary: true,
      icon: <ArrowRightIcon />,
    },
    {
      id: 2,
      title: 'Login',
      text: 'Resume active enquiries, orders, and shipment workflows from your dashboard.',
      to: '/login',
      icon: <LoginIcon />,
    },
  ]

  return (
    <section className="page-card" style={S.shell}>
      <div style={S.hero}>
        <div style={S.glowA} />
        <div style={S.glowB} />
        <div style={S.heroContent}>
          <div style={S.heroGrid}>
            <div>
              <p style={S.eyebrow}>Asia B2B Logistics Marketplace</p>
              <h1 style={S.title}>TradeX Asia Marketplace</h1>
              <p style={S.text}>
                Connect buyers and suppliers across Asia with one marketplace for sourcing,
                enquiries, order execution, and shipment visibility.
              </p>
              <p style={{ ...S.text, marginTop: 12 }}>
                Built for real trade workflows, not demo screens, with operational clarity at
                every stage from first enquiry to final delivery.
              </p>
              <div style={S.ctas}>
                <Link to="/register" style={S.primary}>
                  <ArrowRightIcon />
                  Get Started
                </Link>
                <Link to="/login" style={S.secondary}>
                  <LoginIcon />
                  Sign In
                </Link>
              </div>
            </div>

            <div style={{ ...S.card, ...S.darkCard }}>
              <div>
                <span style={badge('rgba(37,99,235,.16)', '#93c5fd')}>TradeX overview</span>
                <h2 style={{ margin: '14px 0 8px', fontSize: '1.35rem', color: '#fff' }}>
                  One place to source, transact, and move goods
                </h2>
                <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.7 }}>
                  Turn fragmented trade operations into a single connected workflow for buyers,
                  suppliers, and logistics coordination teams.
                </p>
              </div>
              <div style={S.metricGrid}>
                {highlights.map((item) => (
                  <div key={item.label} style={S.metric}>
                    <div style={{ color: '#93c5fd', fontSize: '.82rem' }}>{item.label}</div>
                    <div style={{ marginTop: 6, fontSize: '1.45rem', fontWeight: 800 }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={S.stats}>
            {quickStarts.map((item) => (
              <Link
                key={item.id}
                to={item.to}
                style={{
                  ...S.card,
                  padding: 18,
                  display: 'grid',
                  gap: 14,
                  background: item.primary
                    ? 'linear-gradient(135deg, rgba(239,246,255,.98), rgba(219,234,254,.92))'
                    : 'rgba(255,255,255,.88)',
                }}
              >
                <IconWrap tone={item.primary ? 'blue' : 'amber'}>{item.icon}</IconWrap>
                <div>
                  <h3 style={{ margin: 0, color: '#0f172a' }}>{item.title}</h3>
                  <p style={{ margin: '8px 0 0', color: '#475569', lineHeight: 1.6 }}>{item.text}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div style={{ ...S.card, ...S.section }}>
        <SectionHead
          title="Platform Capabilities"
          text="A sharper landing experience that immediately shows how the marketplace works for real teams."
        />
        <div style={{ ...S.sectionGrid, marginTop: 18 }}>
          {platformAreas.map((item) => (
            <MarketCard key={item.title} title={item.title} text={item.text} tone={item.tone} icon={item.icon} />
          ))}
        </div>
      </div>

      <div style={S.split}>
        <div style={{ ...S.card, ...S.section }}>
          <SectionHead
            title="Why teams choose TradeX"
            text="Trade-focused workflows designed for speed, trust, and cross-border operational visibility."
          />
          <div style={S.list}>
            {trustRows.map((item) => (
              <div key={item.id} style={S.row}>
                <IconWrap tone={item.tone}>{item.icon}</IconWrap>
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.title}</div>
                  <p style={{ margin: '6px 0 0', color: '#475569', lineHeight: 1.6 }}>{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside
          style={{
            ...S.card,
            ...S.section,
            background: 'linear-gradient(180deg, rgba(15,23,42,.98), rgba(30,41,59,.97))',
            color: '#e2e8f0',
          }}
        >
          <p style={{ ...S.eyebrow, color: '#93c5fd' }}>Ready to enter</p>
          <h3 style={{ margin: '10px 0 8px', fontSize: '1.35rem', color: '#fff' }}>
            Start your next trade workflow with momentum
          </h3>
          <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.7 }}>
            Whether you are sourcing inventory or responding to buyer demand, TradeX gives you a
            clearer path from marketplace discovery to shipment completion.
          </p>
          <div style={{ display: 'grid', gap: 12, marginTop: 18 }}>
            <Link to="/register" style={S.primary}>
              <ArrowRightIcon />
              Create Account
            </Link>
            <Link to="/login" style={S.secondary}>
              <LoginIcon />
              Continue to Login
            </Link>
          </div>
        </aside>
      </div>
    </section>
  )
}

function SvgIcon({ children, size = 18 }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      width={size}
    >
      {children}
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <SvgIcon>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </SvgIcon>
  )
}

function LoginIcon() {
  return (
    <SvgIcon>
      <path d="M10 17v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2" />
      <path d="M21 12H9" />
      <path d="m16 7 5 5-5 5" />
    </SvgIcon>
  )
}

function CubeIcon() {
  return (
    <SvgIcon>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="m12 12 8-4.5" />
      <path d="m12 12-8-4.5" />
      <path d="M12 12v9" />
    </SvgIcon>
  )
}

function FactoryIcon() {
  return (
    <SvgIcon>
      <path d="M3 20V9l6 3V9l6 3V5l6 3v12H3Z" />
      <path d="M7 20v-4" />
      <path d="M12 20v-3" />
      <path d="M17 20v-5" />
    </SvgIcon>
  )
}

function TruckIcon() {
  return (
    <SvgIcon>
      <path d="M3 7h11v8H3z" />
      <path d="M14 10h3l3 3v2h-6" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="17.5" cy="17.5" r="1.5" />
    </SvgIcon>
  )
}

function ShieldIcon() {
  return (
    <SvgIcon>
      <path d="M12 3 5.5 5.8v5.1c0 4 2.8 7.7 6.5 9.1 3.7-1.4 6.5-5.1 6.5-9.1V5.8L12 3Z" />
      <path d="m9.5 11.8 1.8 1.8 3.4-3.8" />
    </SvgIcon>
  )
}

function RadarIcon() {
  return (
    <SvgIcon>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 12 17.5 8.5" />
      <path d="M12 12V6" />
      <circle cx="12" cy="12" r="2" />
    </SvgIcon>
  )
}

function GlobeIcon() {
  return (
    <SvgIcon>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a15 15 0 0 1 0 18" />
      <path d="M12 3a15 15 0 0 0 0 18" />
    </SvgIcon>
  )
}

export default MarketplacePage
