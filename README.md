# Flip Master

1'den 12'ye kadar kartları sırayla açmaya dayalı, çok oyunculu bir hafıza oyunu. Kurallar: `src/pages/GameRules.tsx`.

## Lokalde çalıştırma

Node 18+ gerekir (`nvm use` ile `.nvmrc`'deki sürüm seçilir).

```bash
npm install && (cd server && npm install)

npm run server   # Socket.io oyun sunucusu → http://localhost:3001
npm run dev      # Arayüz → http://localhost:5173
```

Aynı tarayıcıda iki sekme açarak çok oyunculu test yapılabilir; her sekme ayrı oyuncu sayılır.

- Sunucu adresi `VITE_SERVER_URL` ile, sunucu portu `PORT` ile, izin verilen origin `CLIENT_ORIGIN` ile değiştirilebilir.
- Kalıcı veri yok: skorlar oda bazında sunucunun hafızasında, kullanıcı adı/avatar tarayıcıda (sekme kapanınca silinir) tutulur.
- Oyun durumu sunucuda tutulur; kapalı kartların değerleri istemciye gönderilmez.

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```
