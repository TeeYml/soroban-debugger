export interface BreakpointLocation {
  source: string;
  line: number;
  column?: number;
}

export interface StackFrame {
  id: number;
  name: string;
  source: string;
  line: number;
  column: number;
  instructionPointerReference?: string;
}

export interface Variable {
  name: string;
  value: string;
  type?: string;
  variablesReference?: number;
  indexedVariables?: number;
  namedVariables?: number;
}

export interface Scope {
  name: string;
  variablesReference: number;
  expensive: boolean;
  source?: {
    name: string;
    path: string;
  };
  line?: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
}

export interface Thread {
  id: number;
  name: string;
}

export interface StoppedEvent {
  reason: 'breakpoint' | 'step' | 'exception' | 'pause' | 'entry' | 'goto' | 'function breakpoint' | 'instruction breakpoint' | 'other';
  threadId: number;
  allThreadsStopped?: boolean;
  description?: string;
  text?: string;
  preserveFocusWhenOpen?: boolean;
}

export type DebugProtocolMessage = {
  type: 'request' | 'response' | 'event';
  seq: number;
  command?: string;
};

export interface DebuggerState {
  isRunning: boolean;
  isPaused: boolean;
  currentThread?: number;
  breakpoints: Map<string, BreakpointLocation[]>;
  callStack?: StackFrame[];
  variables?: Variable[];
  args?: string;
}

// Wire protocol version negotiation (debug adapter <-> backend)
export const WIRE_PROTOCOL_MIN_VERSION = 1;
export const WIRE_PROTOCOL_MAX_VERSION = 1;

export type WireHandshakeRequest = {
  type: 'Handshake';
  client_name: string;
  client_version: string;
  protocol_min: number;
  protocol_max: number;
};

export type WireHandshakeAck = {
  type: 'HandshakeAck';
  server_name: string;
  server_version: string;
  protocol_min: number;
  protocol_max: number;
  selected_version: number;
};

export type WireIncompatibleProtocol = {
  type: 'IncompatibleProtocol';
  message: string;
  server_name: string;
  server_version: string;
  protocol_min: number;
  protocol_max: number;
};
