import React, { useState, useEffect } from "react";
import { User } from "../types";
import { DEFAULT_USERS } from "../data";

export interface UseAuthDeps {
  showToast: (msg: string, type?: "success" | "error", icon?: string) => void;
  logActivity: (action: string, target?: string) => void;
}

export function useAuth({ showToast, logActivity }: UseAuthDeps) {
  // ─── AUTHENTICATION & SECURITY STATE ───
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USERS[0]); // David Acosta (Owner)
  const [appLocked, setAppLocked] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>("");
  const [pinError, setPinError] = useState<string>("");
  const [userRoster, setUserRoster] = useState<User[]>(() => {
    const saved = localStorage.getItem("gbk_roster");
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });
  const [lockoutTries, setLockoutTries] = useState<number>(0);
  const [lockoutActive, setLockoutActive] = useState<boolean>(false);
  const [profileModalOpen, setProfileModalOpen] = useState<boolean>(false);
  const [profileTab, setProfileTab] = useState<'profile' | 'signup' | 'switch'>('profile');

  // ─── ACTIVE USER EMAIL EDIT CREDENTIALS STATE ───
  const [activeHost, setActiveHost] = useState("");
  const [activePort, setActivePort] = useState("");
  const [activeUsername, setActiveUsername] = useState("");
  const [activePassword, setActivePassword] = useState("");

  // ─── SIGNUP FORM STATE ───
  const [suFirst, setSuFirst] = useState("");
  const [suLast, setSuLast] = useState("");
  const [suEmail, setSuEmail] = useState("");
  const [suRole, setSuRole] = useState<'Owner / Master Admin' | 'Super Admin' | 'IT / Developer' | 'Senior Broker' | 'Agent'>('Agent');
  const [suPhone, setSuPhone] = useState("");
  const [suPin, setSuPin] = useState("");
  const [suFsra, setSuFsra] = useState("");
  const [suHost, setSuHost] = useState("imap.gmail.com");
  const [suPort, setSuPort] = useState("993");
  const [suPass, setSuPass] = useState("");

  // ─── SWITCH USER FORM STATE ───
  const [swTargetId, setSwTargetId] = useState("");
  const [swPin, setSwPin] = useState("");
  const [swError, setSwError] = useState("");

  // Synchronize state when the active user switches
  useEffect(() => {
    setActiveHost(currentUser.emailHost || "imap.gmail.com");
    setActivePort(currentUser.emailPort || "993");
    setActiveUsername(currentUser.emailUsername || currentUser.email);
    setActivePassword(currentUser.emailPassword || "");
  }, [currentUser]);

  // Persist userRoster to localStorage via useEffect
  useEffect(() => {
    localStorage.setItem("gbk_roster", JSON.stringify(userRoster));
  }, [userRoster]);

  // Helpers
  const isOwner = () => currentUser.isOwner || currentUser.role === "Owner / Master Admin";

  const getAgentNames = () => userRoster.filter(u => u.status === "active").map(u => u.first + " " + u.last);

  // ─── LOGIN OVERLAY HANDLE ───
  function handleUnlock() {
    if (lockoutActive) return;

    const match = userRoster.find(u => u.pin === pinInput && u.status === "active");
    if (match) {
      setCurrentUser(match);
      setAppLocked(false);
      setPinInput("");
      setPinError("");
      setLockoutTries(0);
      logActivity("Unlocked Station (" + match.role + ")");
      showToast("Workstation Unlocked", "success", "🔓");
    } else {
      const nextTries = lockoutTries + 1;
      setLockoutTries(nextTries);
      setPinInput("");
      
      if (nextTries >= 3) {
        setLockoutActive(true);
        setPinError("Too many attempts. Please wait 30 seconds.");
        setTimeout(() => {
          setLockoutActive(false);
          setLockoutTries(0);
          setPinError("");
        }, 30000);
      } else {
        setPinError(`Invalid security PIN. Attempt ${nextTries} of 3.`);
      }
    }
  }

  return {
    currentUser,
    setCurrentUser,
    appLocked,
    setAppLocked,
    pinInput,
    setPinInput,
    pinError,
    setPinError,
    userRoster,
    setUserRoster,
    lockoutTries,
    setLockoutTries,
    lockoutActive,
    setLockoutActive,
    profileModalOpen,
    setProfileModalOpen,
    profileTab,
    setProfileTab,
    activeHost,
    setActiveHost,
    activePort,
    setActivePort,
    activeUsername,
    setActiveUsername,
    activePassword,
    setActivePassword,
    suFirst,
    setSuFirst,
    suLast,
    setSuLast,
    suEmail,
    setSuEmail,
    suRole,
    setSuRole,
    suPhone,
    setSuPhone,
    suPin,
    setSuPin,
    suFsra,
    setSuFsra,
    suHost,
    setSuHost,
    suPort,
    setSuPort,
    suPass,
    setSuPass,
    swTargetId,
    setSwTargetId,
    swPin,
    setSwPin,
    swError,
    setSwError,
    handleUnlock,
    isOwner,
    getAgentNames
  };
}
