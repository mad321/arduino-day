import { Home, RotateCcw, RotateCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { STATUS_HEX } from '@/lib/status'
import { cameraApi } from '../scene/camera-api'

const LEGEND = [
  { hex: STATUS_HEX.clear, label: 'Safe / Compliant' },
  { hex: STATUS_HEX.caution, label: 'Near-miss / Pending permit' },
  { hex: STATUS_HEX.critical, label: 'Critical / Stop work' },
]

export function MapControls() {
  return (
    <div className="glass pointer-events-auto flex w-fit items-center gap-3 px-3 py-1.5">
      <ul className="flex items-center gap-3" aria-label="Status legend">
        {LEGEND.map((l) => (
          <li key={l.label} className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <span className="size-2 rounded-full" style={{ backgroundColor: l.hex, boxShadow: `0 0 6px ${l.hex}` }} />
            <span className="hidden md:inline">{l.label}</span>
          </li>
        ))}
      </ul>
      <span className="h-5 w-px bg-zinc-800" />
      <div className="flex items-center gap-0.5">
        <CamButton label="Rotate view left" onClick={() => cameraApi.rotate(-1)}>
          <RotateCcw />
        </CamButton>
        <CamButton label="Rotate view right" onClick={() => cameraApi.rotate(1)}>
          <RotateCw />
        </CamButton>
        <CamButton label="Reset to isometric view" onClick={() => cameraApi.reset()}>
          <Home />
        </CamButton>
      </div>
      <span className="hidden text-[10px] text-zinc-600 xl:inline">
        Drag to orbit · scroll to zoom · right-drag to pan
      </span>
    </div>
  )
}

function CamButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" onClick={onClick} aria-label={label} className="text-zinc-400">
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
