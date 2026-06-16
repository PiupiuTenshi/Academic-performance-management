import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

// Hook tiện lợi để lấy auth context
export function useAuth() {
  return useContext(AuthContext);
}
