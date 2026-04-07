import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Spinner from '../components/Spinner'
import { useAuth } from '../context/AuthContext'
import { getLogistics, getOrders, getProducts } from '../services/api'
import api from '../services/api'

const S = {
  page: { display: 'grid', gap: 24 },
  hero: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 28,
    padding: 28,
    border: '1px solid rgba(191,219,254,.95)',
    background:
      'linear-gradient(135deg, rgba(255,255,255,.98), rgba(239,246,255,.96) 50%, rgba(224,242,254,.94))',
    boxShadow: '0 24px 56px rgba(15,23,42,.08)',
  },
  glowA: { position: 'absolute', top: -120, right: -60, width: 260, height: 260, borderRadius: 999, background: 'rgba(37,99,235,.14)' },
  glowB: { position: 'absolute', bottom: -120, left: -40, width: 220, height: 220, borderRadius: 999, background: 'rgba(20,184,166,.12)' },
  heroContent: { position: 'relative', zIndex: 1, display: 'grid', gap: 24 },
  heroGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 22, alignItems: 'start' },
  eyebrow: { margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: '.18em', textTransform: 'uppercase', color: '#2563eb' },
  title: { margin: '10px 0 12px', fontSize: 'clamp(2.1rem, 4vw, 3.3rem)', lineHeight: 1.05, color: '#0f172a' },
  subtitle: { margin: 0, color: '#475569', lineHeight: 1.7, maxWidth: 720 },
  ctas: { display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 22 },
  primary: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 48, padding: '0 18px',
    borderRadius: 14, border: '1px solid rgba(30,64,175,.16)', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
    color: '#fff', fontWeight: 700, boxShadow: '0 16px 30px rgba(37,99,235,.18)',
  },
  secondary: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 48, padding: '0 18px',
    borderRadius: 14, border: '1px solid rgba(148,163,184,.28)', background: 'rgba(255,255,255,.84)', color: '#0f172a', fontWeight: 700,
  },
  card: {
    borderRadius: 22, border: '1px solid rgba(226,232,240,.95)', background: 'rgba(255,255,255,.9)',
    boxShadow: '0 18px 40px rgba(15,23,42,.06)',
  },
  darkCard: {
    padding: 22, display: 'grid', gap: 16, color: '#e2e8f0',
    background: 'linear-gradient(155deg, rgba(15,23,42,.98), rgba(30,41,59,.96))',
  },
  metricGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 },
  metric: { padding: 14, borderRadius: 16, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(148,163,184,.14)' },
  statsWrap: {
    padding: 24, borderRadius: 26, border: '1px solid rgba(191,219,254,.95)',
    background: 'linear-gradient(180deg, rgba(239,246,255,.86), rgba(219,234,254,.72))',
  },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, marginTop: 18 },
  stat: { padding: 18, borderRadius: 20, border: '1px solid rgba(226,232,240,.92)', background: 'rgba(255,255,255,.96)' },
  mainGrid: { display: 'grid', gap: 24 },
  rowGrid: { display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(320px, .8fr)', gap: 24 },
  fullRow: { display: 'grid', gap: 24 },
  section: { padding: 22 },
  sectionTitle: { margin: 0, fontSize: '1.22rem', color: '#0f172a' },
  sectionText: { margin: '6px 0 0', color: '#64748b', lineHeight: 1.6 },
  list: { display: 'grid', gap: 12, marginTop: 18 },
  item: { padding: 14, borderRadius: 16, border: '1px solid rgba(226,232,240,.9)', background: '#f8fafc' },
  clickable: { cursor: 'pointer' },
  shipGrid: { display: 'grid', gridTemplateColumns: 'minmax(260px, .82fr) minmax(0, 1.38fr)', gap: 22, marginTop: 18, alignItems: 'start' },
  shipList: { display: 'grid', gap: 12 },
  shipButton: { width: '100%', textAlign: 'left', padding: 16, borderRadius: 18, border: '1px solid rgba(226,232,240,.9)', background: '#f8fafc', cursor: 'pointer', display: 'grid', gap: 10 },
  shipButtonMeta: { display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, alignItems: 'center' },
  shipmentDetailCard: { padding: 22, borderRadius: 22, border: '1px solid rgba(191,219,254,.95)', background: 'linear-gradient(180deg, rgba(255,255,255,.98), rgba(239,246,255,.82))', boxShadow: '0 18px 34px rgba(37,99,235,.08)', display: 'grid', gap: 18, minHeight: 320 },
  shipmentHeader: { display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start' },
  shipmentMetaGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 },
  shipmentMetaCard: { padding: 14, borderRadius: 16, border: '1px solid rgba(191,219,254,.76)', background: 'rgba(255,255,255,.88)' },
  tracker: { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 },
  trackerNode: { display: 'grid', gap: 10, justifyItems: 'center', textAlign: 'center' },
  trackerRail: { width: '100%', display: 'grid', gridTemplateColumns: '40px 1fr', alignItems: 'center', gap: 10 },
  trackerLabel: { display: 'grid', gap: 4 },
  trustGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginTop: 18 },
  trustBlock: {
    padding: 28,
    borderRadius: 28,
    color: '#e2e8f0',
    background: 'linear-gradient(180deg, rgba(15,23,42,.98), rgba(17,24,39,.97))',
    boxShadow: '0 24px 56px rgba(15,23,42,.16)',
  },
  trustCard: { padding: 18, borderRadius: 18, border: '1px solid rgba(148,163,184,.12)', background: 'rgba(255,255,255,.04)' },
  footer: { display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16, paddingTop: 18, color: '#94a3b8', borderTop: '1px solid rgba(148,163,184,.12)', marginTop: 22 },
}

const tones = {
  blue: { background: 'rgba(219,234,254,.95)', color: '#2563eb' },
  emerald: { background: 'rgba(209,250,229,.95)', color: '#059669' },
  amber: { background: 'rgba(254,243,199,.95)', color: '#d97706' },
  violet: { background: 'rgba(237,233,254,.95)', color: '#7c3aed' },
  slate: { background: 'rgba(226,232,240,.95)', color: '#334155' },
}

function badge(background, color) {
  return { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, background, color }
}

function IconWrap({ children, tone = 'blue' }) {
  return <span style={{ width: 42, height: 42, borderRadius: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, ...tones[tone] }}>{children}</span>
}

function EmptyState({ text }) {
  return <div className="empty-state">{text}</div>
}

function formatDate(value) {
  if (!value) return 'No data available'
  return new Date(value).toLocaleString()
}

function formatCurrency(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount <= 0) return null
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function getConversationStatus(conversation) {
  if (conversation.status === 'closed') return { label: 'Closed', tone: 'slate' }
  const hasSupplierReply = Array.isArray(conversation.messages) && conversation.messages.some((message) => message.sender?.role === 'supplier')
  if (hasSupplierReply || conversation.status === 'ordered') return { label: 'Negotiation', tone: 'amber' }
  return { label: 'Awaiting', tone: 'blue' }
}

function getShipmentStep(logisticsItem) {
  if (!logisticsItem) return 0
  if (logisticsItem.status === 'delivered' || logisticsItem.tracking_stage === 'final_destination') return 3
  if (logisticsItem.tracking_stage === 'transport' || logisticsItem.status === 'in_transit') return 2
  if (logisticsItem.tracking_stage === 'warehouse' || logisticsItem.tracking_stage === 'delivery' || logisticsItem.status === 'shipped') return 1
  return 0
}

function getShipmentTone(status) {
  if (status === 'delivered') return tones.emerald
  if (status === 'in_transit' || status === 'shipped') return tones.blue
  return tones.violet
}

function DashboardPage() {
  const navigate = useNavigate()
  const { role, user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [orders, setOrders] = useState([])
  const [logistics, setLogistics] = useState([])
  const [conversations, setConversations] = useState([])
  const [products, setProducts] = useState([])
  const [shipmentDetail, setShipmentDetail] = useState(null)
  const [shipmentLoading, setShipmentLoading] = useState(false)
  const [selectedShipmentId, setSelectedShipmentId] = useState(null)

  useEffect(() => {
    let isMounted = true
    async function loadDashboard() {
      setLoading(true)
      setError('')
      try {
        const [ordersResponse, logisticsResponse, conversationsResponse, productsResponse] = await Promise.all([
          getOrders(),
          getLogistics(),
          api.get('conversations/'),
          getProducts(),
        ])
        if (!isMounted) return
        const conversationItems = Array.isArray(conversationsResponse.data) ? conversationsResponse.data : []
        const buyerConversations = conversationItems
          .filter((item) => {
            if (user?.id && item.buyer?.id) return String(item.buyer.id) === String(user.id)
            if (user?.email && item.buyer?.email) return item.buyer.email.toLowerCase() === user.email.toLowerCase()
            return false
          })
          .sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0))
        const logisticsItems = Array.isArray(logisticsResponse.data) ? logisticsResponse.data : []
        setOrders(Array.isArray(ordersResponse.data) ? ordersResponse.data : [])
        setLogistics(logisticsItems)
        setConversations(buyerConversations)
        setProducts(Array.isArray(productsResponse.data) ? productsResponse.data : [])
        setSelectedShipmentId((current) => current ?? logisticsItems[0]?.id ?? null)
      } catch (err) {
        if (isMounted) setError(err.response?.data?.detail || 'Could not load dashboard data right now.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadDashboard()
    return () => {
      isMounted = false
    }
  }, [user?.email, user?.id])

  useEffect(() => {
    let isMounted = true
    async function loadShipmentDetail() {
      if (!selectedShipmentId) {
        setShipmentDetail(null)
        return
      }
      try {
        setShipmentLoading(true)
        const response = await api.get(`logistics/${selectedShipmentId}/`)
        if (isMounted) setShipmentDetail(response.data)
      } catch {
        if (isMounted) setShipmentDetail(null)
      } finally {
        if (isMounted) setShipmentLoading(false)
      }
    }
    loadShipmentDetail()
    return () => {
      isMounted = false
    }
  }, [selectedShipmentId])

  const summary = useMemo(() => {
    const activeEnquiries = conversations.filter((item) => item.status !== 'closed').length
    const shipmentsInProgress = logistics.filter((item) => item.status !== 'delivered').length
    const confirmedOrders = orders.filter((item) => item.status === 'confirmed').length
    return { totalOrders: orders.length, activeEnquiries, shipmentsInProgress, confirmedOrders }
  }, [conversations, logistics, orders])

  const recentEnquiries = useMemo(() => conversations.slice(0, 3), [conversations])
  const latestProducts = useMemo(() => [...products].sort((a, b) => Number(b.id || 0) - Number(a.id || 0)).slice(0, 3), [products])

  const recentActivity = useMemo(() => {
    const enquirySent = conversations[0]
      ? { key: `enquiry-${conversations[0].id}`, title: 'Enquiry sent', detail: conversations[0].product?.name || 'No data available', time: formatDate(conversations[0].created_at), href: `/enquiry/${conversations[0].id}`, tone: 'blue', tag: 'Open' }
      : null
    const confirmedOrder = [...orders].filter((item) => item.status === 'confirmed').sort((a, b) => new Date(b.order_date || 0) - new Date(a.order_date || 0))[0]
    const shipmentDispatched = [...logistics].filter((item) => item.status === 'shipped' || item.status === 'in_transit' || item.status === 'delivered').sort((a, b) => Number(b.id || 0) - Number(a.id || 0))[0]
    const supplierRespondedConversation = [...conversations].find((item) => Array.isArray(item.messages) && item.messages.some((message) => message.sender?.role === 'supplier'))
    const supplierMessage = supplierRespondedConversation?.messages?.filter((message) => message.sender?.role === 'supplier').sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))[0]
    return [
      enquirySent,
      confirmedOrder ? { key: `order-${confirmedOrder.id}`, title: 'Order confirmed', detail: confirmedOrder.product?.name || `Order #${confirmedOrder.id}`, time: formatDate(confirmedOrder.order_date), href: `/orders/${confirmedOrder.id}`, tone: 'emerald', tag: 'Confirmed' } : null,
      shipmentDispatched ? { key: `shipment-${shipmentDispatched.id}`, title: 'Shipment dispatched', detail: `Order #${shipmentDispatched.order}`, time: formatDate(shipmentDispatched.updated_at || shipmentDispatched.created_at), href: `/shipments/${shipmentDispatched.id}`, tone: 'violet', tag: shipmentDispatched.status === 'delivered' ? 'Delivered' : 'In transit' } : null,
      supplierMessage ? { key: `response-${supplierRespondedConversation.id}`, title: 'Supplier responded', detail: supplierMessage.content || supplierRespondedConversation.product?.name || 'No data available', time: formatDate(supplierMessage.created_at), href: `/conversations/${supplierRespondedConversation.id}`, tone: 'amber', tag: 'Response received' } : null,
    ].filter(Boolean)
  }, [conversations, logistics, orders])

  const activeShipment = shipmentDetail || logistics.find((item) => String(item.id) === String(selectedShipmentId)) || null
  const shipmentStep = getShipmentStep(activeShipment)

  if (role !== 'buyer') {
    return <section className="page-card"><h2 className="page-title">Buyer Dashboard</h2><div className="info-box">This dashboard is available for buyer accounts only.</div></section>
  }

  if (loading) {
    return <section className="page-card"><Spinner label="Loading buyer dashboard..." /></section>
  }

  return (
    <section className="page-card" style={S.page}>
      {error ? <div className="error-box">{error}</div> : null}

      <div style={S.hero}>
        <div style={S.glowA} />
        <div style={S.glowB} />
        <div style={S.heroContent}>
          <div style={S.heroGrid}>
            <div>
              <p style={S.eyebrow}>Actionable Trade Operations</p>
              <h1 style={S.title}>TradeX Asia Marketplace</h1>
              <p style={S.subtitle}>Connecting Buyers & Suppliers Across Asia</p>
              <p style={{ ...S.subtitle, marginTop: 12 }}>Centralize enquiries, monitor orders, coordinate shipments, and act from one buyer workspace powered by live marketplace data.</p>
              <div style={S.ctas}>
                <Link to="/products" style={S.primary}><CubeIcon />Browse Products</Link>
                <Link to="/conversations" style={S.secondary}><MessageIcon />Send Enquiry</Link>
                <Link to="/orders" style={S.secondary}><TruckIcon />Track Shipment</Link>
              </div>
            </div>

            <div style={{ ...S.card, ...S.darkCard }}>
              <div>
                <span style={badge('rgba(37,99,235,.16)', '#93c5fd')}>Buyer workspace</span>
                <h2 style={{ margin: '14px 0 8px', fontSize: '1.4rem', color: '#fff' }}>Welcome back, {user?.name || 'Buyer'}</h2>
                <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.7 }}>Track your live trade activity across orders, enquiries, and shipments without relying on placeholder data.</p>
              </div>
              <div style={S.metricGrid}>
                <div style={S.metric}><div style={{ color: '#93c5fd', fontSize: '.82rem' }}>Total Orders</div><div style={{ marginTop: 6, fontSize: '1.5rem', fontWeight: 800 }}>{summary.totalOrders}</div></div>
                <div style={S.metric}><div style={{ color: '#93c5fd', fontSize: '.82rem' }}>Active Enquiries</div><div style={{ marginTop: 6, fontSize: '1.5rem', fontWeight: 800 }}>{summary.activeEnquiries}</div></div>
                <div style={S.metric}><div style={{ color: '#93c5fd', fontSize: '.82rem' }}>Shipments In Progress</div><div style={{ marginTop: 6, fontSize: '1.5rem', fontWeight: 800 }}>{summary.shipmentsInProgress}</div></div>
              </div>
            </div>
          </div>

          <div style={S.statsWrap}>
            <h2 style={S.sectionTitle}>Performance Overview</h2>
            <p style={S.sectionText}>Real-time buyer signals across order flow, enquiry momentum, logistics execution, and confirmed trade progress.</p>
            <div style={S.statsGrid}>
              <article style={S.stat}><IconWrap><ChartIcon /></IconWrap><div style={{ marginTop: 16, fontSize: '1.9rem', fontWeight: 800, color: '#0f172a' }}>{summary.totalOrders}</div><div style={{ marginTop: 6, fontWeight: 700, color: '#334155' }}>Total Orders</div><div style={{ marginTop: 6, color: '#64748b' }}>Buyer orders created from your account.</div></article>
              <article style={S.stat}><IconWrap tone="amber"><InboxIcon /></IconWrap><div style={{ marginTop: 16, fontSize: '1.9rem', fontWeight: 800, color: '#0f172a' }}>{summary.activeEnquiries}</div><div style={{ marginTop: 6, fontWeight: 700, color: '#334155' }}>Active Enquiries</div><div style={{ marginTop: 6, color: '#64748b' }}>Open conversations awaiting closure.</div></article>
              <article style={S.stat}><IconWrap tone="violet"><TruckIcon /></IconWrap><div style={{ marginTop: 16, fontSize: '1.9rem', fontWeight: 800, color: '#0f172a' }}>{summary.shipmentsInProgress}</div><div style={{ marginTop: 6, fontWeight: 700, color: '#334155' }}>Shipments In Progress</div><div style={{ marginTop: 6, color: '#64748b' }}>Live shipments that have not reached delivery.</div></article>
              <article style={S.stat}><IconWrap tone="emerald"><CheckIcon /></IconWrap><div style={{ marginTop: 16, fontSize: '1.9rem', fontWeight: 800, color: '#0f172a' }}>{summary.confirmedOrders}</div><div style={{ marginTop: 6, fontWeight: 700, color: '#334155' }}>Confirmed Orders</div><div style={{ marginTop: 6, color: '#64748b' }}>Orders already accepted and confirmed by suppliers.</div></article>
            </div>
          </div>
        </div>
      </div>

      <div style={S.mainGrid}>
        <div style={S.fullRow}>
          <div style={{ ...S.card, ...S.section }}>
            <h2 style={S.sectionTitle}>Recent Enquiries</h2>
            <p style={S.sectionText}>Your latest buyer enquiries with quick status visibility.</p>
            {recentEnquiries.length === 0 ? <div style={S.list}><EmptyState text="No enquiries yet" /></div> : (
              <div style={S.list}>
                {recentEnquiries.map((conversation) => {
                  const status = getConversationStatus(conversation)
                  return (
                    <button key={conversation.id} onClick={() => navigate(`/enquiry/${conversation.id}`)} style={{ ...S.item, ...S.clickable, textAlign: 'left' }} type="button">
                      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 12, alignItems: 'center' }}>
                        <IconWrap tone={status.tone}><MessageIcon /></IconWrap>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{conversation.product?.name || 'No data available'}</div>
                          <div style={{ marginTop: 6, color: '#64748b' }}>{formatDate(conversation.created_at)}</div>
                        </div>
                        <span style={badge(tones[status.tone].background, tones[status.tone].color)}>{status.label}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <aside style={{ ...S.card, ...S.section, height: 'fit-content' }}>
            <h2 style={S.sectionTitle}>Recent Activity</h2>
            <p style={S.sectionText}>Recent buyer events generated from live conversations, orders, and shipment data.</p>
            {recentActivity.length === 0 ? <div style={S.list}><EmptyState text="No recent activity" /></div> : (
              <div style={S.list}>
                {recentActivity.map((item) => (
                  <button key={item.key} onClick={() => navigate(item.href)} style={{ ...S.item, ...S.clickable, textAlign: 'left' }} type="button">
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 12, alignItems: 'center' }}>
                      <IconWrap tone={item.tone}>{item.title === 'Order confirmed' ? <CheckIcon /> : item.title === 'Shipment dispatched' ? <TruckIcon /> : item.title === 'Supplier responded' ? <InboxIcon /> : <MessageIcon />}</IconWrap>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.title}</div>
                        <div style={{ marginTop: 6, color: '#475569', lineHeight: 1.6 }}>{item.detail}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={badge(tones[item.tone].background, tones[item.tone].color)}>{item.tag}</span>
                        <div style={{ marginTop: 8, color: '#64748b', fontSize: '.85rem' }}>{item.time}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </aside>
        </div>

        <div style={S.fullRow}>
          <div style={{ ...S.card, ...S.section }}>
            <h2 style={S.sectionTitle}>Shipment Tracker</h2>
            <p style={S.sectionText}>Select a live shipment to inspect its current delivery stage.</p>
            {logistics.length === 0 ? <div style={S.list}><EmptyState text="No shipments found" /></div> : (
              <div style={S.shipGrid}>
                <div style={S.shipList}>
                  {logistics.map((item) => {
                    const tone = getShipmentTone(item.status)
                    const selected = String(selectedShipmentId) === String(item.id)

                    return (
                      <button key={item.id} onClick={() => setSelectedShipmentId(item.id)} style={{ ...S.shipButton, background: selected ? 'rgba(239,246,255,.96)' : '#f8fafc', borderColor: selected ? '#93c5fd' : 'rgba(226,232,240,.9)', boxShadow: selected ? '0 14px 28px rgba(37,99,235,.08)' : 'none' }} type="button">
                        <div style={S.shipButtonMeta}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>Shipment #{item.id}</div>
                          <span style={badge(tone.background, tone.color)}>{String(item.status || 'pending').replaceAll('_', ' ')}</span>
                        </div>
                        <div style={{ color: '#475569' }}>Order #{item.order}</div>
                        <div style={{ color: '#64748b', fontSize: '.92rem' }}>Current location: {item.location || 'No data available'}</div>
                      </button>
                    )
                  })}
                </div>

                <div style={S.shipmentDetailCard}>
                  {shipmentLoading ? <Spinner label="Loading shipment..." /> : null}
                  {!shipmentLoading && activeShipment ? (
                    <>
                      <div style={S.shipmentHeader}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#0f172a' }}>Shipment #{activeShipment.id}</div>
                          <div style={{ marginTop: 8, color: '#475569', lineHeight: 1.6 }}>Track the current delivery milestone for Order #{activeShipment.order} from one focused buyer view.</div>
                        </div>
                        <button className="button secondary" onClick={() => navigate(`/shipments/${activeShipment.id}`)} type="button">Open Shipment</button>
                      </div>
                      <div style={S.shipmentMetaGrid}>
                        <div style={S.shipmentMetaCard}>
                          <div style={{ fontSize: '.78rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#64748b' }}>Order</div>
                          <div style={{ marginTop: 8, fontWeight: 700, color: '#0f172a' }}>#{activeShipment.order}</div>
                        </div>
                        <div style={S.shipmentMetaCard}>
                          <div style={{ fontSize: '.78rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#64748b' }}>Status</div>
                          <div style={{ marginTop: 8 }}><span style={badge(getShipmentTone(activeShipment.status).background, getShipmentTone(activeShipment.status).color)}>{String(activeShipment.status || 'pending').replaceAll('_', ' ')}</span></div>
                        </div>
                        <div style={S.shipmentMetaCard}>
                          <div style={{ fontSize: '.78rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#64748b' }}>Location</div>
                          <div style={{ marginTop: 8, fontWeight: 700, color: '#0f172a' }}>{activeShipment.location || 'No data available'}</div>
                        </div>
                        <div style={S.shipmentMetaCard}>
                          <div style={{ fontSize: '.78rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#64748b' }}>Mode</div>
                          <div style={{ marginTop: 8, fontWeight: 700, color: '#0f172a' }}>{activeShipment.shipping_mode ? String(activeShipment.shipping_mode).replaceAll('_', ' ') : 'Not selected'}</div>
                        </div>
                      </div>
                      <div style={S.tracker}>
                        {['Order Placed', 'Dispatched', 'In Transit', 'Delivered'].map((label, index) => {
                          const active = shipmentStep === index
                          const done = shipmentStep > index || activeShipment.status === 'delivered'
                          return (
                            <div key={label} style={S.trackerNode}>
                              <div style={S.trackerRail}>
                                <div style={{ width: 40, height: 40, borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: active ? '#2563eb' : done ? '#0f766e' : '#e2e8f0', color: active || done ? '#fff' : '#64748b', fontWeight: 800, fontSize: '.72rem' }}>{done ? 'OK' : active ? 'NOW' : index + 1}</div>
                                <div style={{ height: 5, width: '100%', borderRadius: 999, background: index === 3 ? 'transparent' : done || active ? 'linear-gradient(90deg,#2563eb,#14b8a6)' : '#e2e8f0' }} />
                              </div>
                              <div style={S.trackerLabel}><div style={{ fontWeight: 700, color: '#0f172a' }}>{label}</div><div style={{ color: '#64748b', fontSize: '.88rem' }}>{active ? 'Current stage' : done ? 'Completed' : 'Queued'}</div></div>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          <div style={{ ...S.card, ...S.section }}>
              <h2 style={S.sectionTitle}>Latest Products</h2>
              <p style={S.sectionText}>Top live products from the marketplace.</p>
              {latestProducts.length === 0 ? <div style={S.list}><EmptyState text="No data available" /></div> : (
                <div style={S.list}>
                  {latestProducts.map((product) => (
                    <button key={product.id} onClick={() => navigate(`/product/${product.id}`)} style={{ ...S.item, ...S.clickable, textAlign: 'left' }} type="button">
                      <div style={{ display: 'flex', gap: 12 }}>
                        <IconWrap tone="slate"><CubeIcon /></IconWrap>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{product.name || 'No data available'}</div>
                          <div style={{ marginTop: 6, color: '#475569' }}>{formatCurrency(product.price) || 'No data available'}</div>
                          <div style={{ marginTop: 8, color: '#64748b', lineHeight: 1.6 }}>Supplier: {product.supplier?.name || product.supplier?.email || 'No data available'}. Available quantity: {product.quantity ?? 'No data available'}.</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
          </div>
        </div>
      </div>

      <section style={S.trustBlock}>
        <p style={{ ...S.eyebrow, color: '#93c5fd' }}>Platform Trust</p>
        <div style={{ display: 'grid', gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', color: '#ffffff' }}>Built for cross-border trade teams that need confidence and visibility</h2>
          <p style={{ margin: 0, maxWidth: 820, color: '#cbd5e1', lineHeight: 1.7 }}>A darker closing section inspired by your reference, while keeping the rest of the dashboard in the lighter TradeX blue theme.</p>
        </div>
        <div style={S.trustGrid}>
          <article style={S.trustCard}><IconWrap tone="emerald"><ShieldIcon /></IconWrap><div style={{ marginTop: 14, fontWeight: 700, color: '#ffffff' }}>Verified Suppliers</div><p style={{ margin: '8px 0 0', color: '#cbd5e1', lineHeight: 1.6 }}>Curated onboarding with compliance checks and export-readiness validation.</p></article>
          <article style={S.trustCard}><IconWrap><LockIcon /></IconWrap><div style={{ marginTop: 14, fontWeight: 700, color: '#ffffff' }}>Secure Transactions</div><p style={{ margin: '8px 0 0', color: '#cbd5e1', lineHeight: 1.6 }}>Milestone-driven order handling with transparent commercial records.</p></article>
          <article style={S.trustCard}><IconWrap tone="violet"><GlobeIcon /></IconWrap><div style={{ marginTop: 14, fontWeight: 700, color: '#ffffff' }}>Multi-country logistics</div><p style={{ margin: '8px 0 0', color: '#cbd5e1', lineHeight: 1.6 }}>Air and sea coordination across Asia with warehouse and customs visibility.</p></article>
          <article style={S.trustCard}><IconWrap tone="amber"><RadarIcon /></IconWrap><div style={{ marginTop: 14, fontWeight: 700, color: '#ffffff' }}>Real-time tracking</div><p style={{ margin: '8px 0 0', color: '#cbd5e1', lineHeight: 1.6 }}>Shipment status and stakeholder activity surfaced in one operational view.</p></article>
        </div>
        <footer style={S.footer}>
          <div>TradeX Asia Marketplace</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
            <a href="/" style={{ color: 'inherit' }}>About</a>
            <a href="/" style={{ color: 'inherit' }}>Contact</a>
            <a href="/" style={{ color: 'inherit' }}>Terms</a>
            <a href="/" style={{ color: 'inherit' }}>Privacy Policy</a>
          </div>
        </footer>
      </section>
    </section>
  )
}

function SvgIcon({ children, size = 18 }) {
  return <svg aria-hidden="true" fill="none" height={size} width={size} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
}
function CubeIcon() { return <SvgIcon><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m12 12 8-4.5" /><path d="m12 12-8-4.5" /><path d="M12 12v9" /></SvgIcon> }
function MessageIcon() { return <SvgIcon><path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6A2.5 2.5 0 0 1 16.5 15H10l-4 4v-4.5A2.5 2.5 0 0 1 5 12.5v-6Z" /></SvgIcon> }
function TruckIcon() { return <SvgIcon><path d="M3 7h11v8H3z" /><path d="M14 10h3l3 3v2h-6" /><circle cx="7.5" cy="17.5" r="1.5" /><circle cx="17.5" cy="17.5" r="1.5" /></SvgIcon> }
function ChartIcon() { return <SvgIcon><path d="M4 19h16" /><path d="M7 16V9" /><path d="M12 16V5" /><path d="M17 16v-4" /></SvgIcon> }
function InboxIcon() { return <SvgIcon><path d="M4 13.5V6.8A1.8 1.8 0 0 1 5.8 5h12.4A1.8 1.8 0 0 1 20 6.8v6.7" /><path d="M4 13.5h4.2l1.8 2.5h4l1.8-2.5H20" /><path d="M4 13.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3.5" /></SvgIcon> }
function ShieldIcon() { return <SvgIcon><path d="M12 3 5.5 5.8v5.1c0 4 2.8 7.7 6.5 9.1 3.7-1.4 6.5-5.1 6.5-9.1V5.8L12 3Z" /><path d="m9.5 11.8 1.8 1.8 3.4-3.8" /></SvgIcon> }
function LockIcon() { return <SvgIcon><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V8a4 4 0 0 1 8 0v2" /></SvgIcon> }
function GlobeIcon() { return <SvgIcon><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a15 15 0 0 1 0 18" /><path d="M12 3a15 15 0 0 0 0 18" /></SvgIcon> }
function RadarIcon() { return <SvgIcon><circle cx="12" cy="12" r="8.5" /><path d="M12 12 17.5 8.5" /><path d="M12 12V6" /><circle cx="12" cy="12" r="2" /></SvgIcon> }
function CheckIcon() { return <SvgIcon><circle cx="12" cy="12" r="9" /><path d="m8.5 12.2 2.2 2.2 4.8-5" /></SvgIcon> }

export default DashboardPage
