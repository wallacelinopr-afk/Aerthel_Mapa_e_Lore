import {
  Anchor, Bird, Cat, Castle, Coins, Crown, Flame, Gem, Hammer, Mountain, Shield, Ship, Star, Sun,
  TreePine, Waves, Wheat, Worm, BrickWall,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { House } from '../types/map'

const ICONS: Record<string, LucideIcon> = {
  eagle: Mountain,
  dune: Sun,
  wheat: Wheat,
  wall: BrickWall,
  tree: TreePine,
  star: Star,
  griffin: Crown,
  dragon: Gem,
  tower: Castle,
  anvil: Hammer,
  ship: Ship,
  coin: Coins,
  raven: Bird,
  serpent: Worm,
  cat: Cat,
  flame: Flame,
  wave: Waves,
  anchor: Anchor,
  shield: Shield,
}

/** Brasão minimalista: escudo SVG com ícone central na cor da casa. */
export default function HouseSigil({ house, size = 40 }: { house: Pick<House, 'sigil' | 'name'> | null; size?: number }) {
  const color = house?.sigil.primary || '#4a5160'
  const Icon = ICONS[house?.sigil.shape ?? 'shield'] ?? Shield
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size * 1.12 }}
      title={house ? `Casa ${house.name}` : 'Sem casa'}
    >
      <svg viewBox="0 0 40 45" className="absolute inset-0 h-full w-full">
        <path
          d="M3 3h34v21c0 9-7 15-17 19C10 39 3 33 3 24Z"
          fill="#0b1014"
          stroke={color}
          strokeOpacity="0.55"
          strokeWidth="1.5"
        />
      </svg>
      <Icon size={size * 0.46} color={color} strokeWidth={1.6} className="relative -mt-0.5" />
    </span>
  )
}
