# Blind Test Musical Disney (Multijoueur en ligne PeerJS)

Application web statique de blind test musical Disney jouable en solo ou entre amis à distance sur téléphone et ordinateur via **PeerJS (WebRTC)**, sans serveur ni base de données externe.

## Fonctionnalités incluses
- **Multijoueur en ligne PeerJS (WebRTC)** :
  - **Hôte** : crée un salon (`DISNEY-XXXX`), copie un lien d'invitation direct (`?room=DISNEY-XXXX`), diffuse la musique et arbitre les buzzers ou valide automatiquement les réponses écrites.
  - **Joueur à distance (Mobile / PC)** : rejoint via le lien ou le code du salon, utilise le gros bouton **🚨 BUZZER**, envoie ses réponses écrites ou QCM et suit le classement en direct.
- **Thèmes visuels** : mode **Sombre** et thème **Savane** (sauvegardés dans `localStorage`).
- **Multi-sources** : iTunes Search, YouTube (avec timecode et masquage anti-spoiler) et liens audio directs (MP3, OGG, WAV, Dropbox).
- **Playlist personnalisable** : activation/désactivation par titre, recherche, ajout manuel et import/export JSON (`tracks.json`).

## Déploiement sur GitHub Pages
1. Remplace les fichiers `index.html`, `style.css`, `app.js`, `tracks.json` et `README.md` à la racine de ton dépôt GitHub.
2. Vérifie que **GitHub Pages** pointe sur la branche **`main`** (`/ (root)`).
