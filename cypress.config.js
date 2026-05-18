import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    // Pointe directement vers Swisscenter
    baseUrl: 'https://tpi26nde.mycpnv.ch',
    // Désactive la sécurité web stricte pour éviter les soucis avec les API distantes (Render)
    chromeWebSecurity: false,
    setupNodeEvents(on, config) {
    },
  },
});