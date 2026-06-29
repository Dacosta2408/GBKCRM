import { useState, useEffect } from "react";
import { Client, User } from "../types";
import { DEFAULT_CLIENTS } from "../data";

export interface UseClientsDeps {
  currentUser: User;
  logActivity: (action: string, target?: string) => void;
  showToast: (msg: string, type?: "success" | "error", icon?: string) => void;
  setDetailTab: (tab: string) => void;
  logActivityEvent: (event: any) => void;
}

export function useClients({
  currentUser,
  logActivity,
  showToast,
  setDetailTab,
  logActivityEvent
}: UseClientsDeps) {
  // ─── STATE MANAGEMENT ───
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem("gbk_clients");
    return saved ? JSON.parse(saved) : DEFAULT_CLIENTS;
  });

  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [clientViewMode, setClientViewMode] = useState<'database' | 'pipeline'>("database");

  // Sync clients state to localstorage
  useEffect(() => {
    localStorage.setItem("gbk_clients", JSON.stringify(clients));
  }, [clients]);

  // Double click or context opener
  function openClient(id: string, initialTab?: string) {
    const target = clients.find(cl => cl.id === id);
    if (target) {
      setCurrentClient(target);
      setDetailTab(initialTab || "overview");
      logActivity("Viewed client file folder", target.first + " " + target.last);
    }
  }

  function closeDetail() {
    setCurrentClient(null);
  }

  function handleUpdateClientStatus(id: string, s: any) {
    const updated = clients.map(c => c.id === id ? { ...c, status: s, updatedAt: new Date().toISOString() } : c);
    setClients(updated);
    const updatedCl = updated.find(x => x.id === id);
    if (updatedCl) {
      setCurrentClient(updatedCl);
      logActivityEvent({
        clientId: id,
        clientName: `${updatedCl.first} ${updatedCl.last}`,
        eventType: "stage_change",
        user: `${currentUser.first} ${currentUser.last}`,
        timestamp: new Date().toISOString(),
        description: `Transitioned mortgage file folder stage to [${s.toUpperCase()}]`
      });
    }
    showToast("Status updated successfully!", "success");
    logActivity("Updated client status", `${updatedCl?.first} ${updatedCl?.last} → ${s}`);
  }

  function handleUpdateClient(updatedClient: Client) {
    const updated = clients.map(c => c.id === updatedClient.id ? updatedClient : c);
    setClients(updated);
    if (currentClient && currentClient.id === updatedClient.id) {
      setCurrentClient(updatedClient);
    }
  }

  return {
    clients,
    setClients,
    currentClient,
    setCurrentClient,
    clientViewMode,
    setClientViewMode,
    openClient,
    closeDetail,
    handleUpdateClient,
    handleUpdateClientStatus
  };
}
