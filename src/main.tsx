import { MantineProvider } from "@mantine/core";
import { NotificationsProvider } from '@mantine/notifications';
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./style.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <MantineProvider theme={{
            fontFamily: 'Open Sans',
            colorScheme: 'dark',
            components: {
                // Button: { defaultProps: { style: { paddingLeft: 0, paddingRight: 5 } } },
            },
        }} withGlobalStyles withNormalizeCSS>
            <NotificationsProvider>
                <App />
            </NotificationsProvider>
        </MantineProvider>
    </React.StrictMode>
);
