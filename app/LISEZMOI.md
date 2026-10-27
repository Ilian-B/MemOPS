# Application

PWA de quiz (Svelte + Vite + vite-plugin-pwa + Vitest). Commandes à lancer dans ce dossier :

- `npm install` : installe les dépendances.
- `npm run dev` : lance l'appli en développement.
- `npm test` : lance les tests.
- `npm run build` puis `npm run preview` : construit et prévisualise la version publiable.

Astuce iCloud : le dossier est synchronisé par iCloud, qui ne doit pas copier les dépendances. Après chaque `npm install`, le script `postinstall` pose sur `node_modules` le marqueur macOS `com.apple.fileprovider.ignore#P`, qui demande à iCloud de l'ignorer. Pour le vérifier : `xattr -l node_modules`.
