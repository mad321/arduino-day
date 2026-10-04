/** World-space layout of the Tower-A site (1 unit ≈ 1 m). Shared by scene components. */

export const BOARD = { width: 40, depth: 30, thickness: 4 }
export const PIT = { x: -12, z: 9, width: 5, depth: 4, floor: -3.4 }

export const FLOOR = 1.8
/** L6 steel deck (Sector 3) level. */
export const DECK_Y = FLOOR * 5

export const CRANE_POS: [number, number, number] = [10, 0, -4]
export const CRANE_PAD = 0.4
export const CRANE_MAST_H = 17
export const SLEW_Y = CRANE_PAD + CRANE_MAST_H
export const JIB_LENGTH = 16
