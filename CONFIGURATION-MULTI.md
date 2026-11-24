# Configuration du multijoueur à distance

## Pourquoi cette étape est nécessaire
Le site est statique (GitHub Pages). Il ne possède pas de serveur de jeu intégré. La synchronisation entre appareils distants passe donc par Firebase Realtime Database. Cette configuration est à faire une fois par navigateur utilisé.

## 1. Créer la base Firebase
1. Ouvre https://console.firebase.google.com/ et crée un projet.
2. Dans **Créer > Realtime Database**, crée une base.
3. Choisis une région et démarre la base.
4. Dans l'onglet **Règles**, colle les règles ci-dessous pour un test privé entre amis :

```json
{
  "rules": {
    "royaumes_rooms": {
      "$roomCode": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

**Sécurité :** ces règles autorisent toute personne connaissant l'URL de la base à lire et modifier les salons. Ne stocke aucune donnée personnelle et ne publie pas de secrets. Pour un site public, il faut ajouter Firebase Authentication et des règles plus strictes.

## 2. Récupérer l'URL RTDB
Dans la page Realtime Database, copie l'URL de la base, par exemple :
`https://NOM-DU-PROJET-default-rtdb.europe-west1.firebasedatabase.app`

Ne copie pas l'URL de la console Firebase.

## 3. Enregistrer l'URL dans le jeu
1. Déploie les fichiers sur GitHub Pages.
2. Ouvre le site, passe dans **Multi à distance**.
3. Ouvre **⚙️ Relais**.
4. Colle l'URL Realtime Database dans le champ URL, puis clique sur **💾 OK**.
5. Chaque joueur doit faire cette opération sur son navigateur. L'adresse est conservée localement.

## 4. Jouer
1. L'hôte clique sur **Nouveau salon**.
2. Il partage le lien d'invitation ou le code à six caractères.
3. Les autres joueurs saisissent leur pseudo et rejoignent le code.
4. L'hôte lance les manches et le Mode Auto. Les autres appareils récupèrent les changements via Firebase.

## Limites actuelles
- Le Mode Auto est piloté depuis le navigateur qui le démarre : l'hôte doit lancer/arrêter le Mode Auto.
- Prototype entre amis, sans authentification ni protection anti-triche.
- Le mode sans Firebase ne fonctionne qu'entre onglets du même navigateur ; le code de salon ne crée pas à lui seul un serveur Internet.
