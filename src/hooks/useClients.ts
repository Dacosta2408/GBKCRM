import { useState, useEffect } from "react";
import { Client, User } from "../types";
import { DEFAULT_CLIENTS } from "../data";
import { checkBridgeHealth, getAllClients, createClient, updateClient, deleteClient } from "../lib/bridgeService";

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

  // Load clients from bridge server on mount if online
  useEffect(() => {
    async function loadInitialClients() {
      const online = await checkBridgeHealth();
      if (online) {
        const bridgeClients = await getAllClients();
        if (bridgeClients && bridgeClients.length > 0) {
          setClients(bridgeClients);
        }
      }
    }
    loadInitialClients();
  }, []);

  // Sync clients state to localstorage (always written as backup)
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

  async function handleUpdateClientStatus(id: string, s: any) {
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

      const online = await checkBridgeHealth();
      if (online) {
        await updateClient(id, updatedCl);
      }
    }
    showToast("Status updated successfully!", "success");
    logActivity("Updated client status", `${updatedCl?.first} ${updatedCl?.last} → ${s}`);
  }

  async function handleUpdateClient(updatedClient: Client) {
    const updated = clients.map(c => c.id === updatedClient.id ? updatedClient : c);
    setClients(updated);
    if (currentClient && currentClient.id === updatedClient.id) {
      setCurrentClient(updatedClient);
    }
    const online = await checkBridgeHealth();
    if (online) {
      await updateClient(updatedClient.id, updatedClient);
    }
  }

  async function handleCreateClient(newClient: Client) {
    setClients(prev => [newClient, ...prev]);
    const online = await checkBridgeHealth();
    if (online) {
      await createClient(newClient);
    }
  }

  async function handleDeleteClient(id: string) {
    setClients(prev => prev.filter(c => c.id !== id));
    if (currentClient && currentClient.id === id) {
      setCurrentClient(null);
    }
    const online = await checkBridgeHealth();
    if (online) {
      await deleteClient(id);
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
    handleUpdateClientStatus,
    handleCreateClient,
    handleDeleteClient
  };
}

