export type AuthenticatedSocketUser = {
  id: string;
  name: string;
  email: string;
};

export type AckResponse =
  | { ok: true; workspaceId: string }
  | { ok: false; message: string };

export type DocumentAckResponse =
  | { ok: true; workspaceId: string; documentId: string }
  | { ok: false; message: string };

export type DocumentUpdateAckResponse =
  | {
      ok: true;
      workspaceId: string;
      documentId: string;
      content: string;
      lastEditedBy: string;
      updatedAt: string;
      version: number;
    }
  | { ok: false; message: string };

export type DocumentPresenceUser = AuthenticatedSocketUser;

export type ChatMessagePayload = {
  _id: string;
  workspaceId: string;
  content: string;
  createdAt: string;
  sender: { id: string; name: string; email: string };
};

export type ChatAckResponse =
  | { ok: true; message: ChatMessagePayload }
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
  "document:join": (
    payload: unknown,
    ack?: (response: DocumentAckResponse) => void,
  ) => void;
  "document:leave": (
    payload: unknown,
    ack?: (response: DocumentAckResponse) => void,
  ) => void;
  "document:restore": (
    payload: unknown,
    ack?: (response: DocumentUpdateAckResponse) => void,
  ) => void;
  "document:update": (
    payload: unknown,
    ack?: (response: DocumentUpdateAckResponse) => void,
  ) => void;
  "chat:send": (
    payload: unknown,
    ack?: (response: ChatAckResponse) => void,
  ) => void;
}

export interface ServerToClientEvents {
  "document:presence": (payload: {
    workspaceId: string;
    documentId: string;
    users: DocumentPresenceUser[];
  }) => void;
  "document:updated": (payload: {
    workspaceId: string;
    documentId: string;
    content: string;
    lastEditedBy: string;
    updatedAt: string;
    version: number;
  }) => void;
  "chat:message": (payload: ChatMessagePayload) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  user: AuthenticatedSocketUser;
}
