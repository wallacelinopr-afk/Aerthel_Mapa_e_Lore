import { useEffect, useMemo, useRef, useState } from 'react'
import { Compass, Crown, MapPin, Navigation, Route as RouteIcon, Shield, X } from 'lucide-react'
import type { House, Region, Route } from '../types/map'
import type { ShortestPathResult } from '../engine/routeGraph'
import { MAP_POIS, POI_STYLE } from '../data/pois'
import type { SubPin } from './AerthelEarthMap'
import HouseSigil from './HouseSigil'

interface Props {
  region: Region
  regions: Region[]
  routes: Route[]
  houseById: Map<string, House>
  subPins: SubPin[]
  regionHouses: House[]
  networkPaths: Map<string, ShortestPathResult>
  onClose: () => void
  onSelectDestination: (regionId: string) => void
  onTravelTo?: (regionId: string, distanceKm: number, modeLabel: string) => void
  canTravel?: boolean
}

const REGION_LANDMARKS: Record<string, { name: string; dx: number; dy: number; tag: string }[]> = {
  'escarpas-de-vultur': [
    { name: 'Picos de Vultur', dx: -34, dy: -28, tag: 'Cordilheira' },
    { name: 'Passo do Vento Branco', dx: 26, dy: 24, tag: 'Passagem' },
  ],
  'pico-de-ferro': [
    { name: 'Forjas do Aço Negro', dx: 22, dy: -18, tag: 'Minas' },
    { name: 'Baía Ocidental', dx: -44, dy: 12, tag: 'Costa' },
  ],
  basgard: [
    { name: 'Mar de Gelo', dx: 48, dy: 18, tag: 'Geleira' },
    { name: 'Torreão da Vigília', dx: -24, dy: -22, tag: 'Fortim' },
  ],
  ruthless: [
    { name: 'Cidadela de Ruthless', dx: 0, dy: -12, tag: 'Sede Soberana' },
    { name: 'Entroncamento Real Norte', dx: 28, dy: 14, tag: 'Estrada' },
  ],
  'mata-velha': [
    { name: 'Mata dos Pinheiros Antigos', dx: -22, dy: -18, tag: 'Floresta' },
    { name: 'Ribeira de Glaedwyn', dx: 30, dy: 26, tag: 'Rio' },
  ],
  'pouso-do-corvo': [
    { name: 'Garganta Congelada', dx: -32, dy: -20, tag: 'Cânion' },
    { name: 'Vigília dos Corvos', dx: 24, dy: 18, tag: 'Guarnição' },
  ],
  'solar-do-vale': [
    { name: 'Penhascos de Draemont', dx: 24, dy: -24, tag: 'Montanha' },
    { name: 'Vale das Neves', dx: -28, dy: 20, tag: 'Vale' },
  ],
  'muralha-tripla': [
    { name: '1ª Muralha · Freya', dx: -35, dy: -16, tag: 'Muralha' },
    { name: '2ª Muralha · Frigg', dx: 0, dy: 0, tag: 'Muralha' },
    { name: '3ª Muralha · Skadi', dx: 35, dy: 16, tag: 'Muralha' },
  ],
  'solar-outonal': [
    { name: 'Floresta Outonal de Kühl', dx: -28, dy: -14, tag: 'Bosque Rubro' },
    { name: 'Porto Cinza', dx: 40, dy: -24, tag: 'Porto' },
  ],
  vermer: [
    { name: 'Anel Duplo Octogonal', dx: -28, dy: -18, tag: 'Fortificação' },
    { name: 'Fosso da Coroa', dx: 26, dy: 22, tag: 'Fosso' },
    { name: 'Entroncamento Imperial', dx: 0, dy: 34, tag: 'Via Imperial' },
  ],
  'cabo-da-cinza': [
    { name: 'Mata Oriental', dx: 24, dy: -26, tag: 'Floresta' },
    { name: 'Baía do Golfo Oriental', dx: 42, dy: 18, tag: 'Porto Naval' },
  ],
  'fortaleza-do-grifo': [
    { name: 'Campos Centrais', dx: 18, dy: -22, tag: 'Planície' },
    { name: 'Baía do Grifo', dx: -36, dy: 12, tag: 'Costa' },
  ],
  'ilhas-da-serpente': [
    { name: 'Estreito de Skalmark', dx: 38, dy: -14, tag: 'Canal Marítimo' },
    { name: 'Ilha da Serpente Sul', dx: -16, dy: 34, tag: 'Arquipélago' },
  ],
  'oasis-de-ambar': [
    { name: 'Grande Oásis de Âmbar', dx: 0, dy: 10, tag: 'Oásis' },
    { name: 'Cânion das Dunas', dx: 36, dy: -18, tag: 'Cânion' },
  ],
}

export default function IsolatedRegionMapModal({
  region,
  regions,
  routes,
  houseById,
  subPins,
  regionHouses,
  networkPaths,
  onClose,
  onSelectDestination,
  onTravelTo,
  canTravel,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [focusedHouseId, setFocusedHouseId] = useState<string | null>(region.houseId)
  const [selectedRouteTargetId, setSelectedRouteTargetId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'satellite' | 'blueprint'>('satellite')

  const mainHouse = region.houseId ? houseById.get(region.houseId) ?? null : null
  const activeHouse = (focusedHouseId ? houseById.get(focusedHouseId) : null) ?? mainHouse

  // Janela de recorte (em coordenadas 0..1000 do mapa) centrada na região
  const cropRadius = 155
  const cx = Math.min(1000 - cropRadius, Math.max(cropRadius, region.x))
  const cy = Math.min(1000 - cropRadius, Math.max(cropRadius, region.y))

  const toPct = (px: number, py: number) => ({
    left: ((px - (cx - cropRadius)) / (cropRadius * 2)) * 100,
    top: ((py - (cy - cropRadius)) / (cropRadius * 2)) * 100,
  })

  // Renderiza o recorte HD de /aerthel_satellite.jpg no canvas tático isolado
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.src = '/aerthel_satellite.jpg'
    img.onload = () => {
      const w = canvas.width
      const h = canvas.height
      const sx = ((cx - cropRadius) / 1000) * img.width
      const sy = ((cy - cropRadius) / 1000) * img.height
      const sw = ((cropRadius * 2) / 1000) * img.width
      const sh = ((cropRadius * 2) / 1000) * img.height

      ctx.clearRect(0, 0, w, h)
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h)

      // Vinheta cartográfica sutil estilo pergaminho sombrio
      const grad = ctx.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, w * 0.68)
      grad.addColorStop(0, 'rgba(6, 11, 17, 0)')
      grad.addColorStop(1, 'rgba(6, 11, 17, 0.72)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      // Grade cartográfica fina
      ctx.strokeStyle = 'rgba(214, 195, 161, 0.14)'
      ctx.lineWidth = 1
      for (let i = 1; i < 6; i++) {
        const p = (i / 6) * w
        ctx.beginPath()
        ctx.moveTo(p, 0)
        ctx.lineTo(p, h)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(0, p)
        ctx.lineTo(w, p)
        ctx.stroke()
      }
    }
  }, [cx, cy])

  const localSubPins = useMemo(
    () =>
      subPins.filter(
        (p) =>
          p.regionId === region.id ||
          (Math.abs(p.x - cx) < cropRadius * 0.88 && Math.abs(p.y - cy) < cropRadius * 0.88),
      ),
    [subPins, region.id, cx, cy],
  )

  const localPois = useMemo(
    () =>
      MAP_POIS.filter(
        (p) =>
          p.regionId === region.id ||
          (Math.abs(p.x - cx) < cropRadius * 0.88 && Math.abs(p.y - cy) < cropRadius * 0.88),
      ),
    [region.id, cx, cy],
  )

  const directNeighbors = useMemo(() => {
    const rMap = new Map(regions.map((r) => [r.id, r]))
    return routes
      .filter((rt) => rt.fromId === region.id || rt.toId === region.id)
      .map((rt) => {
        const otherId = rt.fromId === region.id ? rt.toId : rt.fromId
        const other = rMap.get(otherId)
        return other ? { route: rt, other } : null
      })
      .filter(Boolean) as { route: Route; other: Region }[]
  }, [routes, regions, region.id])

  const allSortedPaths = useMemo(
    () => Array.from(networkPaths.values()).sort((a, b) => a.totalKm - b.totalKm),
    [networkPaths],
  )

  const seatPos = toPct(region.x, region.y)
  const landmarks = REGION_LANDMARKS[region.id] ?? []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-accent-dim/60 bg-[#0b1014] shadow-2xl">
        {/* Cabeçalho */}
        <header className="flex items-center justify-between border-b border-line bg-[#11161d] px-5 py-3.5">
          <div className="flex items-center gap-3">
            <HouseSigil house={mainHouse} size={38} />
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
                Atlas Regional Isolado · {region.macroRegion}
              </p>
              <h2 className="font-serif text-xl font-bold tracking-wide text-ink-strong">
                {region.settlement} — {region.name}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border border-line-strong bg-base p-0.5 text-xs">
              <button
                onClick={() => setViewMode('satellite')}
                className={`rounded px-2.5 py-1 transition ${
                  viewMode === 'satellite' ? 'bg-accent-soft text-accent' : 'text-mute hover:text-ink-strong'
                }`}
              >
                Satélite Local
              </button>
              <button
                onClick={() => setViewMode('blueprint')}
                className={`rounded px-2.5 py-1 transition ${
                  viewMode === 'blueprint' ? 'bg-accent-soft text-accent' : 'text-mute hover:text-ink-strong'
                }`}
              >
                Planta Tática
              </button>
            </div>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 rounded-md border border-line-strong bg-base px-3 py-1.5 text-xs text-ink hover:border-accent"
            >
              <X size={14} /> Fechar Atlas
            </button>
          </div>
        </header>

        <div className="grid flex-1 overflow-y-auto lg:grid-cols-[1.25fr_1fr]">
          {/* Mapa Isolado com Camadas SVG + Canvas */}
          <div className="relative flex min-h-[480px] items-center justify-center border-b border-line bg-[#060b11] p-4 lg:border-b-0 lg:border-r">
            <div className="relative aspect-square w-full max-w-[600px] overflow-hidden rounded-lg border border-[#d6c3a1]/30 shadow-inner">
              <canvas
                ref={canvasRef}
                width={720}
                height={720}
                className={`h-full w-full object-cover transition-opacity ${viewMode === 'satellite' ? 'opacity-100' : 'opacity-0'}`}
              />

              {/* Planta Arquitetônica / Tática exclusiva por arquétipo de região */}
              {viewMode === 'blueprint' && (
                <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full bg-[#0d131a]">
                  <defs>
                    <pattern id="bpGrid" width="5" height="5" patternUnits="userSpaceOnUse">
                      <path d="M 5 0 L 0 0 0 5" fill="none" stroke="#38bdf8" strokeOpacity="0.1" strokeWidth="0.18" />
                    </pattern>
                  </defs>
                  <rect width="100" height="100" fill="url(#bpGrid)" />

                  {region.id === 'vermer' ? (
                    <g stroke="#d6c3a1" fill="none">
                      <circle cx={seatPos.left} cy={seatPos.top} r="22" stroke="#38bdf8" strokeWidth="1.2" strokeOpacity="0.45" />
                      <polygon
                        points={Array.from({ length: 8 }, (_, i) => {
                          const a = (i / 8) * Math.PI * 2
                          return `${seatPos.left + Math.cos(a) * 18},${seatPos.top + Math.sin(a) * 18}`
                        }).join(' ')}
                        strokeWidth="0.8"
                        fill="#1e293b"
                        fillOpacity="0.5"
                      />
                      <circle cx={seatPos.left} cy={seatPos.top} r="11" strokeWidth="0.7" />
                      <circle cx={seatPos.left} cy={seatPos.top} r="5" fill="#d6c3a1" fillOpacity="0.2" strokeWidth="0.7" />
                      <text x={seatPos.left} y={seatPos.top + 26} textAnchor="middle" fill="#93c5fd" fontSize="2.2" fontFamily="monospace" stroke="none">
                        ANEL OCTOGONAL DUPLO · FOSSO REAL
                      </text>
                    </g>
                  ) : region.id === 'muralha-tripla' ? (
                    <g stroke="#e2e8f0" fill="none">
                      <rect x="6" y="34" width="88" height="3.5" fill="#475569" strokeWidth="0.5" />
                      <rect x="6" y="42" width="88" height="4" fill="#1e3a5f" fillOpacity="0.55" stroke="#38bdf8" strokeWidth="0.3" />
                      <rect x="6" y="48" width="88" height="3.5" fill="#475569" strokeWidth="0.5" />
                      <rect x="6" y="55" width="88" height="4" fill="#1e3a5f" fillOpacity="0.55" stroke="#38bdf8" strokeWidth="0.3" />
                      <rect x="6" y="62" width="88" height="3.5" fill="#475569" strokeWidth="0.5" />
                      <rect x="46" y="30" width="8" height="39" fill="#0b1014" stroke="#fef08a" strokeWidth="0.6" />
                      <text x="50" y="74" textAnchor="middle" fill="#cbd5e1" fontSize="2.2" fontFamily="monospace" stroke="none">
                        FREYA · FOSSO NORTE · FRIGG · ZONA MORTA · SKADI
                      </text>
                    </g>
                  ) : region.id === 'ilhas-da-serpente' ? (
                    <g stroke="#d6c3a1" fill="#1e293b" fillOpacity="0.7" strokeWidth="0.6">
                      <path d="M 18,32 Q 35,22 48,38 Q 42,52 24,48 Z" />
                      <path d="M 54,28 Q 74,25 80,44 Q 68,58 52,48 Z" />
                      <path d="M 30,58 Q 52,55 62,74 Q 44,86 25,74 Z" />
                      <text x="50" y="90" textAnchor="middle" fill="#67e8f9" fontSize="2.2" fontFamily="monospace" stroke="none">
                        ARQUIPÉLAGO DE SKALMARK · ESTREITOS E ESTALEIROS
                      </text>
                    </g>
                  ) : region.id === 'oasis-de-ambar' ? (
                    <g stroke="#fbbf24" fill="none">
                      <ellipse cx={seatPos.left} cy={seatPos.top} rx="14" ry="9" fill="#0284c7" fillOpacity="0.45" stroke="#38bdf8" strokeWidth="0.7" />
                      <circle cx={seatPos.left} cy={seatPos.top} r="20" strokeDasharray="2 1.5" strokeWidth="0.5" />
                      <path d="M 15,78 Q 45,70 85,82" stroke="#d6c3a1" strokeWidth="0.8" />
                      <text x={seatPos.left} y={seatPos.top + 25} textAnchor="middle" fill="#fde68a" fontSize="2.2" fontFamily="monospace" stroke="none">
                        OÁSIS CENTRAL · CÂNION DE ÂMBAR · ROTAS CARAVANEIRAS
                      </text>
                    </g>
                  ) : (
                    <g stroke="#d6c3a1" fill="none">
                      <rect x={seatPos.left - 13} y={seatPos.top - 13} width="26" height="26" fill="#1e293b" fillOpacity="0.55" strokeWidth="0.7" />
                      <rect x={seatPos.left - 6} y={seatPos.top - 6} width="12" height="12" fill="#d6c3a1" fillOpacity="0.2" strokeWidth="0.7" />
                      {[[-13, -13], [13, -13], [-13, 13], [13, 13]].map(([ox, oy], idx) => (
                        <circle key={idx} cx={seatPos.left + ox} cy={seatPos.top + oy} r="2.2" fill="#0b1014" strokeWidth="0.7" />
                      ))}
                      <text x={seatPos.left} y={seatPos.top + 19} textAnchor="middle" fill="#cbd5e1" fontSize="2.2" fontFamily="monospace" stroke="none">
                        MURALHA EXTERNA · TORREÕES · PÁTIO DE ARMAS
                      </text>
                    </g>
                  )}
                </svg>
              )}

              {/* Rotas locais irradiando da sede */}
              <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full">
                {directNeighbors.map(({ route, other }) => {
                  const dx = other.x - region.x
                  const dy = other.y - region.y
                  const len = Math.hypot(dx, dy) || 1
                  const ex = seatPos.left + (dx / len) * 44
                  const ey = seatPos.top + (dy / len) * 44
                  const color = route.mode === 'mar' ? '#67e8f9' : route.mode === 'rio' ? '#93c5fd' : '#fcd34d'
                  return (
                    <g key={route.id}>
                      <line
                        x1={seatPos.left}
                        y1={seatPos.top}
                        x2={ex}
                        y2={ey}
                        stroke={color}
                        strokeWidth="0.65"
                        strokeDasharray={route.mode === 'mar' ? '1.8 1.2' : undefined}
                        opacity={0.85}
                      />
                      <circle cx={ex} cy={ey} r="0.9" fill={color} />
                    </g>
                  )
                })}

                {/* Anel tático em volta da fortaleza */}
                <circle
                  cx={seatPos.left}
                  cy={seatPos.top}
                  r="7.5"
                  fill="none"
                  stroke="#fef08a"
                  strokeWidth="0.3"
                  strokeDasharray="1.2 1.2"
                  opacity={0.6}
                />
              </svg>

              {/* Rótulos das saídas de rota na borda */}
              {directNeighbors.map(({ route, other }) => {
                const dx = other.x - region.x
                const dy = other.y - region.y
                const len = Math.hypot(dx, dy) || 1
                const lx = Math.min(88, Math.max(12, seatPos.left + (dx / len) * 42))
                const ly = Math.min(92, Math.max(8, seatPos.top + (dy / len) * 42))
                return (
                  <button
                    key={`exit-${route.id}`}
                    onClick={() => onSelectDestination(other.id)}
                    style={{ left: `${lx}%`, top: `${ly}%`, transform: 'translate(-50%, -50%)' }}
                    className="absolute rounded border border-[#d6c3a1]/40 bg-[#0b1014]/85 px-1.5 py-0.5 font-mono text-[9px] text-[#fef08a] backdrop-blur hover:border-[#fef08a]"
                  >
                    → {other.settlement.split('(')[0].trim()} ({route.distanceKm} km)
                  </button>
                )
              })}

              {/* Marcos Geográficos da Região */}
              {landmarks.map((lm) => {
                const lp = toPct(region.x + lm.dx, region.y + lm.dy)
                return (
                  <div
                    key={lm.name}
                    style={{ left: `${lp.left}%`, top: `${lp.top}%`, transform: 'translate(-50%, -50%)' }}
                    className="pointer-events-none absolute text-center"
                  >
                    <span className="block font-serif text-[10px] italic tracking-wider text-[#e2e8f0] drop-shadow-[0_1px_3px_#000]">
                      {lm.name}
                    </span>
                    <span className="rounded bg-[#060b11]/75 px-1 font-mono text-[8px] uppercase text-[#94a3b8]">
                      {lm.tag}
                    </span>
                  </div>
                )
              })}

              {/* Casas Vassalas locais */}
              {localSubPins.map((pin) => {
                const h = houseById.get(pin.id)
                if (!h) return null
                const pos = toPct(pin.x, pin.y)
                const isActive = activeHouse?.id === h.id
                return (
                  <button
                    key={pin.id}
                    onClick={() => setFocusedHouseId(h.id)}
                    style={{ left: `${pos.left}%`, top: `${pos.top}%`, transform: 'translate(-50%, -50%)' }}
                    className={`absolute flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] transition ${
                      isActive
                        ? 'z-20 border-[#fef08a] bg-[#0b1014]/95 text-[#fef08a]'
                        : 'z-10 border-line-strong bg-[#0b1014]/85 text-ink hover:border-accent'
                    }`}
                  >
                    <HouseSigil house={h} size={14} />
                    <span className="font-mono font-medium">{h.name}</span>
                  </button>
                )
              })}

              {/* Estalagens, Bordéis, Zonas Livres e Entrepostos locais */}
              {localPois.map((poi) => {
                const pos = toPct(poi.x, poi.y)
                const st = POI_STYLE[poi.kind]
                return (
                  <div
                    key={poi.id}
                    title={`${st.badge}: ${poi.note}`}
                    style={{ left: `${pos.left}%`, top: `${pos.top}%`, transform: 'translate(-50%, -50%)' }}
                    className="absolute z-10 flex items-center gap-1 rounded border border-white/15 bg-[#0b1014]/85 px-1.5 py-0.5 font-mono text-[8.5px] text-[#e2e8f0]"
                  >
                    <span className="h-1.5 w-1.5 rotate-45" style={{ backgroundColor: st.color }} />
                    <span>{poi.name}</span>
                  </div>
                )
              })}

              {/* Sede Principal */}
              <button
                onClick={() => setFocusedHouseId(region.houseId)}
                style={{ left: `${seatPos.left}%`, top: `${seatPos.top}%`, transform: 'translate(-50%, -50%)' }}
                className="absolute z-20 flex flex-col items-center gap-1"
              >
                <div className="rounded-full border-2 border-[#fef08a] bg-[#0b1014]/90 p-1 shadow-lg">
                  <HouseSigil house={mainHouse} size={30} />
                </div>
                <span className="rounded bg-[#0b1014]/90 px-2 py-0.5 font-serif text-[11px] font-bold tracking-[0.14em] text-[#fef08a] shadow">
                  {mainHouse ? mainHouse.name.toUpperCase() : region.settlement.toUpperCase()}
                </span>
              </button>

              {/* Rosa dos Ventos e Escala */}
              <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-1 rounded bg-[#0b1014]/80 px-2 py-1 font-mono text-[10px] text-[#d6c3a1]">
                <Compass size={13} /> N
              </div>
              <div className="pointer-events-none absolute bottom-3 left-3 rounded bg-[#0b1014]/80 px-2 py-1 font-mono text-[10px] text-[#d6c3a1]">
                Escala Local · ~1.860 km × 1.860 km
              </div>
            </div>
          </div>

          {/* Painel Lateral de Lore + Rede de Rotas Conectadas */}
          <div className="space-y-4 overflow-y-auto p-5">
            {activeHouse && (
              <div className="rounded-lg border border-line bg-[#11161d] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-accent">
                      Casa em Foco · {activeHouse.tier}
                    </span>
                    <h3 className="font-serif text-lg font-bold text-ink-strong">Casa {activeHouse.name}</h3>
                    <p className="text-xs text-mute">
                      {activeHouse.seat} {activeHouse.motto ? `· "${activeHouse.motto}"` : ''}
                    </p>
                  </div>
                  <HouseSigil house={activeHouse} size={42} />
                </div>
                {activeHouse.vassalOf && (
                  <p className="mt-1.5 flex items-center gap-1 text-[11px] text-faint">
                    <Crown size={11} /> Vassala de {houseById.get(activeHouse.vassalOf)?.name ?? activeHouse.vassalOf}
                  </p>
                )}
                {activeHouse.territory && (
                  <p className="mt-2 text-xs leading-relaxed text-ink">{activeHouse.territory}</p>
                )}
              </div>
            )}

            <div className="rounded-lg border border-line bg-[#11161d] p-4">
              <p className="text-xs leading-relaxed text-ink">{region.description}</p>
              <p className="mt-2 text-xs text-mute">
                <strong className="text-accent">Clima:</strong> {region.climate}
              </p>
              <p className="mt-1 text-xs text-mute">
                <strong className="text-accent">Estratégia:</strong> {region.strategicNote}
              </p>
            </div>

            {regionHouses.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-faint">
                  <Shield size={12} /> Casas Presentes na Região
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {regionHouses.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => setFocusedHouseId(h.id)}
                      className={`rounded border px-2.5 py-1 text-xs transition ${
                        activeHouse?.id === h.id
                          ? 'border-accent bg-accent-soft text-accent'
                          : 'border-line bg-base text-mute hover:text-ink-strong'
                      }`}
                    >
                      {h.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-accent">
                <RouteIcon size={12} /> Rotas Conectadas para Toda Aerthel ({allSortedPaths.length})
              </h4>
              <div className="max-h-[240px] space-y-1.5 overflow-y-auto pr-1">
                {allSortedPaths.map((p) => {
                  const dest = regions.find((r) => r.id === p.targetId)
                  if (!dest) return null
                  const isSel = selectedRouteTargetId === dest.id
                  return (
                    <div
                      key={dest.id}
                      className={`rounded-lg border px-3 py-2 transition ${
                        isSel ? 'border-accent bg-accent-soft/40' : 'border-line bg-[#11161d]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => setSelectedRouteTargetId(isSel ? null : dest.id)}
                          className="flex min-w-0 items-center gap-1.5 text-left text-xs font-medium text-ink-strong hover:text-accent"
                        >
                          <MapPin size={12} className="shrink-0 text-accent" />
                          <span className="truncate">{dest.settlement}</span>
                        </button>
                        <span className="shrink-0 font-mono text-[10px] text-mute">
                          {p.totalKm} km · ~{p.totalDays}d · {p.hops} {p.hops === 1 ? 'trecho' : 'conexões'}
                        </span>
                      </div>
                      <p className="mt-1 font-mono text-[10px] text-faint">
                        {p.legs.map((l) => `${l.from.settlement.split('(')[0].trim()}`).join(' → ')} →{' '}
                        {dest.settlement.split('(')[0].trim()}
                      </p>
                      {isSel && canTravel && onTravelTo && (
                        <button
                          onClick={() => {
                            onTravelTo(dest.id, p.totalKm, p.legs[0]?.route.mode ?? 'estrada')
                            onClose()
                          }}
                          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded bg-accent-dim py-1 text-[11px] font-medium text-ink-strong hover:bg-accent/70"
                        >
                          <Navigation size={11} /> Viajar por esta rota ({p.totalKm} km)
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
