# Blind Test Musical Disney — Plateau TV Automatique (v7 Connexion Salon Fiabilisée)

- **Serveurs STUN explicites** : ajoute des serveurs STUN publics (`stun.l.google.com`, `stun1.l.google.com`, `stun2.l.google.com`, `global.stun.twilio.com`) pour faciliter la traversée NAT entre ordinateur et téléphone.
- **Détection de délai & nouvelle tentative automatique** : affiche un message clair si le salon (`TV-XXXX`) n'est pas encore actif et retente automatiquement après 2,5 s en cas d'indisponibilité ponctuelle (`peer-unavailable` / `network`).
