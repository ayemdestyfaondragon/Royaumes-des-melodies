# Blind Test Musical Disney

Application web statique de blind test musical Disney jouable en solo, en QCM ou entre amis à distance.

## Fonctionnalités incluses
- **Thèmes visuels** : mode **Sombre** et thème **Savane** (sauvegardés automatiquement dans `localStorage`).
- **Multi-sources** : extraits via l'API **iTunes Search**, vidéos **YouTube** avec timecode de départ (masquées pendant la manche pour éviter les spoilers) et liens **audio directs** (MP3, OGG, WAV, Dropbox).
- **Playlist personnalisable** : activation/désactivation titre par titre, recherche en direct, ajout manuel et import/export JSON (`tracks.json`).
- **Modes de jeu & multijoueur à distance** : Saisie libre tolérante aux fautes, QCM à 4 choix, mode Buzzer rapide et salons avec code court (`DISNEY-XXXX`).

## Déploiement rapide sur GitHub Pages
1. Dépose les fichiers `index.html`, `style.css`, `app.js` et `tracks.json` à la racine de ton dépôt GitHub.
2. Va dans **Settings → Pages**.
3. Sélectionne la branche **`main`** et le dossier **`/ (root)`**, puis clique sur **Save**.
