# Guide complet — Déployer et tester *Royaumes des Mélodies*

## 1. Préparer les fichiers du projet
1. Télécharge et extrais l'archive **`royaumes-des-melodies-multi-repare.zip`** dans un dossier dédié sur ton ordinateur (par exemple `royaumes-des-melodies/`).
2. Vérifie que ces 5 fichiers se trouvent bien à la racine du dossier :
   * `index.html`
   * `style.css`
   * `tracks.js`
   * `app.js`
   * `README.md`

---

## 2. Lancer le jeu en local (sans serveur complexe)
* **Option A — Via un petit serveur local (recommandé pour éviter les restrictions de fichiers)** :
  * Ouvre un terminal dans le dossier du projet et lance par exemple :
    `npx serve .` ou `python -m http.server 8080`
  * Ouvre ensuite l'URL affichée (ex. `http://localhost:8080`) dans ton navigateur.
* **Option B — Sur GitHub Pages** :
  * Pousse `index.html`, `style.css`, `tracks.js`, `app.js` et `README.md` sur ton dépôt GitHub Pages.
  * Une fois publié, recharge la page avec **`Ctrl + F5`** (ou **`Cmd + Shift + R`**) pour vider l'ancien cache du navigateur.

---

## 3. Tester le Mode Local (même écran)
1. Garde l'onglet **🏠 Local / Même écran** actif.
2. Ajoute ou ajuste les joueurs dans la barre des scores (`+ Ajouter joueur`), puis clique sur **🎲 Manche aléatoire** (ou **▶ Jouer** sur un morceau de la liste).
3. Vérifie :
   * La lecture de l'extrait audio ou le bouton de repli YouTube si un extrait est indisponible.
   * Les boutons de points (**+1 Titre**, **+1 Disney**, **+2 Les 2**, **-1**) et la validation d'une proposition dans l'onglet **🎯 Onglet Réponse**.
   * Le bouton **👁️ Révéler réponse** pour afficher la pochette, le titre et le film Disney.

---

## 4. Tester le Mode Multi à distance (Salon)
1. Clique sur l'onglet **🌐 Multi à distance (Salon)**.
2. Renseigne **Ton pseudo** et (optionnel) un **Nom de la room**, puis clique sur **✨ Créer une room**.
3. Copie le lien d'invitation (**📋 Lien d'invitation**) ou note le code à 6 caractères affiché (`ROOM : XXXXXX`), puis ouvre-le dans un second onglet, sur un autre appareil ou partage-le avec un ami.
4. Sur le second appareil/onglet :
   * Saisis le code de room et clique sur **🔗 Rejoindre** (ou ouvre directement l'URL avec `?room=CODE`).
   * Clique sur **✅ Prêt**, teste le **💬 Chat de room** et, dès qu'une manche est lancée, teste **🔔 BUZZER !** et **🔄 Synchroniser maintenant**.

---

## 5. Diagnostiquer rapidement si un bouton ne réagit pas
1. Appuie sur **`F12`** pour ouvrir les outils développeur, puis va dans l'onglet **Console**.
2. Clique sur le bouton qui pose problème et regarde si une ligne rouge (`Uncaught ...`) apparaît.
3. Si tu as besoin d'aide, copie-colle :
   * le message d'erreur exact de la console, et
   * le nom du bouton ou de l'action testée.


## Configuration obligatoire du multi à distance
Pour jouer entre appareils distincts, configure Firebase Realtime Database en suivant `CONFIGURATION-MULTI.md`. Sans cette étape, le mode distant ne fonctionne qu’entre onglets du même navigateur.
