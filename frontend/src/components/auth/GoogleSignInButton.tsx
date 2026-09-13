"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/AuthContext";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              width?: string | number;
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface GoogleSignInButtonProps {
  redirectUrl?: string;
  buttonText?: "Sign in with Google" | "Sign up with Google" | "Continue with Google";
  onSuccess?: () => void;
  onError?: (errMessage: string) => void;
}

export function GoogleSignInButton({
  redirectUrl = "/",
  buttonText = "Continue with Google",
  onSuccess,
  onError,
}: GoogleSignInButtonProps) {
  const router = useRouter();
  const { loginWithGoogle } = useAuth();
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || "";

  const handleCredentialResponse = async (credential: string) => {
    setErrorMessage(null);
    try {
      await loginWithGoogle(credential);
      if (onSuccess) {
        onSuccess();
      }
      router.push(redirectUrl);
    } catch (err: any) {
      const msg = err.message || "Google authentication failed. Please try again.";
      setErrorMessage(msg);
      if (onError) onError(msg);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined" || !clientId) return;

    if (window.google?.accounts?.id) {
      setScriptLoaded(true);
      return;
    }

    const existingScript = document.getElementById("google-gsi-client");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "google-gsi-client";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => setScriptLoaded(true);
      document.head.appendChild(script);
    } else {
      existingScript.addEventListener("load", () => setScriptLoaded(true));
    }
  }, [clientId]);

  useEffect(() => {
    if (!scriptLoaded || !clientId || !window.google?.accounts?.id) return;

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response.credential) {
            handleCredentialResponse(response.credential);
          }
        },
      });

      if (googleBtnContainerRef.current) {
        googleBtnContainerRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
          theme: "outline",
          size: "large",
          type: "standard",
          shape: "pill",
          text: buttonText.includes("up") ? "signup_with" : "continue_with",
          width: 340,
        });
      }
    } catch (e) {
      console.warn("Failed to initialize Google Sign In widget:", e);
    }
  }, [scriptLoaded, clientId, buttonText]);

  // Hide completely if Google Client ID is not configured
  if (!clientId) {
    return null;
  }

  return (
    <div className="w-full space-y-4">
      <div className="relative flex items-center justify-center my-4">
        <div className="border-t border-neutral-200 w-full" />
        <span className="bg-white px-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider shrink-0">
          or continue with
        </span>
        <div className="border-t border-neutral-200 w-full" />
      </div>

      {errorMessage && (
        <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl text-center">
          {errorMessage}
        </div>
      )}

      <div className="flex justify-center w-full min-h-[44px]">
        <div ref={googleBtnContainerRef} className="w-full flex justify-center" />
      </div>
    </div>
  );
}
