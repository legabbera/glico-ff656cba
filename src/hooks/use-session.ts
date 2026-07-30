import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSession() {
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
      setReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setHasSession(!!s);
      setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  return { ready, hasSession };
}