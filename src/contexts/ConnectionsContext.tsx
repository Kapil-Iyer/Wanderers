"use client";

/**
 * Connections - real "Wanna Wander?" connection requests, backed by
 * /api/connections (GET/POST/PATCH) and the Supabase `connections` table.
 *
 * Guest mode never calls these routes - all methods are no-ops for guests,
 * consistent with GuestContext's "no Supabase call on a guest's behalf" rule.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { supabase } from "@/lib/supabase";
import { useGuest } from "@/contexts/GuestContext";

export type ConnectionRequest = {
  id: string; // connections.id
  name: string;
  avatar: string;
};

type ConnectedFriendEntry = {
  id: string;
  name: string;
  avatar: string;
  currentEvent?: string;
};

type ConnectionsContextValue = {
  connectionRequests: ConnectionRequest[];
  filteredConnectionRequests: ConnectionRequest[];
  connectionsCount: number;
  isConnected: (userId: string) => boolean;
  isPending: (userId: string) => boolean;
  addConnection: (userId: string) => void;
  removeConnection: (userId: string) => void;
  addPendingRequest: (userId: string) => void;
  removePendingRequest: (userId: string) => void;
  acceptRequest: (requestId: string) => void;
  acceptRequestByProfileId: (userId: string) => void;
  hasIncomingRequest: (userId: string) => boolean;
  rejectRequest: (requestId: string) => void;
  getConnectedFriends: () => ConnectedFriendEntry[];
};

const ConnectionsContext = createContext<ConnectionsContextValue | null>(null);

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function ConnectionsProvider({ children }: { children: React.ReactNode }) {
  const { isGuest, guestResolved } = useGuest();
  const [connections, setConnections] = useState<ConnectedFriendEntry[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ConnectionRequest[]>([]);
  const [outgoingPendingUserIds, setOutgoingPendingUserIds] = useState<Set<string>>(new Set());
  const requestByUserId = useRef<Map<string, string>>(new Map()); // userId -> connections.id, for incoming requests

  const refresh = useCallback(async () => {
    if (isGuest) return;
    try {
      const headers = await authHeader();
      if (!headers.Authorization) return;
      const res = await fetch("/api/connections", { headers });
      if (!res.ok) return;
      const json = await res.json();
      if (!json?.success) return;

      const accepted: ConnectedFriendEntry[] = (json.data.connections ?? []).map(
        (c: { user_id: string; name: string; avatar: string }) => ({
          id: c.user_id,
          name: c.name,
          avatar: c.avatar,
        })
      );
      const incoming: ConnectionRequest[] = (json.data.pending_requests ?? []).map(
        (r: { id: string; user_id: string; name: string; avatar: string }) => ({
          id: r.id,
          name: r.name,
          avatar: r.avatar,
        })
      );
      requestByUserId.current = new Map(
        (json.data.pending_requests ?? []).map((r: { id: string; user_id: string }) => [r.user_id, r.id])
      );

      setConnections(accepted);
      setPendingRequests(incoming);
      setOutgoingPendingUserIds(new Set(json.data.outgoing_pending_user_ids ?? []));
    } catch {
      /* leave state as-is; caller actions will surface their own errors */
    }
  }, [isGuest]);

  useEffect(() => {
    if (!guestResolved) return;
    refresh();
  }, [guestResolved, refresh]);

  const connectedIds = useMemo(() => new Set(connections.map((c) => c.id)), [connections]);

  const isConnected = useCallback((userId: string) => connectedIds.has(userId), [connectedIds]);

  const isPending = useCallback(
    (userId: string) => outgoingPendingUserIds.has(userId),
    [outgoingPendingUserIds]
  );

  const hasIncomingRequest = useCallback(
    (userId: string) => requestByUserId.current.has(userId),
    // requestByUserId is a ref (not reactive on its own) - re-derive whenever
    // the request list it was built from changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pendingRequests]
  );

  const addPendingRequest = useCallback(
    (userId: string) => {
      if (isGuest) return;
      setOutgoingPendingUserIds((prev) => new Set(prev).add(userId)); // optimistic
      (async () => {
        try {
          const headers = await authHeader();
          const res = await fetch("/api/connections", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...headers },
            body: JSON.stringify({ receiver_id: userId }),
          });
          if (!res.ok) {
            // Roll back optimistic state on failure (already exists, invalid id, etc).
            setOutgoingPendingUserIds((prev) => {
              const next = new Set(prev);
              next.delete(userId);
              return next;
            });
          }
        } catch {
          setOutgoingPendingUserIds((prev) => {
            const next = new Set(prev);
            next.delete(userId);
            return next;
          });
        }
      })();
    },
    [isGuest]
  );

  const removePendingRequest = useCallback((userId: string) => {
    // No DELETE endpoint - withdrawing a sent request isn't supported yet.
    // Kept as a no-op so existing callers don't break.
    void userId;
  }, []);

  const respondToRequest = useCallback(
    async (connectionId: string, action: "accept" | "decline") => {
      if (isGuest) return;
      try {
        const headers = await authHeader();
        const res = await fetch("/api/connections", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify({ connection_id: connectionId, action }),
        });
        if (res.ok) await refresh();
      } catch {
        /* leave state as-is on failure */
      }
    },
    [isGuest, refresh]
  );

  const acceptRequest = useCallback((requestId: string) => respondToRequest(requestId, "accept"), [respondToRequest]);
  const rejectRequest = useCallback((requestId: string) => respondToRequest(requestId, "decline"), [respondToRequest]);

  const acceptRequestByProfileId = useCallback(
    (userId: string) => {
      const requestId = requestByUserId.current.get(userId);
      if (requestId) respondToRequest(requestId, "accept");
    },
    [respondToRequest]
  );

  // No DELETE /api/connections endpoint yet - disconnect isn't wired to the
  // backend. Kept as a no-op so the "Disconnect" button doesn't crash; the
  // connection will simply reappear on next refresh.
  const removeConnection = useCallback((userId: string) => {
    void userId;
  }, []);

  const addConnection = useCallback((userId: string) => {
    void userId;
  }, []);

  const getConnectedFriends = useCallback((): ConnectedFriendEntry[] => {
    return [...connections].sort((a, b) => a.name.localeCompare(b.name));
  }, [connections]);

  const connectionsCount = connections.length;

  const value = useMemo(
    () => ({
      connectionRequests: pendingRequests,
      filteredConnectionRequests: pendingRequests,
      connectionsCount,
      isConnected,
      isPending,
      addConnection,
      removeConnection,
      addPendingRequest,
      removePendingRequest,
      acceptRequest,
      acceptRequestByProfileId,
      hasIncomingRequest,
      rejectRequest,
      getConnectedFriends,
    }),
    [
      pendingRequests,
      connectionsCount,
      isConnected,
      isPending,
      addConnection,
      removeConnection,
      addPendingRequest,
      removePendingRequest,
      acceptRequest,
      acceptRequestByProfileId,
      hasIncomingRequest,
      rejectRequest,
      getConnectedFriends,
    ]
  );

  return <ConnectionsContext.Provider value={value}>{children}</ConnectionsContext.Provider>;
}

export function useConnections() {
  const ctx = useContext(ConnectionsContext);
  if (!ctx) {
    throw new Error("useConnections must be used within ConnectionsProvider");
  }
  return ctx;
}
