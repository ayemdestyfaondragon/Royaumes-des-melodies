# Blind Test Musical Disney — Version v15 Tout-en-Un

- Fichier unique `index.html` regroupant les styles, la playlist Disney intégrée et le code complet.
- L'AudioContext n'est créé/repris qu'après un geste utilisateur (`pointerdown` / `keydown` / clic), évitant l'avertissement autoplay du navigateur.
- Utilise la playlist embarquée directement sans requête inutile vers `tracks.json` ni requêtes vers des fichiers `audio/*.mp3` absents.
