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
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { mergeLegacyRoastHistoryIntoUser } from "@/lib/roast-history";
import { coerceUserCreditsFromDocument, newUserCreditsDefault } from "@/lib/credits-config";

export interface User {
  uid: string;
  email: string;
  credits: number;
  plan: "free" | "pro" | "agency";
  displayName?: string;
  photoURL?: string;
  /** False when Firestore profile could not be loaded; do not trust `credits` for billing UI. */
  firestoreSynced: boolean;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isSyncing: boolean;
  /** False until the first `onAuthStateChanged` event (restored session or signed-out). */
  authResolved: boolean;
  handleGoogleAuth: () => Promise<void>;
  handleEmailSignIn: (email: string, password: string) => Promise<void>;
  handleEmailSignUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateCredits: (newCredits: number) => void;
  updateCreditsAndPlan: (newCredits: number, plan: User["plan"]) => void;
  updateDisplayName: (name: string) => Promise<void>;
  sendPasswordResetToEmail: (email: string) => Promise<void>;
  sendEmailSignInLink: (email: string, nextPath?: string) => Promise<void>;
  completeEmailLinkSignInIfPresent: (href: string) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const authBootstrappedRef = useRef(false);

  const syncUserWithFirestore = useCallback(async (firebaseUser: FirebaseUser) => {
    try {
      setIsSyncing(true);
      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const rawPlan = userData.plan;
        const normalizedPlan =
          typeof rawPlan === "string"
            ? (["free", "pro", "agency"].includes(rawPlan.toLowerCase())
                ? (rawPlan.toLowerCase() as User["plan"])
                : "free")
            : "free";
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          credits: coerceUserCreditsFromDocument(userData.credits),
          plan: normalizedPlan,
          displayName: firebaseUser.displayName || userData.displayName,
          photoURL: firebaseUser.photoURL || userData.photoURL,
          firestoreSynced: true,
        });
      } else {
        const starter = newUserCreditsDefault();
        const newUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          credits: starter,
          plan: "free",
          displayName: firebaseUser.displayName || undefined,
          photoURL: firebaseUser.photoURL || undefined,
          firestoreSynced: true,
        };

        await setDoc(userRef, {
          uid: newUser.uid,
          email: newUser.email,
          credits: newUser.credits,
          plan: newUser.plan,
          displayName: newUser.displayName,
          photoURL: newUser.photoURL,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        setUser(newUser);
      }
      mergeLegacyRoastHistoryIntoUser(firebaseUser.uid);
      setIsSyncing(false);
      setLoading(false);
    } catch (error) {
      console.error("Error syncing user with Firestore:", error);
      setUser((prev) => {
        const same = prev?.uid === firebaseUser.uid;
        return {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          credits: same && prev ? prev.credits : 0,
          plan: same && prev ? prev.plan : "free",
          displayName: firebaseUser.displayName || prev?.displayName,
          photoURL: firebaseUser.photoURL || prev?.photoURL,
          firestoreSynced: false,
        };
      });
      mergeLegacyRoastHistoryIntoUser(firebaseUser.uid);
      setIsSyncing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setIsSyncing(false);

    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    let cancelled = false;
    let unsubscribe: (() => void) | null = null;

    (async () => {
      try {
        await getRedirectResult(auth);
      } catch (e) {
        console.error("Google redirect sign-in error:", e);
      }
      if (cancelled) return;

      unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
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
      await signInWithPopup(auth, provider);
    } catch (error: unknown) {
      const code =
        error &&
        typeof error === "object" &&
        "code" in error &&
        typeof (error as { code: unknown }).code === "string"
          ? (error as { code: string }).code
          : "";

      if (code === "auth/popup-blocked") {
        await signInWithRedirect(auth, provider);
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
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error: unknown) {
      throw mapAuthError(error);
    }
  };

  const handleEmailSignUp = async (email: string, password: string) => {
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
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
    await sendSignInLinkToEmail(auth, trimmed, actionCodeSettings);
    window.localStorage.setItem("emailForSignIn", trimmed);
  };

  const completeEmailLinkSignInIfPresent = async (href: string): Promise<boolean> => {
    if (!isSignInWithEmailLink(auth, href)) {
      return false;
    }
    let email = typeof window !== "undefined" ? window.localStorage.getItem("emailForSignIn") : null;
    if (!email) {
      email = window.prompt("Enter the email address you used to request the sign-in link.");
    }
    if (!email) {
      throw new Error("Email is required to complete sign-in.");
    }
    await signInWithEmailLink(auth, email.trim(), href);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("emailForSignIn");
    }
    return true;
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
    setUser(null);
    setFirebaseUser(null);
  };

  const updateCredits = (newCredits: number) => {
    if (user) {
      setUser({
        ...user,
        credits: newCredits,
        firestoreSynced: true,
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
    const fb = auth.currentUser;
    if (!fb) {
      throw new Error("Not signed in.");
    }
    await updateProfile(fb, { displayName: trimmed });
    setUser((u) => (u ? { ...u, displayName: trimmed, firestoreSynced: u.firestoreSynced } : u));
  };

  const sendPasswordResetToEmail = async (email: string) => {
    const trimmed = email.trim();
    if (!trimmed) {
      throw new Error("Email is required.");
    }
    await sendPasswordResetEmail(auth, trimmed);
  };

  const refreshProfile = useCallback(async () => {
    const fb = auth.currentUser;
    if (!fb) return;
    await syncUserWithFirestore(fb);
  }, [syncUserWithFirestore]);

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        isSyncing,
        authResolved,
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
