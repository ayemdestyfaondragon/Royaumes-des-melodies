# Royaumes des Mélodies — Blind-Test Disney

Blind-test Disney en français, jouable en local ou à distance.

## Règles de points
- **+1 point** si le titre de la chanson est trouvé.
- **+1 point** si le film ou la série Disney est trouvé.
- **+2 points maximum par joueur et par manche**.
- Un point déjà gagné ne peut pas être gagné une deuxième fois en renvoyant la même réponse.
- En salon distant, le joueur qui répond est identifié par son pseudo.

## Modes
- **Local** : plusieurs joueurs sur le même écran.
- **Multi à distance** : salon avec code, pseudo, chat, statut prêt, buzzer et synchronisation des manches/scores.
- **Mode Auto** : enchaînement des phases écoute, révélation et pause.

## Important : activer la synchronisation Internet
GitHub Pages héberge les fichiers du site, mais ne fournit pas de base de données. Pour que des personnes sur des appareils/réseaux différents partagent réellement un salon, il faut configurer Firebase Realtime Database. Le mode sans Firebase ne synchronise que les onglets du même navigateur ; le lien d'invitation seul ne suffit pas.

La procédure est dans `CONFIGURATION-MULTI.md`.
