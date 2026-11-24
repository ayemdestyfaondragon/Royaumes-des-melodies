# Royaumes des Mélodies — Blind-Test Disney

Application web statique de blind-test Disney conçue pour GitHub Pages.

## Structure du dépôt

- `index.html` : structure de l'interface (tableau des scores, lecteur mystère, catalogue)
- `style.css` : thème sombre et mise en page responsive
- `tracks.js` : catalogue des 151 morceaux Disney (titres FR/EN, films, années, fallback YouTube)
- `app.js` : moteur audio JSONP (Deezer + Apple Music), gestion des manches, floutage de pochette et sauvegarde locale des scores

## Déploiement sur GitHub Pages

1. Place les fichiers `index.html`, `style.css`, `tracks.js`, `app.js` et `README.md` à la racine de ton dépôt GitHub.
2. Va dans **Settings → Pages**.
3. Dans **Source**, sélectionne **Deploy from a branch**, choisis `main` et `/ (root)`, puis clique sur **Save**.
