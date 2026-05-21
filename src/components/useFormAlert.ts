"use client";

import { useEffect } from "react";
import Swal from "sweetalert2";

export function useFormAlert(state: { error?: string } | null) {
  useEffect(() => {
    if (state?.error) {
      Swal.fire({
        title: "Error",
        text: state.error,
        icon: "error",
        confirmButtonColor: "#0d9488",
      });
    }
  }, [state?.error]);
}
