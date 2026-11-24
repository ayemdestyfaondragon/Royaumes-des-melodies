# Royaumes des Mélodies — Blind-Test Disney (avec Système de Rooms)

Application web statique de blind-test Disney prête pour GitHub Pages, avec **Mode Local** et **Système de Rooms à distance**.

## Fonctionnalités du système de rooms
- **Création & rejointure de room** : code salon unique, nom de room personnalisé et lien d'invitation (`?room=CODE`).
- **Rôles & statuts** : identification de l'**Hôte** (avec possibilité de passer hôte), badge **Prêt / En attente** et liste des joueurs connectés.
- **Chat de room & buzzer** : messages en direct dans la room, ordre des buzzers horodaté et synchronisation des scores.
- **Synchronisation** : fonctionne entre onglets/fenêtres via `BroadcastChannel` + `localStorage`, et peut se connecter à une URL **Firebase Realtime Database** pour la synchro inter-appareils.
