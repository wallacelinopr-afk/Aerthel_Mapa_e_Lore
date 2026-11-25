import { useState, type WheelEvent, type MouseEvent } from 'react'
import { Compass, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import type { House, Region, Route } from '../types/map'
import { MAP_POIS, POI_STYLE, type MapPoi } from '../data/pois'
import type { SubPin } from './AerthelEarthMap'
import HouseSigil from './HouseSigil'

interface Props {
  regions: Region[]
  routes: Route[]
  houseById: Map<string, House>
  subPins: SubPin[]
  selectedRegionId: string
  currentRegionId: string
  focusedHouseId: string | null
  showSubHouses: boolean
  showAllRoutes: boolean
  showPois?: boolean
  connectedTreeRouteIds?: Set<string>
  activePathRouteIds?: Set<string>
  onSelectRegion: (regionId: string, houseId: string | null) => void
  onSelectPoi?: (poi: MapPoi) => void
  onOpenIsolatedMap?: (regionId: string) => void
}

const CONTINENT_MAIN =
  'M 165,65 L 350,40 L 580,55 L 775,50 L 720,165 L 660,210 L 650,275 L 710,335 L 735,415 L 680,465 L 690,520 L 770,565 L 815,675 L 765,755 L 690,815 L 725,915 L 620,965 L 365,968 L 285,910 L 345,845 L 435,795 L 445,730 L 365,675 L 250,625 L 285,555 L 210,515 L 185,445 L 130,380 L 135,260 L 145,140 Z'

const SKALMARK_ISLANDS = [
  'M 120,685 L 215,675 L 235,755 L 165,795 L 105,745 Z',
  'M 135,815 L 225,805 L 245,910 L 175,935 L 120,880 Z',
]

const CARTO_RIVERS: string[] = [
  'M 270,175 Q 248,235 272,295 T 122,378',
  'M 432,275 Q 365,315 250,348',
  'M 415,165 Q 448,280 448,468',
  'M 590,185 Q 618,305 735,435',
  'M 392,516 Q 355,585 238,622',
  'M 548,632 Q 505,700 445,790',
  'M 595,625 Q 665,668 748,696',
]

const MOUNTAINS: [number, number, number][] = [
  [230, 105, 1.2], [285, 92, 1.3], [345, 108, 1.2], [395, 130, 1.1],
  [200, 165, 1.0], [375, 200, 1.1], [545, 125, 1.0], [630, 165, 1.1],
  [585, 345, 1.0], [645, 365, 1.1],
]

export default function CartographicMap({
  regions,
  routes,
  houseById,
  subPins,
  selectedRegionId,
  currentRegionId,
  focusedHouseId,
  showSubHouses,
  showAllRoutes,
  showPois = true,
  connectedTreeRouteIds,
  activePathRouteIds,
  onSelectRegion,
  onSelectPoi,
  onOpenIsolatedMap,
}: Props) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState<{ x: number; y: number } | null>(null)

  const rMap = new Map(regions.map((r) => [r.id, r]))

  const onWheel = (e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.15 : 0.15
    setZoom((z) => Math.min(3.4, Math.max(0.9, +(z + delta).toFixed(2))))
  }

  const onMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    setDragging({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }
  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!dragging) return
    setPan({ x: e.clientX - dragging.x, y: e.clientY - dragging.y })
  }
  const onMouseUp = () => setDragging(null)

  return (
    <div
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      className="relative h-[calc(100vh-190px)] min-h-[740px] w-full cursor-grab overflow-hidden rounded-lg border border-[#d6c3a1]/35 bg-[#12161c] active:cursor-grabbing"
    >
      {/* Controles de zoom */}
      <div className="absolute left-3 top-3 z-20 flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setZoom((z) => Math.min(3.4, +(z + 0.3).toFixed(2)))}
          className="flex items-center gap-1 rounded border border-[#d6c3a1]/40 bg-[#0b1014]/90 px-2 py-1 text-[11px] text-[#e8dcc4] hover:border-[#fef08a]"
        >
          <ZoomIn size={13} /> Aproximar
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.9, +(z - 0.3).toFixed(2)))}
          className="flex items-center gap-1 rounded border border-[#d6c3a1]/40 bg-[#0b1014]/90 px-2 py-1 text-[11px] text-[#e8dcc4] hover:border-[#fef08a]"
        >
          <ZoomOut size={13} /> Afastar
        </button>
        <button
          onClick={() => {
            setZoom(1)
            setPan({ x: 0, y: 0 })
          }}
          className="flex items-center gap-1 rounded border border-[#d6c3a1]/40 bg-[#0b1014]/90 px-2 py-1 text-[11px] text-[#e8dcc4] hover:border-[#fef08a]"
        >
          <RotateCcw size={12} /> Resetar
        </button>
        {onOpenIsolatedMap && (
          <button
            onClick={() => onOpenIsolatedMap(selectedRegionId)}
            className="rounded border border-[#fef08a]/50 bg-[#0b1014]/90 px-2.5 py-1 text-[11px] text-[#fef08a] hover:border-[#fef08a]"
          >
            Mapa Isolado da Região
          </button>
        )}
      </div>

      {/* Área transformável */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
        }}
        className="relative mx-auto aspect-square h-full max-h-[820px] select-none transition-transform duration-75"
      >
        <svg viewBox="0 0 1000 1000" className="h-full w-full">
          <defs>
            <radialGradient id="cartoSea" cx="50%" cy="50%" r="65%">
              <stop offset="0%" stopColor="#1b2633" />
              <stop offset="100%" stopColor="#0d1218" />
            </radialGradient>
            <linearGradient id="landParchment" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#464d56" />
              <stop offset="45%" stopColor="#35393e" />
              <stop offset="52%" stopColor="#3c4330" />
              <stop offset="80%" stopColor="#46442f" />
              <stop offset="100%" stopColor="#7c6343" />
            </linearGradient>
            <pattern id="rhumbGrid" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#d6c3a1" strokeOpacity="0.06" strokeWidth="0.8" />
            </pattern>
          </defs>

          {/* Mar Cartográfico e linhas de rumo */}
          <rect width="1000" height="1000" fill="url(#cartoSea)" />
          <rect width="1000" height="1000" fill="url(#rhumbGrid)" />
          <g stroke="#d6c3a1" strokeOpacity="0.08" strokeWidth="0.8">
            <line x1="870" y1="860" x2="100" y2="120" />
            <line x1="870" y1="860" x2="100" y2="860" />
            <line x1="870" y1="860" x2="870" y2="60" />
            <line x1="870" y1="860" x2="420" y2="40" />
          </g>

          {/* Continente & Ilhas */}
          <path d={CONTINENT_MAIN} fill="url(#landParchment)" stroke="#d6c3a1" strokeOpacity="0.55" strokeWidth="2.2" />
          <path d={CONTINENT_MAIN} fill="none" stroke="#0b1014" strokeOpacity="0.45" strokeWidth="5" />
          {SKALMARK_ISLANDS.map((d, i) => (
            <path key={i} d={d} fill="#3f4634" stroke="#d6c3a1" strokeOpacity="0.55" strokeWidth="2" />
          ))}

          {/* Biomas cartográficos sutis */}
          <ellipse cx="290" cy="575" rx="95" ry="52" fill="#9a3412" fillOpacity="0.22" />
          <ellipse cx="735" cy="675" rx="65" ry="90" fill="#166534" fillOpacity="0.22" />
          <ellipse cx="240" cy="335" rx="90" ry="60" fill="#14532d" fillOpacity="0.24" />
          <ellipse cx="520" cy="915" rx="175" ry="48" fill="#ca8a04" fillOpacity="0.16" />

          {/* Cordilheiras (hachuras de montanha estilo medieval) */}
          {MOUNTAINS.map(([mx, my, sc], i) => (
            <g key={i} transform={`translate(${mx},${my}) scale(${sc})`} stroke="#e2e8f0" strokeOpacity="0.5" fill="none" strokeWidth="1.4">
              <path d="M -22,12 L 0,-18 L 22,12" />
              <path d="M -12,12 L 5,-10 L 20,12" strokeOpacity="0.35" />
              <path d="M -4,-12 L 0,-18 L 4,-12" fill="#e2e8f0" fillOpacity="0.45" />
            </g>
          ))}

          {/* Rios cartográficos */}
          {CARTO_RIVERS.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="#38bdf8" strokeOpacity="0.65" strokeWidth="2.4" strokeLinecap="round" />
          ))}

          {/* Muralha Tripla */}
          {[462, 474, 507].map((wy, idx) => (
            <g key={wy}>
              <line x1="165" y1={wy} x2="745" y2={wy} stroke="#e2e8f0" strokeWidth={idx === 1 ? 2.5 : 3.2} strokeOpacity="0.85" />
              <line x1="165" y1={wy} x2="745" y2={wy} stroke="#0b1014" strokeWidth="1" strokeDasharray="12 18" />
            </g>
          ))}
          <text x="340" y="495" fill="#cbd5e1" fontSize="11" fontFamily="serif" letterSpacing="4" opacity="0.85">
            MURALHA TRIPLA · FREYA · FRIGG · SKADI
          </text>

          {/* Rótulos geográficos */}
          <text x="745" y="245" fill="#93c5fd" fontSize="14" fontFamily="serif" fontStyle="italic" letterSpacing="3" opacity="0.7">
            MAR DE GELO
          </text>
          <text x="765" y="545" fill="#93c5fd" fontSize="12" fontFamily="serif" fontStyle="italic" letterSpacing="2" opacity="0.65">
            GOLFO ORIENTAL
          </text>
          <text x="485" y="948" fill="#fde68a" fontSize="12" fontFamily="serif" fontStyle="italic" letterSpacing="3" opacity="0.65">
            DESERTO DE ÂMBAR
          </text>

          {/* Rotas Conectadas */}
          {routes.map((rt) => {
            const a = rMap.get(rt.fromId)
            const b = rMap.get(rt.toId)
            if (!a || !b) return null
            const isDirect = a.id === selectedRegionId || b.id === selectedRegionId
            const isInTree = connectedTreeRouteIds?.has(rt.id) ?? false
            const isActivePath = activePathRouteIds?.has(rt.id) ?? false
            if (!showAllRoutes && !isDirect && !isInTree && !isActivePath) return null

            const stroke = isActivePath
              ? '#4ade80'
              : rt.mode === 'mar'
                ? '#67e8f9'
                : rt.mode === 'rio'
                  ? '#93c5fd'
                  : isDirect || isInTree
                    ? '#fbbf24'
                    : '#d6c3a1'
            const opacity = isActivePath ? 1 : isDirect ? 0.92 : isInTree ? 0.65 : 0.25
            const width = isActivePath ? 3.5 : isDirect ? 2.4 : isInTree ? 1.8 : 1.1

            return (
              <line
                key={rt.id}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={stroke}
                strokeWidth={width}
                strokeOpacity={opacity}
                strokeDasharray={rt.mode === 'mar' ? '6 4' : isInTree && !isDirect ? '4 3' : undefined}
              />
            )
          })}

          {/* Rosa dos Ventos & Escala */}
          <g transform="translate(885, 875)" opacity="0.8">
            <circle r="38" fill="#0b1014" fillOpacity="0.65" stroke="#d6c3a1" strokeWidth="1.2" />
            <path d="M 0,-34 L 7,-7 L 34,0 L 7,7 L 0,34 L -7,7 L -34,0 L -7,-7 Z" fill="#d6c3a1" fillOpacity="0.35" stroke="#d6c3a1" strokeWidth="1" />
            <text x="0" y="-42" textAnchor="middle" fill="#fef08a" fontSize="11" fontFamily="serif">N</text>
          </g>
          <g transform="translate(760, 955)">
            <line x1="0" y1="0" x2="180" y2="0" stroke="#d6c3a1" strokeWidth="2" />
            <line x1="0" y1="-5" x2="0" y2="5" stroke="#d6c3a1" strokeWidth="2" />
            <line x1="90" y1="-4" x2="90" y2="4" stroke="#d6c3a1" strokeWidth="1.5" />
            <line x1="180" y1="-5" x2="180" y2="5" stroke="#d6c3a1" strokeWidth="2" />
            <text x="0" y="16" fill="#d6c3a1" fontSize="10" fontFamily="monospace">0</text>
            <text x="76" y="16" fill="#d6c3a1" fontSize="10" fontFamily="monospace">3.000</text>
            <text x="155" y="16" fill="#d6c3a1" fontSize="10" fontFamily="monospace">6.000 km</text>
          </g>
        </svg>

        {/* Pinos das Casas Vassalas */}
        {showSubHouses &&
          subPins.map((pin) => {
            const h = houseById.get(pin.id)
            if (!h) return null
            const isSel = focusedHouseId === h.id
            return (
              <button
                key={pin.id}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectRegion(pin.regionId, h.id)
                }}
                style={{ left: `${pin.x / 10}%`, top: `${pin.y / 10}%`, transform: 'translate(-50%, -50%)' }}
                className={`absolute flex items-center gap-1 rounded px-1 py-0.5 font-mono text-[9px] transition ${
                  isSel ? 'z-20 bg-[#0b1014]/90 text-[#fef08a]' : 'z-0 text-[#cbd5e1]/85 hover:text-white'
                }`}
              >
                <HouseSigil house={h} size={13} />
                {h.name}
              </button>
            )
          })}

        {/* Estalagens, Bordéis, Zonas Livres e Entrepostos */}
        {showPois &&
          MAP_POIS.map((poi) => {
            const st = POI_STYLE[poi.kind]
            return (
              <button
                key={poi.id}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectRegion(poi.regionId, null)
                  onSelectPoi?.(poi)
                }}
                title={`${st.badge}: ${poi.name} — ${poi.note}`}
                style={{ left: `${poi.x / 10}%`, top: `${poi.y / 10}%`, transform: 'translate(-50%, -50%)' }}
                className="group absolute z-10 flex items-center gap-1 rounded border border-white/15 bg-[#0b1014]/80 px-1 py-0.5 font-mono text-[8px] text-[#e2e8f0] hover:z-30 hover:border-[#fef08a]"
              >
                <span className="h-1.5 w-1.5 rotate-45" style={{ backgroundColor: st.color }} />
                {zoom >= 1.35 && <span className="whitespace-nowrap">{poi.name}</span>}
              </button>
            )
          })}

        {/* Pinos das 14 Regiões com Brasões */}
        {regions.map((r) => {
          const house = r.houseId ? houseById.get(r.houseId) ?? null : null
          const isSel = selectedRegionId === r.id
          const isHere = currentRegionId === r.id
          const title = r.id === 'vermer' ? 'VERMER · COROA' : (house ? house.name : r.settlement).toUpperCase()
          return (
            <button
              key={r.id}
              onClick={(e) => {
                e.stopPropagation()
                onSelectRegion(r.id, r.houseId)
              }}
              onDoubleClick={(e) => {
                e.stopPropagation()
                onOpenIsolatedMap?.(r.id)
              }}
              style={{ left: `${r.x / 10}%`, top: `${r.y / 10}%`, transform: 'translate(-50%, -50%)' }}
              className={`absolute flex flex-col items-center gap-0.5 transition ${isSel ? 'z-20 scale-105' : 'z-10 hover:scale-105'}`}
            >
              <div
                className={`rounded-full border p-0.5 shadow ${
                  isSel ? 'border-[#fef08a] bg-[#0b1014]' : 'border-[#d6c3a1]/60 bg-[#0b1014]/85'
                }`}
              >
                <HouseSigil house={house} size={20} />
              </div>
              <span
                style={{ textShadow: '0 1px 3px #000' }}
                className={`flex items-center gap-1 whitespace-nowrap font-serif text-[10.5px] font-bold tracking-[0.14em] ${
                  isSel ? 'text-[#fef08a]' : 'text-[#f1ece1]'
                }`}
              >
                {isHere && (
                  <span
                    title="Você está aqui"
                    className="inline-block h-2 w-2 rounded-full border border-white bg-[#facc15]"
                  />
                )}
                {title}
              </span>
            </button>
          )
        })}
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 rounded bg-[#0b1014]/85 px-2.5 py-1 font-mono text-[10px] text-[#d6c3a1] backdrop-blur">
        <Compass size={12} /> Mapa Cartográfico · Roda: zoom · Arraste: mover · Clique duplo: Atlas Isolado
      </div>
    </div>
  )
}
