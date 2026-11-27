import { useMemo, useState } from 'react'
import { Crown, Map as MapIcon, MapPin, Route as RouteIcon, Shield } from 'lucide-react'
import type { House, Region, Route } from '../types/map'
import { POI_STYLE, type MapPoi } from '../data/pois'
import { buildConnectedNetwork, travelDays } from '../engine/routeGraph'
import AerthelEarthMap, { type SubPin } from './AerthelEarthMap'
import CartographicMap from './CartographicMap'
import HouseSigil from './HouseSigil'
import IsolatedRegionMapModal from './IsolatedRegionMapModal'

interface Props {
  regions: Region[]
  routes: Route[]
  houses: House[]
}

const SUB_HOUSE_PINS: SubPin[] = [
  { id: 'vardell', x: 175, y: 235, regionId: 'furna-negra' },
  { id: 'hausen', x: 560, y: 172, regionId: 'basgard' },
  { id: 'thornwall', x: 672, y: 185, regionId: 'basgard' },
  { id: 'vane', x: 428, y: 280, regionId: 'ruthless' },
  { id: 'hylton', x: 540, y: 255, regionId: 'ruthless' },
  { id: 'coolys', x: 445, y: 222, regionId: 'ruthless' },
  { id: 'corvin', x: 432, y: 392, regionId: 'veu-da-garganta' },
  { id: 'vallen', x: 515, y: 535, regionId: 'solar-outonal' },
  { id: 'merrick', x: 375, y: 632, regionId: 'solar-outonal' },
  { id: 'goldwyn', x: 242, y: 575, regionId: 'solar-outonal' },
  { id: 'eisenhart', x: 455, y: 572, regionId: 'solar-outonal' },
  { id: 'albion', x: 192, y: 558, regionId: 'solar-outonal' },
  { id: 'dornel', x: 285, y: 548, regionId: 'solar-outonal' },
  { id: 'brekker', x: 422, y: 595, regionId: 'solar-outonal' },
  { id: 'stroud', x: 268, y: 628, regionId: 'solar-outonal' },
  { id: 'lindel', x: 342, y: 658, regionId: 'solar-outonal' },
  { id: 'vaelmont', x: 682, y: 608, regionId: 'vermer' },
  { id: 'crayne', x: 535, y: 602, regionId: 'vermer' },
  { id: 'halcyon', x: 615, y: 562, regionId: 'vermer' },
  { id: 'avernus', x: 558, y: 532, regionId: 'vermer' },
  { id: 'aquila', x: 495, y: 632, regionId: 'vermer' },
  { id: 'aurelia', x: 652, y: 688, regionId: 'vermer' },
  { id: 'saiget', x: 572, y: 638, regionId: 'vermer' },
  { id: 'marlow', x: 642, y: 585, regionId: 'vermer' },
  { id: 'oster', x: 598, y: 678, regionId: 'vermer' },
  { id: 'belvar', x: 695, y: 658, regionId: 'vermer' },
  { id: 'serrett', x: 668, y: 555, regionId: 'vermer' },
  { id: 'voss', x: 505, y: 575, regionId: 'vermer' },
  { id: 'talren', x: 392, y: 742, regionId: 'fortaleza-do-grifo' },
  { id: 'corvell', x: 498, y: 745, regionId: 'fortaleza-do-grifo' },
  { id: 'alder', x: 565, y: 755, regionId: 'fortaleza-do-grifo' },
  { id: 'crux', x: 412, y: 808, regionId: 'fortaleza-do-grifo' },
  { id: 'lysmont', x: 452, y: 715, regionId: 'fortaleza-do-grifo' },
  { id: 'volya', x: 612, y: 742, regionId: 'fortaleza-do-grifo' },
  { id: 'hart', x: 605, y: 790, regionId: 'fortaleza-do-grifo' },
  { id: 'fenwick', x: 535, y: 822, regionId: 'fortaleza-do-grifo' },
  { id: 'brask', x: 358, y: 768, regionId: 'fortaleza-do-grifo' },
  { id: 'moroz', x: 742, y: 542, regionId: 'cabo-da-cinza' },
  { id: 'bosphor', x: 715, y: 692, regionId: 'cabo-da-cinza' },
  { id: 'rook', x: 780, y: 625, regionId: 'cabo-da-cinza' },
  { id: 'draven', x: 702, y: 642, regionId: 'cabo-da-cinza' },
  { id: 'cael', x: 738, y: 782, regionId: 'cabo-da-cinza' },
  { id: 'baekho', x: 805, y: 655, regionId: 'cabo-da-cinza' },
  { id: 'velkor', x: 792, y: 722, regionId: 'cabo-da-cinza' },
  { id: 'solen', x: 748, y: 585, regionId: 'cabo-da-cinza' },
  { id: 'marrow', x: 718, y: 748, regionId: 'cabo-da-cinza' },
  { id: 'morvain', x: 685, y: 735, regionId: 'cabo-da-cinza' },
  { id: 'asahi', x: 688, y: 672, regionId: 'cabo-da-cinza' },
  { id: 'longar', x: 775, y: 772, regionId: 'cabo-da-cinza' },
  { id: 'varn', x: 215, y: 865, regionId: 'ilhas-da-serpente' },
  { id: 'drek', x: 282, y: 768, regionId: 'ilhas-da-serpente' },
  { id: 'kestrel', x: 132, y: 845, regionId: 'ilhas-da-serpente' },
  { id: 'silt', x: 168, y: 742, regionId: 'ilhas-da-serpente' },
  { id: 'khai', x: 350, y: 925, regionId: 'oasis-de-ambar' },
  { id: 'vashar', x: 565, y: 915, regionId: 'oasis-de-ambar' },
  { id: 'parsa', x: 625, y: 928, regionId: 'oasis-de-ambar' },
  { id: 'qaydar', x: 395, y: 958, regionId: 'oasis-de-ambar' },
  { id: 'zaydan', x: 682, y: 895, regionId: 'oasis-de-ambar' },
  { id: 'davidon', x: 518, y: 862, regionId: 'oasis-de-ambar' },
  { id: 'zahhir', x: 645, y: 880, regionId: 'oasis-de-ambar' },
  { id: 'mafteac', x: 485, y: 952, regionId: 'oasis-de-ambar' },
  { id: 'osken', x: 290, y: 890, regionId: 'oasis-de-ambar' },
]

const TIER_LABEL: Record<string, string> = {
  coroa: 'Coroa',
  soberana: 'Casa Soberana',
  maior: 'Maior Vassala',
  menor: 'Menor Vassala',
  estrangeira: 'Estrangeira',
}

export default function MapModuleView({ regions, routes, houses }: Props) {
  const [selectedId, setSelectedId] = useState<string>('vermer')
  const [focusedHouseId, setFocusedHouseId] = useState<string | null>(null)
  const [showSubHouses, setShowSubHouses] = useState(true)
  const [showAllRoutes, setShowAllRoutes] = useState(true)
  const [showPois, setShowPois] = useState(true)
  const [selectedPoi, setSelectedPoi] = useState<MapPoi | null>(null)
  const [macroFilter, setMacroFilter] = useState<string>('')
  const [routeTargetId, setRouteTargetId] = useState<string>('')
  const [isolatedRegionId, setIsolatedRegionId] = useState<string | null>(null)
  const [mapMode, setMapMode] = useState<'3d' | 'carto'>('3d')

  const houseById = useMemo(() => new Map(houses.map((h) => [h.id, h])), [houses])
  const selected = regions.find((r) => r.id === selectedId) ?? regions[0]
  const activeHouse =
    (focusedHouseId ? houseById.get(focusedHouseId) : null) ??
    (selected.houseId ? houseById.get(selected.houseId) ?? null : null)

  const macros = useMemo(() => [...new Set(regions.map((r) => r.macroRegion))], [regions])

  const connectedRoutes = useMemo(
    () =>
      routes
        .filter((rt) => rt.fromId === selected.id || rt.toId === selected.id)
        .map((rt) => {
          const otherId = rt.fromId === selected.id ? rt.toId : rt.fromId
          const other = regions.find((r) => r.id === otherId)!
          return { route: rt, other, days: travelDays(rt) }
        }),
    [routes, regions, selected.id],
  )

  const regionHouses = useMemo(() => {
    const map = new Map<string, House[]>()
    for (const h of houses) {
      const pin = SUB_HOUSE_PINS.find((p) => p.id === h.id)
      const rid =
        pin?.regionId ??
        regions.find((r) => r.houseId === h.id)?.id ??
        (h.vassalOf ? regions.find((r) => r.houseId === h.vassalOf)?.id : undefined)
      if (rid) map.set(rid, [...(map.get(rid) ?? []), h])
    }
    return map
  }, [houses, regions])

  const network = useMemo(() => buildConnectedNetwork(regions, routes, selected.id), [regions, routes, selected.id])
  const activeRoutePlan = routeTargetId && routeTargetId !== selected.id ? network.paths.get(routeTargetId) ?? null : null
  const activePathRouteIds = useMemo(
    () => new Set(activeRoutePlan?.legs.map((l) => l.route.id) ?? []),
    [activeRoutePlan],
  )

  const filteredRegions = regions.filter((r) => !macroFilter || r.macroRegion === macroFilter)
  const isolatedRegion = isolatedRegionId ? regions.find((r) => r.id === isolatedRegionId) ?? null : null

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <section className="rounded-xl border border-line bg-card p-4">
        <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-serif text-xl font-semibold text-ink-strong">Aerthel · Atlas Geopolítico</h2>
            <p className="font-mono text-[11px] text-faint">
              6.000 km Norte–Sul · {houses.length} casas · {routes.length} rotas · 26 pontos de interesse
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-md border border-line-strong bg-base p-0.5 text-xs">
              <button
                onClick={() => setMapMode('3d')}
                className={`rounded px-2.5 py-1 transition ${
                  mapMode === '3d' ? 'bg-accent-soft text-accent' : 'text-mute hover:text-ink-strong'
                }`}
              >
                Satélite 3D
              </button>
              <button
                onClick={() => setMapMode('carto')}
                className={`rounded px-2.5 py-1 transition ${
                  mapMode === 'carto' ? 'bg-accent-soft text-accent' : 'text-mute hover:text-ink-strong'
                }`}
              >
                Mapa Cartográfico
              </button>
            </div>
            <button
              onClick={() => setShowAllRoutes((s) => !s)}
              className={`rounded-md border px-2.5 py-1 text-xs transition ${
                showAllRoutes ? 'border-accent-dim bg-accent-soft text-accent' : 'border-line-strong text-mute'
              }`}
            >
              {showAllRoutes ? 'Todas as Rotas' : 'Só Rotas Ativas'}
            </button>
            <button
              onClick={() => setShowSubHouses((s) => !s)}
              className={`rounded-md border px-2.5 py-1 text-xs transition ${
                showSubHouses ? 'border-accent-dim bg-accent-soft text-accent' : 'border-line-strong text-mute'
              }`}
            >
              {showSubHouses ? `${houses.length} Casas` : 'Só Principais'}
            </button>
            <button
              onClick={() => setShowPois((s) => !s)}
              className={`rounded-md border px-2.5 py-1 text-xs transition ${
                showPois ? 'border-accent-dim bg-accent-soft text-accent' : 'border-line-strong text-mute'
              }`}
            >
              {showPois ? 'Lugares & POIs' : 'Sem POIs'}
            </button>
            <select value={macroFilter} onChange={(e) => setMacroFilter(e.target.value)} className="w-auto text-xs">
              <option value="">Todo o Continente</option>
              {macros.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
        </header>

        {mapMode === '3d' ? (
          <AerthelEarthMap
            regions={filteredRegions}
            routes={routes}
            houses={houses}
            houseById={houseById}
            subPins={SUB_HOUSE_PINS}
            selectedRegionId={selected.id}
            currentRegionId=""
            focusedHouseId={focusedHouseId}
            showSubHouses={showSubHouses}
            showAllRoutes={showAllRoutes}
            showPois={showPois}
            connectedTreeRouteIds={network.treeRouteIds}
            activePathRouteIds={activePathRouteIds}
            onSelectRegion={(rid, hid) => {
              setSelectedId(rid)
              setFocusedHouseId(hid)
              setSelectedPoi(null)
              if (routeTargetId === rid) setRouteTargetId('')
            }}
            onSelectPoi={(poi) => setSelectedPoi(poi)}
            onOpenIsolatedMap={(rid) => setIsolatedRegionId(rid)}
          />
        ) : (
          <CartographicMap
            regions={filteredRegions}
            routes={routes}
            houseById={houseById}
            subPins={SUB_HOUSE_PINS}
            selectedRegionId={selected.id}
            currentRegionId=""
            focusedHouseId={focusedHouseId}
            showSubHouses={showSubHouses}
            showAllRoutes={showAllRoutes}
            showPois={showPois}
            connectedTreeRouteIds={network.treeRouteIds}
            activePathRouteIds={activePathRouteIds}
            onSelectRegion={(rid, hid) => {
              setSelectedId(rid)
              setFocusedHouseId(hid)
              setSelectedPoi(null)
              if (routeTargetId === rid) setRouteTargetId('')
            }}
            onSelectPoi={(poi) => setSelectedPoi(poi)}
            onOpenIsolatedMap={(rid) => setIsolatedRegionId(rid)}
          />
        )}
      </section>

      <aside className="space-y-4">
        <div className="rounded-xl border border-line bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">
                {selected.macroRegion} · {selected.terrain}
              </span>
              <h3 className="mt-0.5 font-serif text-2xl font-semibold text-ink-strong">{selected.settlement}</h3>
              <p className="text-xs text-mute">{selected.name}</p>
            </div>
            <HouseSigil house={activeHouse} size={48} />
          </div>

          {selectedPoi && (
            <div className="mt-3 rounded-lg border border-amber-500/35 bg-base p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-serif text-sm font-semibold text-ink-strong">{selectedPoi.name}</span>
                <span
                  className="rounded px-2 py-0.5 font-mono text-[9.5px] font-semibold uppercase text-[#0b1014]"
                  style={{ backgroundColor: POI_STYLE[selectedPoi.kind].color }}
                >
                  {POI_STYLE[selectedPoi.kind].badge}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-mute">{selectedPoi.note}</p>
            </div>
          )}

          {activeHouse && (
            <div className="mt-3 rounded-lg border border-line bg-base p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-serif text-base font-semibold text-ink-strong">Casa {activeHouse.name}</span>
                <span className="rounded border border-accent-dim/60 bg-accent-soft px-2 py-0.5 font-mono text-[10px] uppercase text-accent">
                  {TIER_LABEL[activeHouse.tier ?? 'menor']}
                </span>
              </div>
              <p className="text-xs text-mute">
                {activeHouse.seat} {activeHouse.motto ? `· "${activeHouse.motto}"` : ''}
              </p>
              {activeHouse.vassalOf && (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-faint">
                  <Crown size={11} /> Vassala de {houseById.get(activeHouse.vassalOf)?.name ?? activeHouse.vassalOf}
                </p>
              )}
              {activeHouse.territory && (
                <p className="mt-1.5 text-xs leading-relaxed text-ink">{activeHouse.territory}</p>
              )}
            </div>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-xs">
            <div className="rounded border border-line bg-base px-3 py-2">
              <span className="block text-[10px] text-faint">POSIÇÃO NO MAPA</span>
              <span className="text-ink-strong">{selected.kmNorth} km / 6.000 km</span>
            </div>
            <div className="rounded border border-line bg-base px-3 py-2">
              <span className="block text-[10px] text-faint">CLIMA</span>
              <span className="line-clamp-1 text-ink-strong">{selected.climate}</span>
            </div>
          </div>

          <p className="mt-3 text-[13px] leading-relaxed text-ink">{selected.description}</p>
          <p className="mt-2 rounded border border-line bg-base p-2.5 text-xs text-mute">
            <strong className="text-accent">Estratégia:</strong> {selected.strategicNote}
          </p>

          {(regionHouses.get(selected.id)?.length ?? 0) > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-faint">
                <Shield size={11} /> Casas presentes nesta região
              </p>
              <div className="flex flex-wrap gap-1.5">
                {regionHouses.get(selected.id)!.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => setFocusedHouseId(h.id)}
                    className={`rounded border px-2 py-0.5 text-xs transition ${
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

          <button
            onClick={() => setIsolatedRegionId(selected.id)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-[#d6c3a1]/45 bg-[#0b1014] py-2 text-xs font-medium text-[#fef08a] transition hover:border-[#fef08a]"
          >
            <MapIcon size={13} /> Abrir Mapa Isolado de {selected.settlement.split('(')[0].trim()}
          </button>
        </div>

        <div className="rounded-xl border border-line bg-card p-5">
          <h4 className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
            <RouteIcon size={13} /> Rotas Conectadas a partir de {selected.settlement.split('(')[0].trim()}
          </h4>

          <div className="mb-3">
            <label className="mb-1 block font-mono text-[10px] uppercase text-faint">
              Traçar rota (direta ou com conexões) até:
            </label>
            <select
              value={routeTargetId}
              onChange={(e) => setRouteTargetId(e.target.value)}
              className="w-full rounded border border-line-strong bg-base px-2.5 py-1.5 text-xs text-ink-strong"
            >
              <option value="">-- Rede completa conectada (todas as casas) --</option>
              {regions
                .filter((r) => r.id !== selected.id)
                .map((r) => {
                  const plan = network.paths.get(r.id)
                  return (
                    <option key={r.id} value={r.id}>
                      {r.settlement} {plan ? `(${plan.totalKm} km · ${plan.hops} ${plan.hops === 1 ? 'trecho' : 'conexões'})` : ''}
                    </option>
                  )
                })}
            </select>

            {activeRoutePlan && (
              <div className="mt-2 rounded-lg border border-emerald-500/40 bg-emerald-950/25 p-2.5 text-xs">
                <div className="flex items-center justify-between font-mono text-[11px] text-emerald-300">
                  <span>Caminho Traçado ({activeRoutePlan.hops} {activeRoutePlan.hops === 1 ? 'trecho' : 'etapas'})</span>
                  <span>
                    {activeRoutePlan.totalKm} km · ~{activeRoutePlan.totalDays}d
                  </span>
                </div>
                <div className="mt-1.5 space-y-1">
                  {activeRoutePlan.legs.map((leg, i) => (
                    <div key={leg.route.id} className="flex items-center justify-between text-[11px] text-ink">
                      <span>
                        {i + 1}. {leg.from.settlement.split('(')[0].trim()} → {leg.to.settlement.split('(')[0].trim()}
                      </span>
                      <span className="font-mono text-[10px] text-mute">
                        {leg.route.mode} · {leg.route.distanceKm} km
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <p className="mb-2 font-mono text-[10px] uppercase text-faint">
            Conexões diretas ({connectedRoutes.length})
          </p>
          <div className="max-h-[220px] space-y-2 overflow-y-auto pr-1">
            {connectedRoutes.map(({ route, other, days }) => (
              <button
                key={route.id}
                onClick={() => {
                  setSelectedId(other.id)
                  setFocusedHouseId(other.houseId)
                }}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-line bg-base px-3 py-2 text-left transition hover:border-accent-dim"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-ink-strong">
                    <MapPin size={12} className="text-accent" /> {other.settlement}
                  </p>
                  <p className="truncate text-[11px] text-faint">{route.note}</p>
                </div>
                <div className="shrink-0 text-right font-mono text-[11px]">
                  <span className="block text-ink-strong">{route.distanceKm} km</span>
                  <span className="text-mute">
                    {route.mode} · ~{days}d
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {isolatedRegion && (
        <IsolatedRegionMapModal
          region={isolatedRegion}
          regions={regions}
          routes={routes}
          houseById={houseById}
          subPins={SUB_HOUSE_PINS}
          regionHouses={regionHouses.get(isolatedRegion.id) ?? []}
          networkPaths={buildConnectedNetwork(regions, routes, isolatedRegion.id).paths}
          onClose={() => setIsolatedRegionId(null)}
          onSelectDestination={(rid) => {
            setSelectedId(isolatedRegion.id)
            setRouteTargetId(rid)
            setIsolatedRegionId(null)
          }}
        />
      )}
    </div>
  )
}
