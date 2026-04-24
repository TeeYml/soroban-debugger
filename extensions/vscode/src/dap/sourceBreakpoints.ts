export interface ResolvedBreakpoint {
  requestedLine: number
  line: number
  verified: boolean
  functionName?: string
  reasonCode?: string
  message?: string
  setBreakpoint?: boolean
}

export interface DiagnosticReport {
  line: number
  status: string
  reason: string
  functionName?: string
}

export function diagnoseBreakpoints(
  sourcePath: string,
  lines: number[]
): DiagnosticReport[] {
  return lines.map((line) => {
    return {
      line,
      status: 'ℹ️ Managed by Backend',
      reason: 'Exact line breakpoints are managed by the debugger backend using DWARF source maps. Heuristic mapping has been removed.',
    }
  })
}
