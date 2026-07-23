"use client";

import { createContext, useContext } from "react";

/** The validated admin token, provided by AdminShell to every admin page. */
export const AdminTokenContext = createContext<string>("");

export function useAdminToken() {
  return useContext(AdminTokenContext);
}
