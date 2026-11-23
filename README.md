# Blind Test Musical Disney — Édition Plateau TV Automatique (v3 Audio Synchronisé)

Version corrigée pour résoudre les bugs audio et diffuser l'extrait musical sur **tous les appareils (Hôte et Candidats connectés)** :
- **Diffusion audio synchronisée à tous les joueurs** : la régie récupère l'URL audio (`previewUrl` iTunes ou `audioUrl` direct) et envoie l'ordre de lecture synchronisé (`MEDIA_SYNC`) aux candidats connectés, avec bouton de déblocage audio si le navigateur mobile/PC bloque l'autoplay.
- **Sécurité anti-boucle & gestion propre des erreurs** :
  - `currentTime` n'est appliqué qu'une fois l'événement `loadedmetadata` déclenché (fini les coupures/bugs sur iTunes).
  - Protection contre les doubles déclenchements (`roundTransitionLock`).
  - Bouton **🔊 Activer / Débloquer le son** visible sur chaque écran pour contourner le blocage autoplay des navigateurs.
