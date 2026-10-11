"use client";

import { useEffect, useState } from "react";
import { fetchStoreUser, type StoreUser } from "@/features/store/store-frame";
import { Home } from "@/features/store/home";
import { Landing } from "@/features/store/landing";

export default function StorePage() {
  const [user, setUser] = useState<StoreUser | null>(null);

  useEffect(() => {
    let mounted = true;
    void fetchStoreUser().then((u) => { if (mounted) setUser(u); }).catch(() => undefined);
    return () => { mounted = false; };
  }, []);

  return user ? <Home name={user.name} /> : <Landing />;
}
