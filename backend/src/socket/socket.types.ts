export type AuthenticatedSocketUser = {
  id: string;
  name: string;
  email: string;
};

export type AckResponse =
  | { ok: true; workspaceId: string }
  | { ok: false; message: string };

export interface ClientToServerEvents {
  "workspace:join": (
    payload: unknown,
    ack?: (response: AckResponse) => void,
  ) => void;
  "workspace:leave": (
    payload: unknown,
    ack?: (response: AckResponse) => void,
  ) => void;
}

// Server -> client events are added in later phases.
export interface ServerToClientEvents {}

export interface InterServerEvents {}

export interface SocketData {
  user: AuthenticatedSocketUser;
}
