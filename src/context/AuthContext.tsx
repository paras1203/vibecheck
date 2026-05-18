"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useRef,
} from "react";
import {
  User as FirebaseUser,
  onAuthStateChanged,
  reload,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  getAdditionalUserInfo,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  type ActionCodeSettings,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";
import {
  getFirebaseAuth,
  hydrateFirebaseClientFromApi,
  isFirebaseClientConfigured,
} from "@/lib/firebase";
import { mergeLegacyRoastHistoryIntoUser } from "@/lib/roast-history";
import { newUserCreditsDefault } from "@/lib/credits-config";
import type { UserProfilePayload } from "@/lib/user-profile-from-firestore";
import {
  clearPostSignupOnboardingPending,
  setPostSignupOnboardingPending,
} from "@/lib/post-signup-onboarding";

export interface User {
  uid: string;
  email: string;
  credits: number;
  plan: "free" | "pro" | "agency";
  displayName?: string;
  photoURL?: string;
  /** False when Firestore profile could not be loaded; do not trust `credits` for billing UI. */
  firestoreSynced: boolean;
  onboardingCompleted: boolean;
  onboardingRole?: string;
  onboardingGoal?: string;
  /** Shown once on home/dashboard; cleared when user dismisses. */
  pendingHomeMessage?: string;
  /** Anonymous checkout: receipt email captured before Dodo (`guest-checkout-contact`). */
  guestCheckoutEmail?: string;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isSyncing: boolean;
  /** False until the first `onAuthStateChanged` event (restored session or signed-out). */
  authResolved: boolean;
  /** Client Firebase SDK has valid config (build-time vars or hydrated from `/api/firebase/client-config`). */
  firebaseConfigured: boolean;
  handleGoogleAuth: () => Promise<void>;
  handleEmailSignIn: (email: string, password: string) => Promise<void>;
  handleEmailSignUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateCredits: (newCredits: number, options?: { fromServer?: boolean }) => void;
  updateCreditsAndPlan: (newCredits: number, plan: User["plan"]) => void;
  updateDisplayName: (name: string) => Promise<void>;
  sendPasswordResetToEmail: (email: string) => Promise<void>;
  sendEmailSignInLink: (email: string, nextPath?: string) => Promise<void>;
  completeEmailLinkSignInIfPresent: (href: string) => Promise<boolean>;
  refreshProfile: () => Promise<{ firestoreSynced: boolean; credits: number }>;
  dismissPendingHomeMessage: () => Promise<void>;
  completeProductOnboarding: (opts: {
    onboardingRole: string;
    onboardingGoal: string;
    displayName?: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function profilePayloadToUser(
  profile: UserProfilePayload,
  firebaseUser: FirebaseUser,
): User {
  return {
    uid: profile.uid,
    email: profile.email || firebaseUser.email || "",
    credits: profile.credits,
    plan: profile.plan,
    displayName: profile.displayName ?? firebaseUser.displayName ?? undefined,
    photoURL: profile.photoURL ?? firebaseUser.photoURL ?? undefined,
    firestoreSynced: true,
    onboardingCompleted: profile.onboardingCompleted,
    onboardingRole: profile.onboardingRole,
    onboardingGoal: profile.onboardingGoal,
    pendingHomeMessage: profile.pendingHomeMessage,
    ...(profile.guestCheckoutEmail ? { guestCheckoutEmail: profile.guestCheckoutEmail } : {}),
  };
}

function mapAuthError(error: unknown): Error {
  const code =
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
      ? (error as { code: string }).code
      : "";
  if (code === "auth/email-already-in-use") {
    return new Error("That email is already registered. Try signing in.");
  }
  if (code === "auth/invalid-email") {
    return new Error("Invalid email address.");
  }
  if (code === "auth/weak-password") {
    return new Error("Password is too weak. Use at least 6 characters.");
  }
  if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
    return new Error("Incorrect email or password.");
  }
  if (code === "auth/too-many-requests") {
    return new Error("Too many attempts. Try again later.");
  }
  if (code === "auth/auth-domain-config-required" || code === "auth/unauthorized-domain") {
    return new Error(
      "This site's domain is not allowed for sign-in. In Firebase Console → Authentication → Settings, add your domain under Authorized domains (e.g. your Vercel URL without path)."
    );
  }
  const message =
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
      ? (error as { message: string }).message
      : "Authentication failed.";
  return new Error(message);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [authResolved, setAuthResolved] = useState(false);
  const [firebaseConfigured, setFirebaseConfigured] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const authBootstrappedRef = useRef(false);

  const syncUserWithFirestore = useCallback(async (firebaseUser: FirebaseUser) => {
    try {
      setIsSyncing(true);
      const token = await firebaseUser.getIdToken();
      const res = await fetch("/api/user/profile", {
        method: "GET",
        credentials: "same-origin",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as {
        profile?: UserProfilePayload;
        error?: string;
        details?: string;
      };
      if (!res.ok || !data.profile) {
        throw new Error(data.details || data.error || "Could not load profile");
      }

      const syncedUser = profilePayloadToUser(data.profile, firebaseUser);
      const credits = syncedUser.credits;
      setUser(syncedUser);
      mergeLegacyRoastHistoryIntoUser(firebaseUser.uid);
      setIsSyncing(false);
      setLoading(false);
      return { firestoreSynced: true as const, credits };
    } catch (error) {
      console.error("Error syncing user with Firestore:", error);
      let resolvedCredits = 0;
      setUser((prev) => {
        const same = prev?.uid === firebaseUser.uid;
        resolvedCredits = same && prev ? prev.credits : 0;
        return {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          credits: resolvedCredits,
          plan: same && prev ? prev.plan : "free",
          displayName: firebaseUser.displayName || prev?.displayName,
          photoURL: firebaseUser.photoURL || prev?.photoURL,
          firestoreSynced: false,
          onboardingCompleted: false,
        };
      });
      mergeLegacyRoastHistoryIntoUser(firebaseUser.uid);
      setIsSyncing(false);
      setLoading(false);
      return { firestoreSynced: false as const, credits: resolvedCredits };
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setIsSyncing(false);
    setFirebaseConfigured(false);

    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    let cancelled = false;
    let unsubscribe: (() => void) | null = null;

    (async () => {
      if (!isFirebaseClientConfigured()) {
        await hydrateFirebaseClientFromApi();
      }
      if (cancelled) return;

      if (!isFirebaseClientConfigured()) {
        setFirebaseUser(null);
        setUser(null);
        authBootstrappedRef.current = true;
        setAuthResolved(true);
        setFirebaseConfigured(false);
        setLoading(false);
        setIsSyncing(false);
        return;
      }

      setFirebaseConfigured(true);

      try {
        const redirectCred = await getRedirectResult(getFirebaseAuth());
        if (redirectCred) {
          const info = getAdditionalUserInfo(redirectCred);
          if (info?.isNewUser) setPostSignupOnboardingPending();
        }
      } catch (e) {
        console.error("Google redirect sign-in error:", e);
      }
      if (cancelled) return;

      unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (fbUser) => {
        if (cancelled) return;
        if (!authBootstrappedRef.current) {
          authBootstrappedRef.current = true;
          setAuthResolved(true);
        }
        setFirebaseUser(fbUser);

        if (fbUser) {
          const placeholderCredits = newUserCreditsDefault();
          setUser((prev) => ({
            uid: fbUser.uid,
            email: fbUser.email || "",
            credits: prev?.uid === fbUser.uid ? prev.credits : placeholderCredits,
            plan: prev?.uid === fbUser.uid ? prev.plan : "free",
            displayName: fbUser.displayName || prev?.displayName,
            photoURL: fbUser.photoURL || prev?.photoURL,
            firestoreSynced: false,
            onboardingCompleted: prev?.uid === fbUser.uid ? prev.onboardingCompleted : false,
            pendingHomeMessage: prev?.uid === fbUser.uid ? prev.pendingHomeMessage : undefined,
          }));
          setLoading(false);
          setIsSyncing(true);
          await syncUserWithFirestore(fbUser);
        } else {
          setUser(null);
          setLoading(false);
          setIsSyncing(false);
        }
      });

      unsubscribeRef.current = unsubscribe;
      if (cancelled) {
        unsubscribe();
        unsubscribeRef.current = null;
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [syncUserWithFirestore]);

  const handleGoogleAuth = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope("email");
    provider.addScope("profile");

    try {
      setIsSyncing(true);
      const cred = await signInWithPopup(getFirebaseAuth(), provider);
      const info = getAdditionalUserInfo(cred);
      if (info?.isNewUser) setPostSignupOnboardingPending();
    } catch (error: unknown) {
      const code =
        error &&
        typeof error === "object" &&
        "code" in error &&
        typeof (error as { code: unknown }).code === "string"
          ? (error as { code: string }).code
          : "";

      if (code === "auth/popup-blocked") {
        await signInWithRedirect(getFirebaseAuth(), provider);
        return;
      }

      console.error("Error signing in with Google:", error);
      setIsSyncing(false);

      const message =
        error &&
        typeof error === "object" &&
        "message" in error &&
        typeof (error as { message: unknown }).message === "string"
          ? (error as { message: string }).message
          : "";

      if (code === "auth/popup-closed-by-user") {
        throw new Error("Sign-in popup was closed. Please try again.");
      }
      if (code === "auth/cancelled-popup-request") {
        throw new Error("Sign-in was cancelled. Please try again.");
      }
      if (code === "auth/network-request-failed") {
        throw new Error(
          "Network error. Please check your connection and try again."
        );
      }
      if (code === "auth/auth-domain-config-required" || code === "auth/unauthorized-domain") {
        throw new Error(
          "This site's domain is not allowed for Google sign-in. In Firebase Console → Authentication → Settings, add your domain under Authorized domains (e.g. your Vercel URL)."
        );
      }
      if (message) {
        throw new Error(message);
      }
      throw new Error("Authentication failed. Please try again.");
    }
  };

  const handleEmailSignIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
    } catch (error: unknown) {
      throw mapAuthError(error);
    }
  };

  const handleEmailSignUp = async (email: string, password: string) => {
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }
    try {
      await createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
      setPostSignupOnboardingPending();
    } catch (error: unknown) {
      throw mapAuthError(error);
    }
  };

  const sendEmailSignInLink = async (email: string, nextPath = "/dashboard") => {
    const trimmed = email.trim();
    if (!trimmed) {
      throw new Error("Email is required.");
    }
    if (typeof window === "undefined") {
      throw new Error("Email link sign-in runs in the browser only.");
    }
    const safeNext =
      nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/dashboard";
    const continueUrl = `${window.location.origin}/login?next=${encodeURIComponent(safeNext)}`;
    const actionCodeSettings = {
      url: continueUrl,
      handleCodeInApp: true,
    };
    await sendSignInLinkToEmail(getFirebaseAuth(), trimmed, actionCodeSettings);
    window.localStorage.setItem("emailForSignIn", trimmed);
  };

  const completeEmailLinkSignInIfPresent = async (href: string): Promise<boolean> => {
    if (!isSignInWithEmailLink(getFirebaseAuth(), href)) {
      return false;
    }
    let email = typeof window !== "undefined" ? window.localStorage.getItem("emailForSignIn") : null;
    if (!email) {
      email = window.prompt("Enter the email address you used to request the sign-in link.");
    }
    if (!email) {
      throw new Error("Email is required to complete sign-in.");
    }
    const linkCred = await signInWithEmailLink(getFirebaseAuth(), email.trim(), href);
    const linkInfo = getAdditionalUserInfo(linkCred);
    if (linkInfo?.isNewUser) setPostSignupOnboardingPending();
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("emailForSignIn");
    }
    return true;
  };

  const logout = async () => {
    try {
      await signOut(getFirebaseAuth());
    } catch (error) {
      console.error("Error signing out:", error);
    }
    clearPostSignupOnboardingPending();
    setUser(null);
    setFirebaseUser(null);
  };

  const updateCredits = (newCredits: number, options?: { fromServer?: boolean }) => {
    if (user) {
      const fromServer = options?.fromServer ?? false;
      setUser({
        ...user,
        credits: newCredits,
        firestoreSynced: fromServer ? true : user.firestoreSynced,
      });
    }
  };

  const updateCreditsAndPlan = (newCredits: number, plan: User["plan"]) => {
    if (user) {
      setUser({
        ...user,
        credits: newCredits,
        plan,
        firestoreSynced: true,
      });
    }
  };

  const updateDisplayName = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error("Name is required.");
    }
    const fb = getFirebaseAuth().currentUser;
    if (!fb) {
      throw new Error("Not signed in.");
    }
    const token = await fb.getIdToken();
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ displayName: trimmed }),
    });
    const data = (await res.json()) as { error?: string; details?: string };
    if (!res.ok) {
      throw new Error(data.details || data.error || "Could not update name.");
    }
    await reload(fb);
    await syncUserWithFirestore(fb);
  };

  const sendPasswordResetToEmail = async (email: string) => {
    const trimmed = email.trim();
    if (!trimmed) {
      throw new Error("Email is required.");
    }
    if (typeof window === "undefined") {
      throw new Error("Password reset can only be requested from the browser.");
    }
    const actionCodeSettings: ActionCodeSettings = {
      url: `${window.location.origin}/login`,
      handleCodeInApp: false,
    };
    await sendPasswordResetEmail(getFirebaseAuth(), trimmed, actionCodeSettings);
  };

  const refreshProfile = useCallback(async () => {
    const fb = getFirebaseAuth().currentUser;
    if (!fb) return { firestoreSynced: false as const, credits: 0 };
    return syncUserWithFirestore(fb);
  }, [syncUserWithFirestore]);

  const dismissPendingHomeMessage = useCallback(async () => {
    const fb = getFirebaseAuth().currentUser;
    if (!fb || !user?.uid) return;
    try {
      const token = await fb.getIdToken();
      const res = await fetch("/api/user/dismiss-home-message", {
        method: "POST",
        credentials: "same-origin",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Could not dismiss message");
      }
      setUser((u) => (u ? { ...u, pendingHomeMessage: undefined } : u));
    } catch (e) {
      console.error("dismissPendingHomeMessage:", e);
    }
  }, [user?.uid]);

  const completeProductOnboarding = useCallback(
    async (opts: {
      onboardingRole: string;
      onboardingGoal: string;
      displayName?: string;
    }) => {
      const fb = getFirebaseAuth().currentUser;
      if (!fb) {
        throw new Error("Not signed in.");
      }
      const token = await fb.getIdToken();
      const res = await fetch("/api/user/complete-onboarding", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName: opts.displayName,
          onboardingRole: opts.onboardingRole,
          onboardingGoal: opts.onboardingGoal,
        }),
      });
      const data = (await res.json()) as { error?: string; details?: string };
      if (!res.ok) {
        throw new Error(data.details || data.error || "Could not save onboarding");
      }
      clearPostSignupOnboardingPending();
      await syncUserWithFirestore(fb);
    },
    [syncUserWithFirestore],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        isSyncing,
        authResolved,
        firebaseConfigured,
        handleGoogleAuth,
        handleEmailSignIn,
        handleEmailSignUp,
        logout,
        updateCredits,
        updateCreditsAndPlan,
        updateDisplayName,
        sendPasswordResetToEmail,
        sendEmailSignInLink,
        completeEmailLinkSignInIfPresent,
        refreshProfile,
        dismissPendingHomeMessage,
        completeProductOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
