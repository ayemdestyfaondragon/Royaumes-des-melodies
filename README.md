# Blind Test Musical Disney — Édition Plateau TV Automatique

Jeu télé musical Disney entièrement automatisé avec présentateur virtuel, habillage TV dynamique, jingles synthétisés en Web Audio API, révélation automatique avec pochette et multijoueur PeerJS.

## Nouveautés de l'édition Plateau TV Automatique
- **Enchaînement 100 % automatique** :
  1. **Annonce de manche ("Prêts ?")** avec compte à rebours `3... 2... 1...` et jingle TV.
  2. **Manche musicale en direct** avec barre de temps animée, égaliseur plateau, indices automatiques progressifs (à 18s et 9s restantes) et saisie / buzzer instantané.
  3. **Révélation TV automatique (6 secondes)** avec pochette d'album iTunes haute résolution ou miniature YouTube, musique prolongée et mise à jour du classement avant passage automatique à la manche suivante.
  4. **Cérémonie du Podium Final** avec fanfare, classement complet et relance automatique ou manuelle.
- **Habillage TV & Thèmes** : Bandeau **EN DIRECT**, mode **Sombre** et thème **Savane** sauvegardés dans `localStorage`.
- **Multijoueur en ligne PeerJS (WebRTC)** : Hôte + Joueurs à distance synchronisés sur chaque phase automatique du plateau.

## Déploiement sur GitHub Pages
Remplace `index.html`, `style.css`, `app.js`, `tracks.json` et `README.md` à la racine de ton dépôt GitHub.
