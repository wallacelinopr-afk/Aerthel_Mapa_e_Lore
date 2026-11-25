import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { House, Region, Route } from '../types/map'
import { MAP_POIS, POI_STYLE, type MapPoi } from '../data/pois'
import HouseSigil from './HouseSigil'

export interface SubPin {
  id: string
  x: number
  y: number
  regionId: string
}

interface Props {
  regions: Region[]
  routes: Route[]
  houses: House[]
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

interface LabelProj {
  key: string
  x: number
  y: number
  visible: boolean
  title: string
  subtitle?: string
  detail?: string
  kind: 'major' | 'sub' | 'landmark' | 'poi'
  regionId: string
  houseId: string | null
  house?: House | null
  poi?: MapPoi
  selected: boolean
  isHere: boolean
}

const GEO_LANDMARKS: { id: string; title: string; x: number; y: number }[] = [
  { id: 'lm-sea-frost', title: 'MAR DE GELO', x: 750, y: 240 },
  { id: 'lm-gorge', title: 'Garganta Congelada', x: 435, y: 345 },
  { id: 'lm-wall', title: 'Muralha Tripla · Freya / Frigg / Skadi', x: 355, y: 486 },
  { id: 'lm-autumn', title: 'Bosque Outonal', x: 280, y: 580 },
  { id: 'lm-strait', title: 'Golfo Oriental', x: 765, y: 615 },
  { id: 'lm-desert', title: 'Deserto de Âmbar', x: 560, y: 925 },
]

const toWorld = (px: number, py: number): [number, number] => [(px / 1000 - 0.5) * 100, (py / 1000 - 0.5) * 100]

const BORDERS: [number, number][][] = [
  [[150, 486], [760, 486]],
  [[435, 515], [430, 585], [390, 645], [330, 675]],
  [[585, 515], [595, 610], [605, 710], [640, 775]],
  [[270, 845], [410, 838], [555, 845], [690, 838]],
  [[380, 35], [420, 145], [350, 240], [150, 255]],
  [[510, 25], [530, 175], [565, 290], [745, 315]],
  [[380, 275], [395, 390], [375, 462]],
  [[545, 305], [565, 405], [585, 462]],
]

const PORTS: [number, number][] = [
  [645, 152],
  [145, 235],
  [515, 525],
  [248, 618],
  [752, 695],
  [655, 790],
  [585, 840],
  [175, 762],
  [265, 868],
]

const KINGS_ROAD_PTS: [number, number][] = [
  [775, 20], [690, 95], [615, 140], [565, 220], [520, 265], [485, 370], [515, 460],
  [515, 515], [520, 655], [480, 765], [480, 842], [450, 900],
]

const RIVER_PATHS: [number, number][][] = [
  // Rio de Cortry / Glaedwyn (Norte Ocidental -> Mar Oeste)
  [[270, 175], [248, 235], [272, 295], [250, 348], [188, 365], [122, 378]],
  // Afluente de Ruthless -> Glaedwyn
  [[432, 275], [365, 315], [305, 338], [250, 348]],
  // Rio da Garganta (Montanhas Centrais -> Pouso do Corvo -> Fosso da Muralha)
  [[415, 165], [442, 240], [458, 320], [452, 395], [448, 468]],
  // Rio do Vale Oriental -> Mar de Gelo
  [[590, 185], [612, 265], [625, 345], [658, 405], [735, 435]],
  // Rio Outonal (Muralha -> Terras de Kühl -> Baía Oeste)
  [[392, 516], [375, 560], [332, 592], [282, 608], [238, 622]],
  // Rio da Coroa (Vermer -> Fortaleza do Grifo -> Baía do Grifo)
  [[548, 632], [512, 668], [492, 725], [478, 768], [445, 790]],
  // Rio do Golfo Oriental (Colinas Centrais -> Skar -> Baía Leste)
  [[595, 625], [640, 655], [685, 678], [748, 696]],
]

function hash2(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123
  return s - Math.floor(s)
}

/** Constrói cidadela/fortaleza detalhada com fosso, ponte, muralha ameada, torreão, portão e vilarejo ao redor */
function buildDetailedStronghold(
  r: Region,
  colorHex: string,
  mats: {
    stone: THREE.Material
    darkStone: THREE.Material
    slate: THREE.Material
    sand: THREE.Material
    wood: THREE.Material
    water: THREE.Material
    roofRed: THREE.Material
  },
): THREE.Group {
  const g = new THREE.Group()
  const isCrown = r.id === 'vermer'
  const isDesert = r.id === 'oasis-de-ambar'
  const isMajor = isCrown || r.id === 'ruthless' || r.id === 'basgard' || r.id === 'solar-outonal' || r.id === 'cabo-da-cinza'

  const wallMat = isDesert ? mats.sand : mats.stone
  const trimMat = isDesert ? mats.sand : mats.darkStone
  const scale = isCrown ? 1.45 : isMajor ? 1.05 : 0.72

  // Fosso aquático ao redor da fortaleza + ponte de acesso
  if (isMajor && !isDesert) {
    const moat = new THREE.Mesh(new THREE.RingGeometry(1.7 * scale, 2.15 * scale, isCrown ? 8 : 4), mats.water)
    moat.rotation.x = -Math.PI / 2
    moat.rotation.z = isCrown ? 0 : Math.PI / 4
    moat.position.y = 0.05
    g.add(moat)

    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.45 * scale, 0.14, 0.9 * scale), mats.wood)
    bridge.position.set(0, 0.12, 1.85 * scale)
    g.add(bridge)
  }

  // Muralha externa em 4 segmentos com portão frontal e ameias
  const mw = 2.1 * scale
  const mh = 0.72 * scale
  const mt = 0.24 * scale
  ;[
    [0, -mw / 2, mw, mt],
    [-mw * 0.3, mw / 2, mw * 0.4, mt],
    [mw * 0.3, mw / 2, mw * 0.4, mt],
    [-mw / 2, 0, mt, mw],
    [mw / 2, 0, mt, mw],
  ].forEach(([wx, wz, ww, wd]) => {
    const wMesh = new THREE.Mesh(new THREE.BoxGeometry(ww, mh, wd), trimMat)
    wMesh.position.set(wx, mh / 2, wz)
    wMesh.castShadow = true
    wMesh.receiveShadow = true
    g.add(wMesh)
  })

  // Torres gêmeas do portão principal
  ;[-0.25 * scale, 0.25 * scale].forEach((gx) => {
    const gt = new THREE.Mesh(new THREE.CylinderGeometry(0.14 * scale, 0.17 * scale, mh * 1.45, 8), wallMat)
    gt.position.set(gx, mh * 0.72, mw / 2)
    gt.castShadow = true
    g.add(gt)
  })

  // 4 Torres de esquina com ameias
  ;[-mw / 2, mw / 2].forEach((tx) => {
    ;[-mw / 2, mw / 2].forEach((tz) => {
      const th = mh * 1.4
      const t = new THREE.Mesh(new THREE.BoxGeometry(0.36 * scale, th, 0.36 * scale), wallMat)
      t.position.set(tx, th / 2, tz)
      t.castShadow = true
      g.add(t)
    })
  })

  // Torreão de Menagem (Keep) escalonado com telhado em duas águas
  const kw = 0.85 * scale
  const kh = 1.35 * scale
  const keep = new THREE.Mesh(new THREE.BoxGeometry(kw, kh, kw * 0.85), wallMat)
  keep.position.set(0, kh / 2, -0.1 * scale)
  keep.castShadow = true
  keep.receiveShadow = true
  g.add(keep)

  if (!isDesert) {
    const roof = new THREE.Mesh(new THREE.BoxGeometry(kw * 0.88, 0.28 * scale, kw * 0.72), mats.slate)
    roof.position.set(0, kh + 0.14 * scale, -0.1 * scale)
    g.add(roof)
  }

  // Estandarte da Casa
  const flagMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(colorHex) })
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.85 * scale, 4), trimMat)
  pole.position.set(0, kh + 0.5 * scale, -0.1 * scale)
  const flag = new THREE.Mesh(new THREE.BoxGeometry(0.42 * scale, 0.2 * scale, 0.03), flagMat)
  flag.position.set(0.21 * scale, kh + 0.8 * scale, -0.1 * scale)
  g.add(pole, flag)

  // Casario / vila medieval ao redor das muralhas principais
  const houseCount = isCrown ? 18 : isMajor ? 10 : 4
  for (let i = 0; i < houseCount; i++) {
    const ang = (i / houseCount) * Math.PI * 2 + hash2(i, r.x) * 0.4
    const rad = (isCrown ? 2.5 : 1.9) * scale + hash2(r.y, i) * 1.1 * scale
    const hx = Math.cos(ang) * rad
    const hz = Math.sin(ang) * rad
    const hBody = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.22), wallMat)
    hBody.position.set(hx, 0.09, hz)
    hBody.rotation.y = ang
    const hRoof = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.09, 0.24), isDesert ? mats.sand : mats.roofRed)
    hRoof.position.set(hx, 0.22, hz)
    hRoof.rotation.y = ang
    g.add(hBody, hRoof)
  }

  return g
}

export default function AerthelEarthMap({
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
  const mountRef = useRef<HTMLDivElement>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const routeGroupRef = useRef<THREE.Group | null>(null)
  const elevSamplerRef = useRef<(nx: number, ny: number) => number>(() => 0.5)
  const [labels, setLabels] = useState<LabelProj[]>([])
  const [zoomTier, setZoomTier] = useState<'continent' | 'region' | 'fortress'>('continent')
  const zoomTierRef = useRef<'continent' | 'region' | 'fortress'>('continent')

  useEffect(() => {
    const grp = routeGroupRef.current
    if (!grp) return
    while (grp.children.length) {
      const ch = grp.children[0]
      grp.remove(ch)
      if ((ch as THREE.Line).geometry) (ch as THREE.Line).geometry.dispose()
    }
    const rMap = new Map(regions.map((r) => [r.id, r]))
    const sample = elevSamplerRef.current
    routes.forEach((rt) => {
      const a = rMap.get(rt.fromId)
      const b = rMap.get(rt.toId)
      if (!a || !b) return
      const isDirect = a.id === selectedRegionId || b.id === selectedRegionId
      const isInTree = connectedTreeRouteIds?.has(rt.id) ?? false
      const isActivePath = activePathRouteIds?.has(rt.id) ?? false
      if (!showAllRoutes && !isDirect && !isInTree && !isActivePath) return

      const [ax, az] = toWorld(a.x, a.y)
      const [bx, bz] = toWorld(b.x, b.y)
      const ay = Math.max(0.25, sample(a.x / 1000, a.y / 1000) + 0.28)
      const by = Math.max(0.25, sample(b.x / 1000, b.y / 1000) + 0.28)
      const mx = (ax + bx) / 2 + (rt.mode === 'mar' ? (ax > 0 ? 4.5 : -4.5) : 0)
      const mz = (az + bz) / 2
      const arcBoost = isActivePath ? 3.2 : isDirect ? 2.4 : isInTree ? 1.5 : 0.65
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(ax, ay, az),
        new THREE.Vector3(mx, Math.max(ay, by) + arcBoost, mz),
        new THREE.Vector3(bx, by, bz),
      )
      const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(32))
      const color = isActivePath
        ? 0x4ade80
        : rt.mode === 'mar'
          ? isDirect || isInTree ? 0x67e8f9 : 0x38bdf8
          : rt.mode === 'rio'
            ? 0x93c5fd
            : isDirect
              ? 0xfcd34d
              : isInTree
                ? 0xf59e0b
                : 0xd6c3a1
      const mat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: isActivePath ? 1 : isDirect ? 0.95 : isInTree ? 0.68 : 0.22,
      })
      grp.add(new THREE.Line(geo, mat))
    })
  }, [regions, routes, selectedRegionId, showAllRoutes, connectedTreeRouteIds, activePathRouteIds])

  const stateRef = useRef({
    regions,
    subPins,
    houseById,
    selectedRegionId,
    currentRegionId,
    focusedHouseId,
    showSubHouses,
    showPois,
  })
  stateRef.current = {
    regions,
    subPins,
    houseById,
    selectedRegionId,
    currentRegionId,
    focusedHouseId,
    showSubHouses,
    showPois,
  }

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const width = container.clientWidth || 1000
    const height = container.clientHeight || 760

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x060b11)
    scene.fog = new THREE.FogExp2(0x060b11, 0.0032)

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.3, 450)
    camera.position.set(0, 78, 50)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.08
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.065
    controls.maxPolarAngle = Math.PI * 0.455
    controls.minDistance = 8 // permite zoom bem próximo nos castelos, fossos e cânions!
    controls.maxDistance = 155
    controls.target.set(0, 0, 2)
    controlsRef.current = controls

    const ambient = new THREE.AmbientLight(0xdbeafe, 0.72)
    scene.add(ambient)
    const sun = new THREE.DirectionalLight(0xfff1db, 1.65)
    sun.position.set(-50, 75, 32)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.camera.left = -60
    sun.shadow.camera.right = 60
    sun.shadow.camera.top = 60
    sun.shadow.camera.bottom = -60
    scene.add(sun)

    // Malha 320x320 de alta resolução (102.400 vértices!)
    const segs = 320
    const geo = new THREE.PlaneGeometry(100, 100, segs, segs)
    geo.rotateX(-Math.PI / 2)

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.02,
      bumpScale: 0.22,
    })
    const terrain = new THREE.Mesh(geo, terrainMat)
    terrain.receiveShadow = true
    terrain.castShadow = true
    scene.add(terrain)

    // Materiais compartilhados para edifícios, estradas, portos e árvores
    const mats = {
      stone: new THREE.MeshStandardMaterial({ color: 0xa8aeb5, roughness: 0.85 }),
      darkStone: new THREE.MeshStandardMaterial({ color: 0x4b535c, roughness: 0.9 }),
      slate: new THREE.MeshStandardMaterial({ color: 0x2c333d, roughness: 0.75 }),
      sand: new THREE.MeshStandardMaterial({ color: 0xc2a676, roughness: 0.92 }),
      wood: new THREE.MeshStandardMaterial({ color: 0x5c3e26, roughness: 0.9 }),
      water: new THREE.MeshStandardMaterial({ color: 0x1a5373, roughness: 0.25, metalness: 0.3 }),
      roofRed: new THREE.MeshStandardMaterial({ color: 0x6b3a32, roughness: 0.85 }),
      road: new THREE.MeshStandardMaterial({ color: 0x9c8867, roughness: 0.95 }),
    }

    const strongholdsGroup = new THREE.Group()
    scene.add(strongholdsGroup)
    const wallGroup = new THREE.Group()
    scene.add(wallGroup)

    // Carrega /aerthel_satellite.jpg em resolução nativa para heightmap + cânions + fossos + árvores
    const img = new Image()
    img.src = '/aerthel_satellite.jpg'
    let loadedTex: THREE.Texture | null = null

    img.onload = () => {
      const tex = new THREE.Texture(img)
      tex.colorSpace = THREE.SRGBColorSpace
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy()
      tex.needsUpdate = true
      loadedTex = tex

      const c = document.createElement('canvas')
      const sw = Math.min(1024, img.width || 1024)
      const sh = Math.min(1024, img.height || 1024)
      c.width = sw
      c.height = sh
      const ctx = c.getContext('2d')!
      ctx.drawImage(img, 0, 0, sw, sh)
      const px = ctx.getImageData(0, 0, sw, sh).data

      // Pré-computa heightfield suavizado (161x161 + 4 passes de blur) para evitar picos serrilhados
      const gs = 160
      const gStride = gs + 1
      let grid = new Float32Array(gStride * gStride)
      const seaMask = new Uint8Array(gStride * gStride)

      for (let gy = 0; gy <= gs; gy++) {
        const ny = gy / gs
        const iy = Math.min(sh - 1, Math.max(0, Math.floor(ny * sh)))
        for (let gx = 0; gx <= gs; gx++) {
          const nx = gx / gs
          const ix = Math.min(sw - 1, Math.max(0, Math.floor(nx * sw)))
          const i = (iy * sw + ix) * 4
          const r = px[i], g = px[i + 1], b = px[i + 2]
          const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
          const isDeepSea = b > r + 14 && lum < 0.34
          const idx = gy * gStride + gx
          if (isDeepSea) {
            seaMask[idx] = 1
            grid[idx] = -0.08
            continue
          }

          let elev = 0.22 + lum * 1.35
          // Montanhas nevadas e cordilheiras com relevo natural (sem agulhas)
          if (lum > 0.62 && Math.abs(r - b) < 28) elev += (lum - 0.62) * 3.6

          // Fosso / Zona Morta entre Freya, Frigg e Skadi
          const dWall1 = Math.abs(ny - 0.476)
          const dWall2 = Math.abs(ny - 0.498)
          if ((dWall1 < 0.006 || dWall2 < 0.006) && nx > 0.16 && nx < 0.75) {
            elev = Math.max(0.06, elev - 0.45)
          }
          // Cânion da Garganta Congelada
          const canyonDist = Math.abs((nx - 0.44) * 1.4 - (ny - 0.34) * 0.4)
          if (canyonDist < 0.014 && ny > 0.30 && ny < 0.45) {
            elev = Math.max(0.1, elev - 0.65)
          }
          // Cânion no Deserto Sulino
          if (ny > 0.88 && Math.abs(nx - 0.58 + Math.sin(ny * 40) * 0.02) < 0.014) {
            elev = Math.max(0.12, elev - 0.55)
          }
          grid[idx] = elev
        }
      }

      // Esculpe leitos suaves de rios no heightfield antes do blur
      RIVER_PATHS.forEach((pts) => {
        const curve = new THREE.CatmullRomCurve3(pts.map(([rx, ry]) => new THREE.Vector3(rx / 1000, 0, ry / 1000)))
        const samples = curve.getPoints(48)
        samples.forEach((pt) => {
          const cx = pt.x
          const cy = pt.z
          const rad = 0.013
          const gx0 = Math.max(0, Math.floor((cx - rad) * gs))
          const gx1 = Math.min(gs, Math.ceil((cx + rad) * gs))
          const gy0 = Math.max(0, Math.floor((cy - rad) * gs))
          const gy1 = Math.min(gs, Math.ceil((cy + rad) * gs))
          for (let gy = gy0; gy <= gy1; gy++) {
            for (let gx = gx0; gx <= gx1; gx++) {
              const idx = gy * gStride + gx
              if (seaMask[idx]) continue
              const dist = Math.hypot(gx / gs - cx, gy / gs - cy)
              if (dist < rad) {
                const depth = (1 - dist / rad) * 0.14
                grid[idx] = Math.max(0.14, grid[idx] - depth)
              }
            }
          }
        })
      })

      // 4 passes de filtro gaussiano/box 3x3 para suavizar encostas e costas
      for (let pass = 0; pass < 4; pass++) {
        const next = new Float32Array(grid.length)
        for (let gy = 0; gy <= gs; gy++) {
          for (let gx = 0; gx <= gs; gx++) {
            let sum = 0
            let cnt = 0
            for (let dy = -1; dy <= 1; dy++) {
              const yy = gy + dy
              if (yy < 0 || yy > gs) continue
              for (let dx = -1; dx <= 1; dx++) {
                const xx = gx + dx
                if (xx < 0 || xx > gs) continue
                const w = dx === 0 && dy === 0 ? 2 : 1
                sum += grid[yy * gStride + xx] * w
                cnt += w
              }
            }
            const idx = gy * gStride + gx
            next[idx] = seaMask[idx] ? Math.min(0.02, sum / cnt) : sum / cnt
          }
        }
        grid = next
      }

      const rawSample = (nx: number, ny: number) => {
        const fx = Math.min(gs - 0.001, Math.max(0, nx * gs))
        const fy = Math.min(gs - 0.001, Math.max(0, ny * gs))
        const x0 = Math.floor(fx), y0 = Math.floor(fy)
        const x1 = Math.min(gs, x0 + 1), y1 = Math.min(gs, y0 + 1)
        const tx = fx - x0, ty = fy - y0
        const v00 = grid[y0 * gStride + x0]
        const v10 = grid[y0 * gStride + x1]
        const v01 = grid[y1 * gStride + x0]
        const v11 = grid[y1 * gStride + x1]
        return (v00 * (1 - tx) + v10 * tx) * (1 - ty) + (v01 * (1 - tx) + v11 * tx) * ty
      }

      // Nivela pequenos platôs sob cada fortaleza para que os castelos fiquem assentados no solo
      regions.forEach((r) => {
        const cx = r.x / 1000
        const cy = r.y / 1000
        const targetH = Math.max(0.24, rawSample(cx, cy))
        const rad = 0.022
        const gx0 = Math.max(0, Math.floor((cx - rad) * gs))
        const gx1 = Math.min(gs, Math.ceil((cx + rad) * gs))
        const gy0 = Math.max(0, Math.floor((cy - rad) * gs))
        const gy1 = Math.min(gs, Math.ceil((cy + rad) * gs))
        for (let gy = gy0; gy <= gy1; gy++) {
          for (let gx = gx0; gx <= gx1; gx++) {
            const dx = gx / gs - cx
            const dy = gy / gs - cy
            const dist = Math.hypot(dx, dy)
            if (dist < rad) {
              const blend = 1 - dist / rad
              const idx = gy * gStride + gx
              grid[idx] = grid[idx] * (1 - blend * 0.85) + targetH * (blend * 0.85)
            }
          }
        }
      })

      const sampleElev = (nx: number, ny: number) => rawSample(nx, ny)
      elevSamplerRef.current = sampleElev

      const pos = geo.attributes.position
      for (let i = 0; i < pos.count; i++) {
        const nx = pos.getX(i) / 100 + 0.5
        const ny = pos.getZ(i) / 100 + 0.5
        pos.setY(i, sampleElev(nx, ny))
      }
      pos.needsUpdate = true
      geo.computeVertexNormals()

      terrainMat.map = tex
      terrainMat.bumpMap = tex
      terrainMat.needsUpdate = true

      // Posiciona Castelos & Vilas sobre a elevação exata
      regions.forEach((r) => {
        const [wx, wz] = toWorld(r.x, r.y)
        const wy = sampleElev(r.x / 1000, r.y / 1000)
        const col = houseById.get(r.houseId ?? '')?.sigil.primary || '#8b7fb0'
        const keep = buildDetailedStronghold(r, col, mats)
        keep.position.set(wx, Math.max(0.15, wy), wz)
        strongholdsGroup.add(keep)
      })

      // Muralha Tripla 3D alinhada exatamente às 3 muralhas pintadas (y=462, 474, 507)
      const wallCols = 14
      const wallStartX = 165
      const wallEndX = 745
      const spanW = ((wallEndX - wallStartX) / wallCols) * 0.1
      ;[462, 474, 507].forEach((py) => {
        for (let s = 0; s < wallCols; s++) {
          const pxMid = wallStartX + ((s + 0.5) / wallCols) * (wallEndX - wallStartX)
          const [wx, wz] = toWorld(pxMid, py)
          const wy = Math.max(0.2, sampleElev(pxMid / 1000, py / 1000))
          const wallSeg = new THREE.Mesh(new THREE.BoxGeometry(spanW + 0.1, 0.48, 0.24), mats.stone)
          wallSeg.position.set(wx, wy + 0.22, wz)
          wallSeg.castShadow = true
          wallSeg.receiveShadow = true
          wallGroup.add(wallSeg)
        }
        ;[180, 290, 400, 515, 620, 700].forEach((px) => {
          const [tx, wz] = toWorld(px, py)
          const twy = Math.max(0.2, sampleElev(px / 1000, py / 1000))
          const tower = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.85, 0.55), mats.darkStone)
          tower.position.set(tx, twy + 0.4, wz)
          tower.castShadow = true
          wallGroup.add(tower)
        })
      })

      // Via Imperial física colada no terreno (TubeGeometry)
      const roadVecs = KINGS_ROAD_PTS.map(([px2, py2]) => {
        const [wx, wz] = toWorld(px2, py2)
        return new THREE.Vector3(wx, Math.max(0.18, sampleElev(px2 / 1000, py2 / 1000) + 0.08), wz)
      })
      const roadCurve = new THREE.CatmullRomCurve3(roadVecs)
      const roadGeo = new THREE.TubeGeometry(roadCurve, 120, 0.14, 5, false)
      const roadMesh = new THREE.Mesh(roadGeo, mats.road)
      scene.add(roadMesh)

      // Rios 3D com largura progressiva da nascente até a foz
      const riverMat = new THREE.MeshStandardMaterial({
        color: 0x24749c,
        roughness: 0.16,
        metalness: 0.42,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
      })
      RIVER_PATHS.forEach((pts) => {
        const vecs = pts.map(([px2, py2]) => {
          const [wx, wz] = toWorld(px2, py2)
          return new THREE.Vector3(wx, Math.max(0.08, sampleElev(px2 / 1000, py2 / 1000) + 0.055), wz)
        })
        const curve = new THREE.CatmullRomCurve3(vecs)
        const segsR = 52
        const positions: number[] = []
        const indices: number[] = []
        for (let i = 0; i <= segsR; i++) {
          const t = i / segsR
          const pt = curve.getPoint(t)
          const tan = curve.getTangent(t)
          const nx = pt.x / 100 + 0.5
          const ny = pt.z / 100 + 0.5
          const y = Math.max(0.08, sampleElev(nx, ny) + 0.065)
          const side = new THREE.Vector3(-tan.z, 0, tan.x).normalize()
          const halfW = 0.08 + t * 0.24
          positions.push(pt.x - side.x * halfW, y, pt.z - side.z * halfW)
          positions.push(pt.x + side.x * halfW, y, pt.z + side.z * halfW)
          if (i < segsR) {
            const b = i * 2
            indices.push(b, b + 1, b + 2, b + 1, b + 3, b + 2)
          }
        }
        const rGeo = new THREE.BufferGeometry()
        rGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
        rGeo.setIndex(indices)
        rGeo.computeVertexNormals()
        const rMesh = new THREE.Mesh(rGeo, riverMat)
        rMesh.receiveShadow = true
        scene.add(rMesh)
      })

      // Portos 3D com píer de madeira e farol de pedra
      PORTS.forEach(([px2, py2]) => {
        const [wx, wz] = toWorld(px2, py2)
        const wy = Math.max(0.1, sampleElev(px2 / 1000, py2 / 1000))
        const pier = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.15, 0.35), mats.wood)
        pier.position.set(wx, wy + 0.08, wz)
        const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.75, 6), mats.darkStone)
        beacon.position.set(wx - 0.35, wy + 0.38, wz)
        scene.add(pier, beacon)
      })

      // 1.800 Árvores 3D em InstancedMesh espalhadas pelas florestas reais da imagem
      const treeGeo = new THREE.ConeGeometry(0.19, 0.68, 5)
      treeGeo.translate(0, 0.34, 0)
      const treeMat = new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true })
      const treeList: { x: number; y: number; z: number; s: number; col: THREE.Color }[] = []
      for (let i = 0; i < 2400; i++) {
        const rx = hash2(i, 17)
        const ry = hash2(i, 31)
        const ix = Math.floor(rx * sw)
        const iy = Math.floor(ry * sh)
        const idx = (iy * sw + ix) * 4
        const r = px[idx], g = px[idx + 1], b = px[idx + 2]
        const isGreenForest = g > r + 6 && g > b + 4 && r < 115
        const isAutumnForest = rx < 0.43 && ry > 0.51 && ry < 0.67 && r > b + 28
        if (!isGreenForest && !isAutumnForest) continue
        const elev = sampleElev(rx, ry)
        if (elev < 0.25 || elev > 3.2) continue
        const [wx, wz] = toWorld(rx * 1000, ry * 1000)
        const col = isAutumnForest
          ? new THREE.Color().setHSL(0.05 + hash2(i, 3) * 0.07, 0.58, 0.28 + hash2(i, 5) * 0.12)
          : new THREE.Color().setHSL(0.28 + hash2(i, 3) * 0.06, 0.35, 0.16 + hash2(i, 5) * 0.09)
        treeList.push({ x: wx, y: elev, z: wz, s: 0.65 + hash2(i, 7) * 0.65, col })
        if (treeList.length >= 1800) break
      }
      if (treeList.length > 0) {
        const inst = new THREE.InstancedMesh(treeGeo, treeMat, treeList.length)
        inst.castShadow = true
        const dummy = new THREE.Object3D()
        treeList.forEach((td, i) => {
          dummy.position.set(td.x, td.y, td.z)
          dummy.scale.set(td.s, td.s * (0.85 + hash2(i, 9) * 0.45), td.s)
          dummy.rotation.y = hash2(i, 13) * Math.PI
          dummy.updateMatrix()
          inst.setMatrixAt(i, dummy.matrix)
          inst.setColorAt(i, td.col)
        })
        inst.instanceMatrix.needsUpdate = true
        if (inst.instanceColor) inst.instanceColor.needsUpdate = true
        scene.add(inst)
      }
    }

    // Fronteiras políticas carmesim
    const borderGroup = new THREE.Group()
    BORDERS.forEach((pts) => {
      const vecs = pts.map(([px2, py2]) => {
        const [wx, wz] = toWorld(px2, py2)
        return new THREE.Vector3(wx, 1.35, wz)
      })
      const bGeo = new THREE.BufferGeometry().setFromPoints(vecs)
      const bMat = new THREE.LineDashedMaterial({
        color: 0x9f1239,
        dashSize: 1.2,
        gapSize: 0.6,
        transparent: true,
        opacity: 0.85,
      })
      const line = new THREE.Line(bGeo, bMat)
      line.computeLineDistances()
      borderGroup.add(line)
    })
    scene.add(borderGroup)

    // Rotas 3D
    const routeGroup = new THREE.Group()
    routeGroupRef.current = routeGroup
    scene.add(routeGroup)

    // Navios 3D animados exclusivamente em rotas marítimas sobre água aberta
    const OCEAN_LANES: [number, number][][] = [
      [[75, 380], [70, 500], [80, 640], [105, 720]],
      [[100, 880], [185, 935], [265, 905]],
      [[155, 700], [235, 670], [275, 710]],
      [[865, 290], [885, 460], [890, 640], [840, 800]],
      [[785, 780], [815, 845], [760, 895]],
    ]
    const ships: { mesh: THREE.Group; curve: THREE.CatmullRomCurve3; speed: number; offset: number }[] = []
    OCEAN_LANES.forEach((lane, idx) => {
      const vecs = lane.map(([px2, py2]) => {
        const [wx, wz] = toWorld(px2, py2)
        return new THREE.Vector3(wx, 0.1, wz)
      })
      const curve = new THREE.CatmullRomCurve3(vecs)
      const ship = new THREE.Group()
      const hull = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.22, 1.05), mats.wood)
      const sail = new THREE.Mesh(
        new THREE.PlaneGeometry(0.65, 0.78),
        new THREE.MeshStandardMaterial({ color: 0xf1f5f9, side: THREE.DoubleSide }),
      )
      sail.position.y = 0.62
      ship.add(hull, sail)
      scene.add(ship)
      ships.push({ mesh: ship, curve, speed: 0.028 + idx * 0.006, offset: idx * 0.19 })
    })

    // Carroças, Caravanas e Viajantes a cavalo pelas estradas terrestres
    const LAND_TRAILS: { kind: 'wagon' | 'caravan' | 'rider'; pts: [number, number][]; speed: number }[] = [
      { kind: 'caravan', pts: [[615, 140], [520, 265], [485, 370], [515, 462]], speed: 0.018 },
      { kind: 'caravan', pts: [[515, 515], [565, 585], [648, 632], [565, 710], [492, 778]], speed: 0.016 },
      { kind: 'wagon', pts: [[335, 585], [440, 610], [555, 625], [648, 632]], speed: 0.024 },
      { kind: 'rider', pts: [[648, 632], [705, 655], [755, 675]], speed: 0.042 },
      { kind: 'wagon', pts: [[240, 205], [335, 255], [485, 265]], speed: 0.025 },
      { kind: 'caravan', pts: [[492, 778], [475, 845], [450, 900], [565, 915]], speed: 0.019 },
      { kind: 'rider', pts: [[220, 488], [360, 488], [515, 488], [660, 488]], speed: 0.036 },
    ]
    const canvasMat = new THREE.MeshStandardMaterial({ color: 0xe8dcc4, roughness: 0.9 })
    const cloakMat = new THREE.MeshStandardMaterial({ color: 0x9f1239, roughness: 0.85 })
    const horseMat = new THREE.MeshStandardMaterial({ color: 0x5c3e26, roughness: 0.85 })

    const buildTravelerMesh = (kind: 'wagon' | 'caravan' | 'rider') => {
      const grp = new THREE.Group()
      if (kind === 'rider') {
        const horse = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.34), horseMat)
        horse.position.y = 0.12
        const rider = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.12), cloakMat)
        rider.position.set(0, 0.28, -0.02)
        grp.add(horse, rider)
        return grp
      }
      const count = kind === 'caravan' ? 2 : 1
      for (let c = 0; c < count; c++) {
        const zOff = -c * 0.72
        const bed = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.44), mats.wood)
        bed.position.set(0, 0.12, zOff)
        const cover = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.16, 0.38), canvasMat)
        cover.position.set(0, 0.25, zOff - 0.02)
        const wheel = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.1, 0.1), mats.darkStone)
        wheel.position.set(0, 0.06, zOff)
        const beast = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.24), horseMat)
        beast.position.set(0, 0.1, zOff + 0.36)
        grp.add(bed, cover, wheel, beast)
      }
      return grp
    }

    const travelers: { mesh: THREE.Group; curve: THREE.CatmullRomCurve3; speed: number; offset: number }[] = []
    LAND_TRAILS.forEach((tr, idx) => {
      const vecs = tr.pts.map(([px2, py2]) => {
        const [wx, wz] = toWorld(px2, py2)
        return new THREE.Vector3(wx, 0.4, wz)
      })
      const curve = new THREE.CatmullRomCurve3(vecs)
      const mesh = buildTravelerMesh(tr.kind)
      scene.add(mesh)
      travelers.push({ mesh, curve, speed: tr.speed, offset: idx * 0.27 })
    })

    // Neve sutil caindo no Norte (acima da Muralha)
    const snowCount = 320
    const snowPos = new Float32Array(snowCount * 3)
    for (let i = 0; i < snowCount; i++) {
      snowPos[i * 3] = (hash2(i, 1) - 0.5) * 76
      snowPos[i * 3 + 1] = 1.5 + hash2(i, 2) * 14
      snowPos[i * 3 + 2] = -46 + hash2(i, 3) * 42
    }
    const snowGeo = new THREE.BufferGeometry()
    snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3))
    const snowMat = new THREE.PointsMaterial({ color: 0xe2e8f0, size: 0.24, transparent: true, opacity: 0.55 })
    const snowPoints = new THREE.Points(snowGeo, snowMat)
    scene.add(snowPoints)

    let raf = 0
    const clock = new THREE.Clock()
    const projVec = new THREE.Vector3()
    const animate = () => {
      raf = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()
      const sAttr = snowGeo.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < snowCount; i++) {
        let sy = sAttr.getY(i) - 0.032
        if (sy < 0.8) sy = 15
        sAttr.setY(i, sy)
      }
      sAttr.needsUpdate = true
      const sampleElevNow = elevSamplerRef.current
      ships.forEach((s) => {
        const u = (t * s.speed + s.offset) % 1
        const pt = s.curve.getPoint(u)
        const tan = s.curve.getTangent(u)
        const elev = sampleElevNow(pt.x / 100 + 0.5, pt.z / 100 + 0.5)
        s.mesh.visible = elev < 0.14
        s.mesh.position.copy(pt)
        s.mesh.lookAt(pt.x + tan.x, pt.y, pt.z + tan.z)
      })
      travelers.forEach((tr) => {
        const raw = (t * tr.speed + tr.offset) % 2
        const forward = raw <= 1
        const u = forward ? raw : 2 - raw
        const pt = tr.curve.getPoint(u)
        const tan = tr.curve.getTangent(u)
        const elev = sampleElevNow(pt.x / 100 + 0.5, pt.z / 100 + 0.5)
        tr.mesh.visible = elev >= 0.16
        tr.mesh.position.set(pt.x, Math.max(0.2, elev + 0.08), pt.z)
        const dir = forward ? 1 : -1
        tr.mesh.lookAt(pt.x + tan.x * dir, tr.mesh.position.y, pt.z + tan.z * dir)
      })
      controls.update()
      renderer.render(scene, camera)

      const st = stateRef.current
      const w = container.clientWidth || width
      const h = container.clientHeight || height
      const sample = elevSamplerRef.current
      const camDist = camera.position.distanceTo(controls.target)
      const tier: 'continent' | 'region' | 'fortress' =
        camDist < 42 ? 'fortress' : camDist < 85 ? 'region' : 'continent'
      if (tier !== zoomTierRef.current) {
        zoomTierRef.current = tier
        setZoomTier(tier)
      }
      const nextLabels: LabelProj[] = []

      st.regions.forEach((r) => {
        const [wx, wz] = toWorld(r.x, r.y)
        const wy = sample(r.x / 1000, r.y / 1000) + 2.1
        projVec.set(wx, wy, wz).project(camera)
        const visible = projVec.z < 1 && projVec.x > -1.04 && projVec.x < 1.04 && projVec.y > -1.04 && projVec.y < 1.04
        const house = r.houseId ? st.houseById.get(r.houseId) : null
        nextLabels.push({
          key: r.id,
          x: (projVec.x * 0.5 + 0.5) * w,
          y: (-projVec.y * 0.5 + 0.5) * h,
          visible,
          title: r.id === 'vermer' ? 'VERMER · COROA' : (house ? house.name : r.settlement).toUpperCase(),
          subtitle: tier !== 'continent' ? r.settlement : undefined,
          detail: tier === 'fortress' ? `${r.terrain} · ${house?.seat ?? r.name}` : undefined,
          kind: 'major',
          regionId: r.id,
          houseId: r.houseId,
          house,
          selected: st.selectedRegionId === r.id,
          isHere: st.currentRegionId === r.id,
        })
      })

      if (tier !== 'continent') {
        GEO_LANDMARKS.forEach((lm) => {
          const [wx, wz] = toWorld(lm.x, lm.y)
          const wy = sample(lm.x / 1000, lm.y / 1000) + 1.2
          projVec.set(wx, wy, wz).project(camera)
          const visible = projVec.z < 1 && projVec.x > -1 && projVec.x < 1 && projVec.y > -1 && projVec.y < 1
          nextLabels.push({
            key: lm.id,
            x: (projVec.x * 0.5 + 0.5) * w,
            y: (-projVec.y * 0.5 + 0.5) * h,
            visible,
            title: lm.title,
            kind: 'landmark',
            regionId: st.selectedRegionId,
            houseId: null,
            selected: false,
            isHere: false,
          })
        })
      }

      if (st.showSubHouses && camDist < 125) {
        st.subPins.forEach((pin) => {
          const house = st.houseById.get(pin.id)
          if (!house) return
          const [wx, wz] = toWorld(pin.x, pin.y)
          const wy = sample(pin.x / 1000, pin.y / 1000) + 1.0
          projVec.set(wx, wy, wz).project(camera)
          const visible = projVec.z < 1 && projVec.x > -1 && projVec.x < 1 && projVec.y > -1 && projVec.y < 1
          nextLabels.push({
            key: `sub-${pin.id}`,
            x: (projVec.x * 0.5 + 0.5) * w,
            y: (-projVec.y * 0.5 + 0.5) * h,
            visible,
            title: house.name,
            subtitle: tier === 'fortress' ? house.seat : undefined,
            kind: 'sub',
            regionId: pin.regionId,
            houseId: house.id,
            house,
            selected: st.focusedHouseId === house.id,
            isHere: false,
          })
        })
      }

      if (st.showPois && camDist < 95) {
        MAP_POIS.forEach((poi) => {
          const [wx, wz] = toWorld(poi.x, poi.y)
          const wy = sample(poi.x / 1000, poi.y / 1000) + 0.75
          projVec.set(wx, wy, wz).project(camera)
          const visible = projVec.z < 1 && projVec.x > -1 && projVec.x < 1 && projVec.y > -1 && projVec.y < 1
          nextLabels.push({
            key: poi.id,
            x: (projVec.x * 0.5 + 0.5) * w,
            y: (-projVec.y * 0.5 + 0.5) * h,
            visible,
            title: poi.name,
            kind: 'poi',
            regionId: poi.regionId,
            houseId: null,
            poi,
            selected: false,
            isHere: false,
          })
        })
      }

      setLabels(nextLabels)
    }
    animate()

    const onResize = () => {
      if (!container) return
      const nw = container.clientWidth
      const nh = container.clientHeight
      camera.aspect = nw / nh
      camera.updateProjectionMatrix()
      renderer.setSize(nw, nh)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      controls.dispose()
      geo.dispose()
      terrainMat.dispose()
      if (loadedTex) loadedTex.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [regions, routes, houseById])

  const setViewMode = (mode: '3d' | 'top' | 'focus') => {
    const cam = cameraRef.current
    const ctr = controlsRef.current
    if (!cam || !ctr) return
    if (mode === 'top') {
      ctr.target.set(0, 0, 0)
      cam.position.set(0, 118, 1)
    } else if (mode === '3d') {
      ctr.target.set(0, 0, 2)
      cam.position.set(0, 78, 50)
    } else {
      const r = regions.find((x) => x.id === selectedRegionId) ?? regions[0]
      const [wx, wz] = toWorld(r.x, r.y)
      ctr.target.set(wx, 1.2, wz)
      cam.position.set(wx - 4, 11, wz + 12) // Zoom bem próximo nas fortalezas, fossos e vilas!
    }
    ctr.update()
  }

  return (
    <div className="relative h-[calc(100vh-190px)] min-h-[740px] w-full overflow-hidden rounded-lg border border-line-strong bg-[#060b11]">
      <div ref={mountRef} className="h-full w-full" />

      <div className="absolute left-3 top-3 z-10 flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setViewMode('3d')}
          className="rounded border border-line-strong bg-base/85 px-2.5 py-1 text-[11px] text-ink-strong backdrop-blur hover:border-accent"
        >
          Órbita 3D
        </button>
        <button
          onClick={() => setViewMode('top')}
          className="rounded border border-line-strong bg-base/85 px-2.5 py-1 text-[11px] text-ink-strong backdrop-blur hover:border-accent"
        >
          Satélite Topo
        </button>
        <button
          onClick={() => setViewMode('focus')}
          className="rounded border border-accent-dim bg-accent-soft/85 px-2.5 py-1 text-[11px] text-accent backdrop-blur hover:bg-accent-dim/50"
        >
          Zoom na Fortaleza
        </button>
        {onOpenIsolatedMap && (
          <button
            onClick={() => onOpenIsolatedMap(selectedRegionId)}
            className="rounded border border-[#d6c3a1]/50 bg-[#0b1014]/90 px-2.5 py-1 text-[11px] text-[#fef08a] backdrop-blur hover:border-[#fef08a]"
          >
            Mapa Isolado da Região
          </button>
        )}
        <span className="rounded border border-line bg-base/75 px-2 py-1 font-mono text-[10px] text-mute backdrop-blur">
          Nível: {zoomTier === 'fortress' ? 'Detalhe Local' : zoomTier === 'region' ? 'Regional' : 'Continental'}
        </span>
      </div>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {labels.map((l) => {
          if (!l.visible) return null
          if (l.kind === 'landmark') {
            return (
              <span
                key={l.key}
                style={{ left: l.x, top: l.y, transform: 'translate(-50%, -50%)', textShadow: '0 1px 4px #000' }}
                className="pointer-events-none absolute whitespace-nowrap font-serif text-[9.5px] italic tracking-[0.2em] text-[#94a3b8]/80"
              >
                {l.title}
              </span>
            )
          }
          if (l.kind === 'poi' && l.poi) {
            const stPoi = POI_STYLE[l.poi.kind]
            return (
              <button
                key={l.key}
                onClick={() => {
                  onSelectRegion(l.poi!.regionId, null)
                  onSelectPoi?.(l.poi!)
                }}
                title={`${stPoi.badge}: ${l.poi.note}`}
                style={{ left: l.x, top: l.y, transform: 'translate(-50%, -100%)' }}
                className="pointer-events-auto absolute z-10 flex items-center gap-1 whitespace-nowrap rounded border border-white/15 bg-[#0b1014]/85 px-1.5 py-0.5 font-mono text-[8.5px] text-[#e2e8f0] backdrop-blur hover:border-[#fef08a]"
              >
                <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: stPoi.color }} />
                <span>{l.poi.name}</span>
              </button>
            )
          }
          return (
            <button
              key={l.key}
              onClick={() => onSelectRegion(l.regionId, l.houseId)}
              onDoubleClick={() => l.kind === 'major' && onOpenIsolatedMap?.(l.regionId)}
              style={{
                left: l.x,
                top: l.y,
                transform: 'translate(-50%, -100%)',
                textShadow: '0 1px 4px #000, 0 0 8px #000',
              }}
              className={`pointer-events-auto absolute whitespace-nowrap transition ${
                l.kind === 'major'
                  ? l.selected
                    ? 'z-20 font-serif text-[13px] font-bold tracking-[0.18em] text-[#fef08a]'
                    : 'z-10 font-serif text-[11.5px] font-semibold tracking-[0.16em] text-[#f1ece1] hover:text-[#fef08a]'
                  : l.selected
                    ? 'z-20 font-mono text-[10px] font-semibold text-[#fef08a]'
                    : 'z-0 font-mono text-[9.5px] text-[#cbd5e1]/85 hover:text-white'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                {l.house && (
                  <span className="inline-block rounded-full border border-[#d6c3a1]/50 bg-[#0b1014]/85 p-0.5">
                    <HouseSigil house={l.house} size={l.kind === 'major' ? 14 : 11} />
                  </span>
                )}
                {l.isHere && (
                  <span
                    title="Você está aqui (Posição atual)"
                    className="inline-block h-2.5 w-2.5 rounded-full border border-white bg-[#facc15] shadow-[0_0_8px_#facc15]"
                  />
                )}
                {l.title}
              </span>
              {l.subtitle && zoomTier !== 'continent' && l.kind === 'major' && (
                <span className="block font-mono text-[9px] font-normal tracking-normal text-[#cbd5e1]/90">
                  {l.subtitle}
                </span>
              )}
              {l.detail && zoomTier === 'fortress' && l.kind === 'major' && (
                <span className="mt-0.5 block rounded border border-[#d6c3a1]/40 bg-[#0b1014]/85 px-1.5 py-0.5 font-mono text-[8.5px] font-normal tracking-normal text-[#fef08a]">
                  {l.detail} · clique duplo p/ Atlas
                </span>
              )}
              {l.subtitle && zoomTier === 'fortress' && l.kind === 'sub' && (
                <span className="block font-mono text-[8px] text-[#94a3b8]">{l.subtitle}</span>
              )}
            </button>
          )
        })}
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap items-center gap-3 rounded bg-base/85 px-2.5 py-1 font-mono text-[10px] text-mute backdrop-blur">
        <span className="flex items-center gap-1 text-[#fef08a]">
          <span className="inline-block h-2 w-2 rounded-full border border-white bg-[#facc15]" /> Sua posição atual
        </span>
        <span>·</span>
        <span>Arraste (esq.): girar 3D · Roda: zoom (revela marcos e detalhes) · Clique duplo: Mapa Isolado</span>
      </div>
    </div>
  )
}
