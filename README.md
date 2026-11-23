# Blind Test Musical Disney — Plateau TV Automatique (v5 Zéro Erreur Console)

- **Suppression du warning `AudioContext was not allowed to start`** : `AudioContext` n'est instancié/joué qu'après un vrai geste utilisateur (`audioUserGestureUnlocked`), évitant l'avertissement autoplay de Chrome au chargement ou à la réception d'un message réseau côté candidat.
- **Suppression du `404 /favicon.ico`** : ajout d'une icône SVG inline (`🎶`) dans `index.html`.
