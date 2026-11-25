import type { Region, Route } from '../types/map'

export interface RouteLeg {
  route: Route
  from: Region
  to: Region
  days: number
}

export interface ShortestPathResult {
  originId: string
  targetId: string
  pathRegionIds: string[]
  legs: RouteLeg[]
  totalKm: number
  totalDays: number
  hops: number
}

export function travelDays(route: Route): number {
  const kmPerDay = route.mode === 'mar' ? 140 : route.mode === 'rio' ? 95 : route.mode === 'trilha' ? 40 : 55
  return Math.max(1, Math.round(route.distanceKm / kmPerDay))
}

export function buildConnectedNetwork(
  regions: Region[],
  routes: Route[],
  originId: string,
): {
  paths: Map<string, ShortestPathResult>
  treeRouteIds: Set<string>
} {
  const regionMap = new Map(regions.map((r) => [r.id, r]))
  const adj = new Map<string, { nextId: string; route: Route }[]>()
  for (const r of regions) adj.set(r.id, [])
  for (const rt of routes) {
    if (!regionMap.has(rt.fromId) || !regionMap.has(rt.toId)) continue
    adj.get(rt.fromId)!.push({ nextId: rt.toId, route: rt })
    adj.get(rt.toId)!.push({ nextId: rt.fromId, route: rt })
  }

  const dist = new Map<string, number>()
  const prev = new Map<string, { fromId: string; route: Route } | null>()
  const visited = new Set<string>()

  for (const r of regions) {
    dist.set(r.id, r.id === originId ? 0 : Infinity)
    prev.set(r.id, null)
  }

  while (visited.size < regions.length) {
    let u: string | null = null
    let best = Infinity
    for (const r of regions) {
      if (!visited.has(r.id) && (dist.get(r.id) ?? Infinity) < best) {
        best = dist.get(r.id) ?? Infinity
        u = r.id
      }
    }
    if (!u || best === Infinity) break
    visited.add(u)

    for (const edge of adj.get(u) ?? []) {
      if (visited.has(edge.nextId)) continue
      const alt = best + edge.route.distanceKm
      if (alt < (dist.get(edge.nextId) ?? Infinity)) {
        dist.set(edge.nextId, alt)
        prev.set(edge.nextId, { fromId: u, route: edge.route })
      }
    }
  }

  const paths = new Map<string, ShortestPathResult>()
  const treeRouteIds = new Set<string>()

  for (const r of regions) {
    if (r.id === originId) continue
    if ((dist.get(r.id) ?? Infinity) === Infinity) continue

    const pathRegionIds: string[] = []
    const legs: RouteLeg[] = []
    let cur: string | null = r.id

    while (cur && cur !== originId) {
      pathRegionIds.unshift(cur)
      const p = prev.get(cur)
      if (!p) break
      legs.unshift({
        route: p.route,
        from: regionMap.get(p.fromId)!,
        to: regionMap.get(cur)!,
        days: travelDays(p.route),
      })
      treeRouteIds.add(p.route.id)
      cur = p.fromId
    }
    pathRegionIds.unshift(originId)

    paths.set(r.id, {
      originId,
      targetId: r.id,
      pathRegionIds,
      legs,
      totalKm: dist.get(r.id) ?? 0,
      totalDays: legs.reduce((acc, l) => acc + l.days, 0),
      hops: legs.length,
    })
  }

  return { paths, treeRouteIds }
}
