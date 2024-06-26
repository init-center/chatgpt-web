"use client";

import { SnackbarProvider as SnackProvider } from "notistack";

export function SnackbarProvider(props: { children: React.ReactNode }) {
  return (
    <SnackProvider
      maxSnack={3}
      anchorOrigin={{
        horizontal: "center",
        vertical: "top",
      }}
      autoHideDuration={2000}
    >
      {props.children}
    </SnackProvider>
  );
}
