import { Construction, Flame, Layers, Shovel, Truck, type LucideIcon } from 'lucide-react'

import type { ZoneKind } from '@/data/types'

export const ZONE_ICON: Record<ZoneKind, LucideIcon> = {
  crane: Construction,
  scaffold: Layers,
  'steel-deck': Flame,
  unloading: Truck,
  excavation: Shovel,
}
