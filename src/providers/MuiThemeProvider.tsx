"use client";

import { ThemeProvider, createTheme } from "@mui/material/styles";
const theme = createTheme({
  palette: {
    primary: {
      main: "#000",
    },
  },
});


export function MuiThemeProvider(props: { children: React.ReactNode }) {
  return <ThemeProvider theme={theme}>{props.children}</ThemeProvider>;
}
