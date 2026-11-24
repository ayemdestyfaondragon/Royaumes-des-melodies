const DISNEY_TRACKS = [
  {
    "id": 1,
    "film": "Blanche-Neige et les Sept Nains",
    "annee": 1937,
    "titre_fr": "Un jour mon prince viendra",
    "titre_en": "Someday My Prince Will Come",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Un+jour+mon+prince+viendra+Blanche-Neige+et+les+Sept+Nains+Disney+bande+originale"
  },
  {
    "id": 2,
    "film": "Blanche-Neige et les Sept Nains",
    "annee": 1937,
    "titre_fr": "Heigh-Ho",
    "titre_en": "Heigh-Ho",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Heigh-Ho+Blanche-Neige+et+les+Sept+Nains+Disney+bande+originale"
  },
  {
    "id": 3,
    "film": "Blanche-Neige et les Sept Nains",
    "annee": 1937,
    "titre_fr": "Siffler en travaillant",
    "titre_en": "Whistle While You Work",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Siffler+en+travaillant+Blanche-Neige+et+les+Sept+Nains+Disney+bande+originale"
  },
  {
    "id": 4,
    "film": "Blanche-Neige et les Sept Nains",
    "annee": 1937,
    "titre_fr": "Je souhaite",
    "titre_en": "I'm Wishing",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Je+souhaite+Blanche-Neige+et+les+Sept+Nains+Disney+bande+originale"
  },
  {
    "id": 5,
    "film": "Pinocchio",
    "annee": 1940,
    "titre_fr": "Quand on prie la bonne étoile",
    "titre_en": "When You Wish Upon a Star",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Quand+on+prie+la+bonne+%C3%A9toile+Pinocchio+Disney+bande+originale"
  },
  {
    "id": 6,
    "film": "Pinocchio",
    "annee": 1940,
    "titre_fr": "Sans aucun lien me retenant",
    "titre_en": "I've Got No Strings",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Sans+aucun+lien+me+retenant+Pinocchio+Disney+bande+originale"
  },
  {
    "id": 7,
    "film": "Fantasia",
    "annee": 1940,
    "titre_fr": "L'Apprenti sorcier",
    "titre_en": "The Sorcerer's Apprentice",
    "type": "Instrumental",
    "yt_fallback": "https://www.youtube.com/results?search_query=L%27Apprenti+sorcier+Fantasia+Disney+bande+originale"
  },
  {
    "id": 8,
    "film": "Dumbo",
    "annee": 1941,
    "titre_fr": "Mon tout petit",
    "titre_en": "Baby Mine",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Mon+tout+petit+Dumbo+Disney+bande+originale"
  },
  {
    "id": 9,
    "film": "Dumbo",
    "annee": 1941,
    "titre_fr": "Les Éléphants roses",
    "titre_en": "Pink Elephants on Parade",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Les+%C3%89l%C3%A9phants+roses+Dumbo+Disney+bande+originale"
  },
  {
    "id": 10,
    "film": "Bambi",
    "annee": 1942,
    "titre_fr": "La Chanson de la pluie",
    "titre_en": "Little April Shower",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=La+Chanson+de+la+pluie+Bambi+Disney+bande+originale"
  },
  {
    "id": 11,
    "film": "Cendrillon",
    "annee": 1950,
    "titre_fr": "Bibbidi-Bobbidi-Boo",
    "titre_en": "Bibbidi-Bobbidi-Boo",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Bibbidi-Bobbidi-Boo+Cendrillon+Disney+bande+originale"
  },
  {
    "id": 12,
    "film": "Cendrillon",
    "annee": 1950,
    "titre_fr": "Tendre rêve",
    "titre_en": "A Dream Is a Wish Your Heart Makes",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Tendre+r%C3%AAve+Cendrillon+Disney+bande+originale"
  },
  {
    "id": 13,
    "film": "Cendrillon",
    "annee": 1950,
    "titre_fr": "C'est ça l'amour",
    "titre_en": "So This Is Love",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=C%27est+%C3%A7a+l%27amour+Cendrillon+Disney+bande+originale"
  },
  {
    "id": 14,
    "film": "Alice au pays des merveilles",
    "annee": 1951,
    "titre_fr": "Joyeux non-anniversaire",
    "titre_en": "The Unbirthday Song",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Joyeux+non-anniversaire+Alice+au+pays+des+merveilles+Disney+bande+originale"
  },
  {
    "id": 15,
    "film": "Alice au pays des merveilles",
    "annee": 1951,
    "titre_fr": "Dans le monde de mes rêves",
    "titre_en": "In a World of My Own",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Dans+le+monde+de+mes+r%C3%AAves+Alice+au+pays+des+merveilles+Disney+bande+originale"
  },
  {
    "id": 16,
    "film": "Peter Pan",
    "annee": 1953,
    "titre_fr": "Tu t'envoles",
    "titre_en": "You Can Fly!",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Tu+t%27envoles+Peter+Pan+Disney+bande+originale"
  },
  {
    "id": 17,
    "film": "Peter Pan",
    "annee": 1953,
    "titre_fr": "La Deuxième Étoile à droite",
    "titre_en": "The Second Star to the Right",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=La+Deuxi%C3%A8me+%C3%89toile+%C3%A0+droite+Peter+Pan+Disney+bande+originale"
  },
  {
    "id": 18,
    "film": "La Belle et le Clochard",
    "annee": 1955,
    "titre_fr": "Bella Notte",
    "titre_en": "Bella Notte",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Bella+Notte+La+Belle+et+le+Clochard+Disney+bande+originale"
  },
  {
    "id": 19,
    "film": "La Belle et le Clochard",
    "annee": 1955,
    "titre_fr": "Nous sommes deux siamois",
    "titre_en": "The Siamese Cat Song",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Nous+sommes+deux+siamois+La+Belle+et+le+Clochard+Disney+bande+originale"
  },
  {
    "id": 20,
    "film": "La Belle au bois dormant",
    "annee": 1959,
    "titre_fr": "J'en ai rêvé",
    "titre_en": "Once Upon a Dream",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=J%27en+ai+r%C3%AAv%C3%A9+La+Belle+au+bois+dormant+Disney+bande+originale"
  },
  {
    "id": 21,
    "film": "Les 101 Dalmatiens",
    "annee": 1961,
    "titre_fr": "Cruella De Vil",
    "titre_en": "Cruella De Vil",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Cruella+De+Vil+Les+101+Dalmatiens+Disney+bande+originale"
  },
  {
    "id": 22,
    "film": "Merlin l'Enchanteur",
    "annee": 1963,
    "titre_fr": "Higitus Figitus",
    "titre_en": "Higitus Figitus",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Higitus+Figitus+Merlin+l%27Enchanteur+Disney+bande+originale"
  },
  {
    "id": 23,
    "film": "Merlin l'Enchanteur",
    "annee": 1963,
    "titre_fr": "C'est ça qui fait tourner le monde",
    "titre_en": "That's What Makes the World Go Round",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=C%27est+%C3%A7a+qui+fait+tourner+le+monde+Merlin+l%27Enchanteur+Disney+bande+originale"
  },
  {
    "id": 24,
    "film": "Mary Poppins",
    "annee": 1964,
    "titre_fr": "Supercalifragilisticexpialidocious",
    "titre_en": "Supercalifragilisticexpialidocious",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Supercalifragilisticexpialidocious+Mary+Poppins+Disney+bande+originale"
  },
  {
    "id": 25,
    "film": "Mary Poppins",
    "annee": 1964,
    "titre_fr": "Cheminée",
    "titre_en": "Chim Chim Cher-ee",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Chemin%C3%A9e+Mary+Poppins+Disney+bande+originale"
  },
  {
    "id": 26,
    "film": "Mary Poppins",
    "annee": 1964,
    "titre_fr": "Un morceau de sucre",
    "titre_en": "A Spoonful of Sugar",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Un+morceau+de+sucre+Mary+Poppins+Disney+bande+originale"
  },
  {
    "id": 27,
    "film": "Le Livre de la jungle",
    "annee": 1967,
    "titre_fr": "Il en faut peu pour être heureux",
    "titre_en": "The Bare Necessities",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Il+en+faut+peu+pour+%C3%AAtre+heureux+Le+Livre+de+la+jungle+Disney+bande+originale"
  },
  {
    "id": 28,
    "film": "Le Livre de la jungle",
    "annee": 1967,
    "titre_fr": "Être un homme comme vous",
    "titre_en": "I Wan'na Be Like You",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=%C3%8Atre+un+homme+comme+vous+Le+Livre+de+la+jungle+Disney+bande+originale"
  },
  {
    "id": 29,
    "film": "Le Livre de la jungle",
    "annee": 1967,
    "titre_fr": "Aie confiance",
    "titre_en": "Trust in Me",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Aie+confiance+Le+Livre+de+la+jungle+Disney+bande+originale"
  },
  {
    "id": 30,
    "film": "Les Aristochats",
    "annee": 1970,
    "titre_fr": "Tout le monde veut devenir un cat",
    "titre_en": "Ev'rybody Wants to Be a Cat",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Tout+le+monde+veut+devenir+un+cat+Les+Aristochats+Disney+bande+originale"
  },
  {
    "id": 31,
    "film": "Les Aristochats",
    "annee": 1970,
    "titre_fr": "Les Aristochats",
    "titre_en": "The Aristocats",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Les+Aristochats+Les+Aristochats+Disney+bande+originale"
  },
  {
    "id": 32,
    "film": "Robin des Bois",
    "annee": 1973,
    "titre_fr": "Quel beau jour vraiment",
    "titre_en": "Oo-De-Lally",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Quel+beau+jour+vraiment+Robin+des+Bois+Disney+bande+originale"
  },
  {
    "id": 33,
    "film": "Robin des Bois",
    "annee": 1973,
    "titre_fr": "Un ami fidèle",
    "titre_en": "Not in Nottingham",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Un+ami+fid%C3%A8le+Robin+des+Bois+Disney+bande+originale"
  },
  {
    "id": 34,
    "film": "Les Aventures de Bernard et Bianca",
    "annee": 1977,
    "titre_fr": "Quelqu'un viendra",
    "titre_en": "Someone's Waiting for You",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Quelqu%27un+viendra+Les+Aventures+de+Bernard+et+Bianca+Disney+bande+originale"
  },
  {
    "id": 35,
    "film": "Rox et Rouky",
    "annee": 1981,
    "titre_fr": "Amis pour la vie",
    "titre_en": "Best of Friends",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Amis+pour+la+vie+Rox+et+Rouky+Disney+bande+originale"
  },
  {
    "id": 36,
    "film": "La Bande à Picsou (Série)",
    "annee": 1987,
    "titre_fr": "La Bande à Picsou (Générique)",
    "titre_en": "DuckTales Theme",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=La+Bande+%C3%A0+Picsou+%28G%C3%A9n%C3%A9rique%29+La+Bande+%C3%A0+Picsou+%28S%C3%A9rie%29+Disney+bande+originale"
  },
  {
    "id": 37,
    "film": "Oliver et Compagnie",
    "annee": 1988,
    "titre_fr": "Mais pourquoi m'en faire",
    "titre_en": "Why Should I Worry",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Mais+pourquoi+m%27en+faire+Oliver+et+Compagnie+Disney+bande+originale"
  },
  {
    "id": 38,
    "film": "La Petite Sirène",
    "annee": 1989,
    "titre_fr": "Partir là-bas",
    "titre_en": "Part of Your World",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Partir+l%C3%A0-bas+La+Petite+Sir%C3%A8ne+Disney+bande+originale"
  },
  {
    "id": 39,
    "film": "La Petite Sirène",
    "annee": 1989,
    "titre_fr": "Sous l'océan",
    "titre_en": "Under the Sea",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Sous+l%27oc%C3%A9an+La+Petite+Sir%C3%A8ne+Disney+bande+originale"
  },
  {
    "id": 40,
    "film": "La Petite Sirène",
    "annee": 1989,
    "titre_fr": "Embrasse-la",
    "titre_en": "Kiss the Girl",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Embrasse-la+La+Petite+Sir%C3%A8ne+Disney+bande+originale"
  },
  {
    "id": 41,
    "film": "La Petite Sirène",
    "annee": 1989,
    "titre_fr": "Pauvres âmes en perdition",
    "titre_en": "Poor Unfortunate Souls",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Pauvres+%C3%A2mes+en+perdition+La+Petite+Sir%C3%A8ne+Disney+bande+originale"
  },
  {
    "id": 42,
    "film": "La Belle et la Bête",
    "annee": 1991,
    "titre_fr": "Histoire éternelle",
    "titre_en": "Beauty and the Beast",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Histoire+%C3%A9ternelle+La+Belle+et+la+B%C3%AAte+Disney+bande+originale"
  },
  {
    "id": 43,
    "film": "La Belle et la Bête",
    "annee": 1991,
    "titre_fr": "C'est la fête",
    "titre_en": "Be Our Guest",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=C%27est+la+f%C3%AAte+La+Belle+et+la+B%C3%AAte+Disney+bande+originale"
  },
  {
    "id": 44,
    "film": "La Belle et la Bête",
    "annee": 1991,
    "titre_fr": "Belle",
    "titre_en": "Belle",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Belle+La+Belle+et+la+B%C3%AAte+Disney+bande+originale"
  },
  {
    "id": 45,
    "film": "La Belle et la Bête",
    "annee": 1991,
    "titre_fr": "Gaston",
    "titre_en": "Gaston",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Gaston+La+Belle+et+la+B%C3%AAte+Disney+bande+originale"
  },
  {
    "id": 46,
    "film": "Aladdin",
    "annee": 1992,
    "titre_fr": "Ce rêve bleu",
    "titre_en": "A Whole New World",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Ce+r%C3%AAve+bleu+Aladdin+Disney+bande+originale"
  },
  {
    "id": 47,
    "film": "Aladdin",
    "annee": 1992,
    "titre_fr": "Je suis ton meilleur ami",
    "titre_en": "Friend Like Me",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Je+suis+ton+meilleur+ami+Aladdin+Disney+bande+originale"
  },
  {
    "id": 48,
    "film": "Aladdin",
    "annee": 1992,
    "titre_fr": "Prince Ali",
    "titre_en": "Prince Ali",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Prince+Ali+Aladdin+Disney+bande+originale"
  },
  {
    "id": 49,
    "film": "Aladdin",
    "annee": 1992,
    "titre_fr": "Nuits d'Arabie",
    "titre_en": "Arabian Nights",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Nuits+d%27Arabie+Aladdin+Disney+bande+originale"
  },
  {
    "id": 50,
    "film": "Aladdin",
    "annee": 1992,
    "titre_fr": "Je vole",
    "titre_en": "One Jump Ahead",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Je+vole+Aladdin+Disney+bande+originale"
  },
  {
    "id": 51,
    "film": "L'Étrange Noël de monsieur Jack",
    "annee": 1993,
    "titre_fr": "Bienvenue à Halloween",
    "titre_en": "This Is Halloween",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Bienvenue+%C3%A0+Halloween+L%27%C3%89trange+No%C3%ABl+de+monsieur+Jack+Disney+bande+originale"
  },
  {
    "id": 52,
    "film": "L'Étrange Noël de monsieur Jack",
    "annee": 1993,
    "titre_fr": "Que vois-je ?",
    "titre_en": "What's This?",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Que+vois-je+%3F+L%27%C3%89trange+No%C3%ABl+de+monsieur+Jack+Disney+bande+originale"
  },
  {
    "id": 53,
    "film": "Le Roi Lion",
    "annee": 1994,
    "titre_fr": "L'Histoire de la vie",
    "titre_en": "Circle of Life",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=L%27Histoire+de+la+vie+Le+Roi+Lion+Disney+bande+originale"
  },
  {
    "id": 54,
    "film": "Le Roi Lion",
    "annee": 1994,
    "titre_fr": "Je voudrais déjà être roi",
    "titre_en": "I Just Can't Wait to Be King",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Je+voudrais+d%C3%A9j%C3%A0+%C3%AAtre+roi+Le+Roi+Lion+Disney+bande+originale"
  },
  {
    "id": 55,
    "film": "Le Roi Lion",
    "annee": 1994,
    "titre_fr": "Soyez prêts",
    "titre_en": "Be Prepared",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Soyez+pr%C3%AAts+Le+Roi+Lion+Disney+bande+originale"
  },
  {
    "id": 56,
    "film": "Le Roi Lion",
    "annee": 1994,
    "titre_fr": "Hakuna Matata",
    "titre_en": "Hakuna Matata",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Hakuna+Matata+Le+Roi+Lion+Disney+bande+originale"
  },
  {
    "id": 57,
    "film": "Le Roi Lion",
    "annee": 1994,
    "titre_fr": "L'Amour brille sous les étoiles",
    "titre_en": "Can You Feel the Love Tonight",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=L%27Amour+brille+sous+les+%C3%A9toiles+Le+Roi+Lion+Disney+bande+originale"
  },
  {
    "id": 58,
    "film": "Pocahontas",
    "annee": 1995,
    "titre_fr": "L'Air du vent",
    "titre_en": "Colors of the Wind",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=L%27Air+du+vent+Pocahontas+Disney+bande+originale"
  },
  {
    "id": 59,
    "film": "Pocahontas",
    "annee": 1995,
    "titre_fr": "Au détour de la rivière",
    "titre_en": "Just Around the Riverbend",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Au+d%C3%A9tour+de+la+rivi%C3%A8re+Pocahontas+Disney+bande+originale"
  },
  {
    "id": 60,
    "film": "Pocahontas",
    "annee": 1995,
    "titre_fr": "Sauvages",
    "titre_en": "Savages",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Sauvages+Pocahontas+Disney+bande+originale"
  },
  {
    "id": 61,
    "film": "Dingo et Max",
    "annee": 1995,
    "titre_fr": "I2I (Eye to Eye)",
    "titre_en": "I2I",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=I2I+%28Eye+to+Eye%29+Dingo+et+Max+Disney+bande+originale"
  },
  {
    "id": 62,
    "film": "Dingo et Max",
    "annee": 1995,
    "titre_fr": "Stand Out",
    "titre_en": "Stand Out",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Stand+Out+Dingo+et+Max+Disney+bande+originale"
  },
  {
    "id": 63,
    "film": "Toy Story",
    "annee": 1995,
    "titre_fr": "Je suis ton ami",
    "titre_en": "You've Got a Friend in Me",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Je+suis+ton+ami+Toy+Story+Disney+bande+originale"
  },
  {
    "id": 64,
    "film": "Le Bossu de Notre-Dame",
    "annee": 1996,
    "titre_fr": "Infernal",
    "titre_en": "Hellfire",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Infernal+Le+Bossu+de+Notre-Dame+Disney+bande+originale"
  },
  {
    "id": 65,
    "film": "Le Bossu de Notre-Dame",
    "annee": 1996,
    "titre_fr": "Les Cloches de Notre-Dame",
    "titre_en": "The Bells of Notre Dame",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Les+Cloches+de+Notre-Dame+Le+Bossu+de+Notre-Dame+Disney+bande+originale"
  },
  {
    "id": 66,
    "film": "Le Bossu de Notre-Dame",
    "annee": 1996,
    "titre_fr": "Rien qu'un jour",
    "titre_en": "Out There",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Rien+qu%27un+jour+Le+Bossu+de+Notre-Dame+Disney+bande+originale"
  },
  {
    "id": 67,
    "film": "Hercule",
    "annee": 1997,
    "titre_fr": "De zéro en héros",
    "titre_en": "Zero to Hero",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=De+z%C3%A9ro+en+h%C3%A9ros+Hercule+Disney+bande+originale"
  },
  {
    "id": 68,
    "film": "Hercule",
    "annee": 1997,
    "titre_fr": "Je veux savoir",
    "titre_en": "Go the Distance",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Je+veux+savoir+Hercule+Disney+bande+originale"
  },
  {
    "id": 69,
    "film": "Hercule",
    "annee": 1997,
    "titre_fr": "Ne parle pas d'eux",
    "titre_en": "I Won't Say (I'm in Love)",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Ne+parle+pas+d%27eux+Hercule+Disney+bande+originale"
  },
  {
    "id": 70,
    "film": "Hercule",
    "annee": 1997,
    "titre_fr": "Le Monde qui est le mien",
    "titre_en": "I Can Go the Distance (Reprise)",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Le+Monde+qui+est+le+mien+Hercule+Disney+bande+originale"
  },
  {
    "id": 71,
    "film": "Anastasia",
    "annee": 1997,
    "titre_fr": "Loin du froid de décembre",
    "titre_en": "Once Upon a December",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Loin+du+froid+de+d%C3%A9cembre+Anastasia+Disney+bande+originale"
  },
  {
    "id": 72,
    "film": "Anastasia",
    "annee": 1997,
    "titre_fr": "Voyage dans le temps",
    "titre_en": "Journey to the Past",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Voyage+dans+le+temps+Anastasia+Disney+bande+originale"
  },
  {
    "id": 73,
    "film": "Mulan",
    "annee": 1998,
    "titre_fr": "Réflexion",
    "titre_en": "Reflection",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=R%C3%A9flexion+Mulan+Disney+bande+originale"
  },
  {
    "id": 74,
    "film": "Mulan",
    "annee": 1998,
    "titre_fr": "Comme un homme",
    "titre_en": "I'll Make a Man Out of You",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Comme+un+homme+Mulan+Disney+bande+originale"
  },
  {
    "id": 75,
    "film": "Mulan",
    "annee": 1998,
    "titre_fr": "Honneur à tous",
    "titre_en": "Honor to Us All",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Honneur+%C3%A0+tous+Mulan+Disney+bande+originale"
  },
  {
    "id": 76,
    "film": "Le Roi Lion 2 : L'Honneur de la tribu",
    "annee": 1998,
    "titre_fr": "Il vit en toi",
    "titre_en": "He Lives in You",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Il+vit+en+toi+Le+Roi+Lion+2+%3A+L%27Honneur+de+la+tribu+Disney+bande+originale"
  },
  {
    "id": 77,
    "film": "Le Roi Lion 2 : L'Honneur de la tribu",
    "annee": 1998,
    "titre_fr": "Mon chant d'espoir",
    "titre_en": "My Lullaby",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Mon+chant+d%27espoir+Le+Roi+Lion+2+%3A+L%27Honneur+de+la+tribu+Disney+bande+originale"
  },
  {
    "id": 78,
    "film": "Le Roi Lion 2 : L'Honneur de la tribu",
    "annee": 1998,
    "titre_fr": "L'Amour nous guidera",
    "titre_en": "Love Will Find a Way",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=L%27Amour+nous+guidera+Le+Roi+Lion+2+%3A+L%27Honneur+de+la+tribu+Disney+bande+originale"
  },
  {
    "id": 79,
    "film": "Le Roi Lion 2 : L'Honneur de la tribu",
    "annee": 1998,
    "titre_fr": "Nous sommes un",
    "titre_en": "We Are One",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Nous+sommes+un+Le+Roi+Lion+2+%3A+L%27Honneur+de+la+tribu+Disney+bande+originale"
  },
  {
    "id": 80,
    "film": "Le Roi Lion 2 : L'Honneur de la tribu",
    "annee": 1998,
    "titre_fr": "Trahison",
    "titre_en": "Not One of Us",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Trahison+Le+Roi+Lion+2+%3A+L%27Honneur+de+la+tribu+Disney+bande+originale"
  },
  {
    "id": 81,
    "film": "Tarzan",
    "annee": 1999,
    "titre_fr": "Toujours dans mon cœur",
    "titre_en": "You'll Be in My Heart",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Toujours+dans+mon+c%C5%93ur+Tarzan+Disney+bande+originale"
  },
  {
    "id": 82,
    "film": "Tarzan",
    "annee": 1999,
    "titre_fr": "Deux mondes",
    "titre_en": "Two Worlds",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Deux+mondes+Tarzan+Disney+bande+originale"
  },
  {
    "id": 83,
    "film": "Tarzan",
    "annee": 1999,
    "titre_fr": "Enfants de l'homme",
    "titre_en": "Son of Man",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Enfants+de+l%27homme+Tarzan+Disney+bande+originale"
  },
  {
    "id": 84,
    "film": "Toy Story 2",
    "annee": 1999,
    "titre_fr": "Quand elle m'aimait bien",
    "titre_en": "When She Loved Me",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Quand+elle+m%27aimait+bien+Toy+Story+2+Disney+bande+originale"
  },
  {
    "id": 85,
    "film": "Kuzco, l'empereur mégalo",
    "annee": 2000,
    "titre_fr": "Parfait monde",
    "titre_en": "Perfect World",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Parfait+monde+Kuzco%2C+l%27empereur+m%C3%A9galo+Disney+bande+originale"
  },
  {
    "id": 86,
    "film": "Atlantide, l'empire perdu",
    "annee": 2001,
    "titre_fr": "Où est ton cœur",
    "titre_en": "Where the Dream Takes You",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=O%C3%B9+est+ton+c%C5%93ur+Atlantide%2C+l%27empire+perdu+Disney+bande+originale"
  },
  {
    "id": 87,
    "film": "Monstres & Cie",
    "annee": 2001,
    "titre_fr": "Si je n'ai pas toi",
    "titre_en": "If I Didn't Have You",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Si+je+n%27ai+pas+toi+Monstres+%26+Cie+Disney+bande+originale"
  },
  {
    "id": 88,
    "film": "Lilo & Stitch",
    "annee": 2002,
    "titre_fr": "Hawaiian Roller Coaster Ride",
    "titre_en": "Hawaiian Roller Coaster Ride",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Hawaiian+Roller+Coaster+Ride+Lilo+%26+Stitch+Disney+bande+originale"
  },
  {
    "id": 89,
    "film": "Lilo & Stitch",
    "annee": 2002,
    "titre_fr": "He Mele No Lilo",
    "titre_en": "He Mele No Lilo",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=He+Mele+No+Lilo+Lilo+%26+Stitch+Disney+bande+originale"
  },
  {
    "id": 90,
    "film": "La Planète au trésor",
    "annee": 2002,
    "titre_fr": "Un homme libre",
    "titre_en": "I'm Still Here",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Un+homme+libre+La+Plan%C3%A8te+au+tr%C3%A9sor+Disney+bande+originale"
  },
  {
    "id": 91,
    "film": "Frère des ours",
    "annee": 2003,
    "titre_fr": "Bienvenue",
    "titre_en": "Welcome",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Bienvenue+Fr%C3%A8re+des+ours+Disney+bande+originale"
  },
  {
    "id": 92,
    "film": "Frère des ours",
    "annee": 2003,
    "titre_fr": "Un autre monde",
    "titre_en": "On My Way",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Un+autre+monde+Fr%C3%A8re+des+ours+Disney+bande+originale"
  },
  {
    "id": 93,
    "film": "Frère des ours",
    "annee": 2003,
    "titre_fr": "Je m'en vais",
    "titre_en": "No Way Out",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Je+m%27en+vais+Fr%C3%A8re+des+ours+Disney+bande+originale"
  },
  {
    "id": 94,
    "film": "Le Roi Lion 3 : Hakuna Matata",
    "annee": 2004,
    "titre_fr": "Creuse un tunnel",
    "titre_en": "Digga Tunnah",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Creuse+un+tunnel+Le+Roi+Lion+3+%3A+Hakuna+Matata+Disney+bande+originale"
  },
  {
    "id": 95,
    "film": "Cars",
    "annee": 2006,
    "titre_fr": "Life Is a Highway",
    "titre_en": "Life Is a Highway",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Life+Is+a+Highway+Cars+Disney+bande+originale"
  },
  {
    "id": 96,
    "film": "High School Musical",
    "annee": 2006,
    "titre_fr": "Breaking Free",
    "titre_en": "Breaking Free",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Breaking+Free+High+School+Musical+Disney+bande+originale"
  },
  {
    "id": 97,
    "film": "High School Musical",
    "annee": 2006,
    "titre_fr": "We're All in This Together",
    "titre_en": "We're All in This Together",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=We%27re+All+in+This+Together+High+School+Musical+Disney+bande+originale"
  },
  {
    "id": 98,
    "film": "High School Musical 2",
    "annee": 2007,
    "titre_fr": "Bet On It",
    "titre_en": "Bet On It",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Bet+On+It+High+School+Musical+2+Disney+bande+originale"
  },
  {
    "id": 99,
    "film": "Il était une fois",
    "annee": 2007,
    "titre_fr": "Comment savoir",
    "titre_en": "That's How You Know",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Comment+savoir+Il+%C3%A9tait+une+fois+Disney+bande+originale"
  },
  {
    "id": 100,
    "film": "Phinéas et Ferb (Série)",
    "annee": 2007,
    "titre_fr": "Générique Phinéas et Ferb",
    "titre_en": "Today Is Gonna Be a Great Day",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=G%C3%A9n%C3%A9rique+Phin%C3%A9as+et+Ferb+Phin%C3%A9as+et+Ferb+%28S%C3%A9rie%29+Disney+bande+originale"
  },
  {
    "id": 101,
    "film": "Ratatouille",
    "annee": 2007,
    "titre_fr": "Le Festin",
    "titre_en": "Le Festin",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Le+Festin+Ratatouille+Disney+bande+originale"
  },
  {
    "id": 102,
    "film": "Camp Rock",
    "annee": 2008,
    "titre_fr": "This Is Me",
    "titre_en": "This Is Me",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=This+Is+Me+Camp+Rock+Disney+bande+originale"
  },
  {
    "id": 103,
    "film": "La Princesse et la Grenouille",
    "annee": 2009,
    "titre_fr": "Au bout de mes rêves",
    "titre_en": "Almost There",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Au+bout+de+mes+r%C3%AAves+La+Princesse+et+la+Grenouille+Disney+bande+originale"
  },
  {
    "id": 104,
    "film": "La Princesse et la Grenouille",
    "annee": 2009,
    "titre_fr": "De l'autre côté",
    "titre_en": "Friends on the Other Side",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=De+l%27autre+c%C3%B4t%C3%A9+La+Princesse+et+la+Grenouille+Disney+bande+originale"
  },
  {
    "id": 105,
    "film": "La Princesse et la Grenouille",
    "annee": 2009,
    "titre_fr": "En famille",
    "titre_en": "Dig a Little Deeper",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=En+famille+La+Princesse+et+la+Grenouille+Disney+bande+originale"
  },
  {
    "id": 106,
    "film": "Raiponce",
    "annee": 2010,
    "titre_fr": "Je veux y croire",
    "titre_en": "I See the Light",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Je+veux+y+croire+Raiponce+Disney+bande+originale"
  },
  {
    "id": 107,
    "film": "Raiponce",
    "annee": 2010,
    "titre_fr": "Où est la vraie vie ?",
    "titre_en": "When Will My Life Begin?",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=O%C3%B9+est+la+vraie+vie+%3F+Raiponce+Disney+bande+originale"
  },
  {
    "id": 108,
    "film": "Raiponce",
    "annee": 2010,
    "titre_fr": "J'ai un rêve",
    "titre_en": "I've Got a Dream",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=J%27ai+un+r%C3%AAve+Raiponce+Disney+bande+originale"
  },
  {
    "id": 109,
    "film": "Raiponce",
    "annee": 2010,
    "titre_fr": "N'écoute que moi",
    "titre_en": "Mother Knows Best",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=N%27%C3%A9coute+que+moi+Raiponce+Disney+bande+originale"
  },
  {
    "id": 110,
    "film": "Les Mondes de Ralph",
    "annee": 2012,
    "titre_fr": "When Can I See You Again?",
    "titre_en": "When Can I See You Again?",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=When+Can+I+See+You+Again%3F+Les+Mondes+de+Ralph+Disney+bande+originale"
  },
  {
    "id": 111,
    "film": "Rebelle",
    "annee": 2012,
    "titre_fr": "Vers le ciel",
    "titre_en": "Touch the Sky",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Vers+le+ciel+Rebelle+Disney+bande+originale"
  },
  {
    "id": 112,
    "film": "La Reine des neiges",
    "annee": 2013,
    "titre_fr": "Libérée, délivrée",
    "titre_en": "Let It Go",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Lib%C3%A9r%C3%A9e%2C+d%C3%A9livr%C3%A9e+La+Reine+des+neiges+Disney+bande+originale"
  },
  {
    "id": 113,
    "film": "La Reine des neiges",
    "annee": 2013,
    "titre_fr": "Je voudrais un bonhomme de neige",
    "titre_en": "Do You Want to Build a Snowman?",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Je+voudrais+un+bonhomme+de+neige+La+Reine+des+neiges+Disney+bande+originale"
  },
  {
    "id": 114,
    "film": "La Reine des neiges",
    "annee": 2013,
    "titre_fr": "Le Renouveau",
    "titre_en": "For the First Time in Forever",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Le+Renouveau+La+Reine+des+neiges+Disney+bande+originale"
  },
  {
    "id": 115,
    "film": "La Reine des neiges",
    "annee": 2013,
    "titre_fr": "L'Amour est un cadeau",
    "titre_en": "Love Is an Open Door",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=L%27Amour+est+un+cadeau+La+Reine+des+neiges+Disney+bande+originale"
  },
  {
    "id": 116,
    "film": "La Reine des neiges",
    "annee": 2013,
    "titre_fr": "En été",
    "titre_en": "In Summer",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=En+%C3%A9t%C3%A9+La+Reine+des+neiges+Disney+bande+originale"
  },
  {
    "id": 117,
    "film": "Les Nouveaux Héros",
    "annee": 2014,
    "titre_fr": "Immortals",
    "titre_en": "Immortals",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Immortals+Les+Nouveaux+H%C3%A9ros+Disney+bande+originale"
  },
  {
    "id": 118,
    "film": "Descendants",
    "annee": 2015,
    "titre_fr": "Rotten to the Core",
    "titre_en": "Rotten to the Core",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Rotten+to+the+Core+Descendants+Disney+bande+originale"
  },
  {
    "id": 119,
    "film": "Miraculous (Disney Channel)",
    "annee": 2015,
    "titre_fr": "Une vie de Ladybug",
    "titre_en": "It's Ladybug",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Une+vie+de+Ladybug+Miraculous+%28Disney+Channel%29+Disney+bande+originale"
  },
  {
    "id": 120,
    "film": "La Garde du Roi Lion",
    "annee": 2016,
    "titre_fr": "C'est l'heure",
    "titre_en": "Here Comes the Lion Guard",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=C%27est+l%27heure+La+Garde+du+Roi+Lion+Disney+bande+originale"
  },
  {
    "id": 121,
    "film": "La Garde du Roi Lion",
    "annee": 2016,
    "titre_fr": "Zuka Zama",
    "titre_en": "Zuka Zama",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Zuka+Zama+La+Garde+du+Roi+Lion+Disney+bande+originale"
  },
  {
    "id": 122,
    "film": "La Garde du Roi Lion",
    "annee": 2016,
    "titre_fr": "Ce soir on attaque",
    "titre_en": "Tonight We Strike",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Ce+soir+on+attaque+La+Garde+du+Roi+Lion+Disney+bande+originale"
  },
  {
    "id": 123,
    "film": "La Garde du Roi Lion",
    "annee": 2016,
    "titre_fr": "Le chant de la savane",
    "titre_en": "Call of the Guard",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Le+chant+de+la+savane+La+Garde+du+Roi+Lion+Disney+bande+originale"
  },
  {
    "id": 124,
    "film": "La Garde du Roi Lion",
    "annee": 2017,
    "titre_fr": "Il est de retour",
    "titre_en": "Bring Back a Legend",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Il+est+de+retour+La+Garde+du+Roi+Lion+Disney+bande+originale"
  },
  {
    "id": 125,
    "film": "Zootopie",
    "annee": 2016,
    "titre_fr": "Try Everything",
    "titre_en": "Try Everything",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Try+Everything+Zootopie+Disney+bande+originale"
  },
  {
    "id": 126,
    "film": "Vaiana",
    "annee": 2016,
    "titre_fr": "Le Bleu lumière",
    "titre_en": "How Far I'll Go",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Le+Bleu+lumi%C3%A8re+Vaiana+Disney+bande+originale"
  },
  {
    "id": 127,
    "film": "Vaiana",
    "annee": 2016,
    "titre_fr": "Pour les hommes que je suis",
    "titre_en": "You're Welcome",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Pour+les+hommes+que+je+suis+Vaiana+Disney+bande+originale"
  },
  {
    "id": 128,
    "film": "Vaiana",
    "annee": 2016,
    "titre_fr": "L'Explorateur",
    "titre_en": "We Know the Way",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=L%27Explorateur+Vaiana+Disney+bande+originale"
  },
  {
    "id": 129,
    "film": "Vaiana",
    "annee": 2016,
    "titre_fr": "Bling-bling",
    "titre_en": "Shiny",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Bling-bling+Vaiana+Disney+bande+originale"
  },
  {
    "id": 130,
    "film": "Coco",
    "annee": 2017,
    "titre_fr": "Ne m'oublie pas",
    "titre_en": "Remember Me",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Ne+m%27oublie+pas+Coco+Disney+bande+originale"
  },
  {
    "id": 131,
    "film": "Coco",
    "annee": 2017,
    "titre_fr": "Un poco loco",
    "titre_en": "Un Poco Loco",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Un+poco+loco+Coco+Disney+bande+originale"
  },
  {
    "id": 132,
    "film": "Coco",
    "annee": 2017,
    "titre_fr": "Le Monde est mi familia",
    "titre_en": "The World Es Mi Familia",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Le+Monde+est+mi+familia+Coco+Disney+bande+originale"
  },
  {
    "id": 133,
    "film": "Descendants 2",
    "annee": 2017,
    "titre_fr": "Ways to Be Wicked",
    "titre_en": "Ways to Be Wicked",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Ways+to+Be+Wicked+Descendants+2+Disney+bande+originale"
  },
  {
    "id": 134,
    "film": "La Reine des neiges II",
    "annee": 2019,
    "titre_fr": "Dans un autre monde",
    "titre_en": "Into the Unknown",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Dans+un+autre+monde+La+Reine+des+neiges+II+Disney+bande+originale"
  },
  {
    "id": 135,
    "film": "La Reine des neiges II",
    "annee": 2019,
    "titre_fr": "Je te cherche",
    "titre_en": "Show Yourself",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Je+te+cherche+La+Reine+des+neiges+II+Disney+bande+originale"
  },
  {
    "id": 136,
    "film": "La Reine des neiges II",
    "annee": 2019,
    "titre_fr": "Tout réparer",
    "titre_en": "The Next Right Thing",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Tout+r%C3%A9parer+La+Reine+des+neiges+II+Disney+bande+originale"
  },
  {
    "id": 137,
    "film": "Le Roi Lion (2019)",
    "annee": 2019,
    "titre_fr": "Esprit",
    "titre_en": "Spirit",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Esprit+Le+Roi+Lion+%282019%29+Disney+bande+originale"
  },
  {
    "id": 138,
    "film": "Aladdin (2019)",
    "annee": 2019,
    "titre_fr": "Parler",
    "titre_en": "Speechless",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Parler+Aladdin+%282019%29+Disney+bande+originale"
  },
  {
    "id": 139,
    "film": "Encanto",
    "annee": 2021,
    "titre_fr": "Ne parlons pas de Bruno",
    "titre_en": "We Don't Talk About Bruno",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Ne+parlons+pas+de+Bruno+Encanto+Disney+bande+originale"
  },
  {
    "id": 140,
    "film": "Encanto",
    "annee": 2021,
    "titre_fr": "Sous les apparences",
    "titre_en": "Surface Pressure",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Sous+les+apparences+Encanto+Disney+bande+originale"
  },
  {
    "id": 141,
    "film": "Encanto",
    "annee": 2021,
    "titre_fr": "La Famille Madrigal",
    "titre_en": "The Family Madrigal",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=La+Famille+Madrigal+Encanto+Disney+bande+originale"
  },
  {
    "id": 142,
    "film": "Encanto",
    "annee": 2021,
    "titre_fr": "Dos Oruguitas",
    "titre_en": "Dos Oruguitas",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Dos+Oruguitas+Encanto+Disney+bande+originale"
  },
  {
    "id": 143,
    "film": "Alerte Rouge",
    "annee": 2022,
    "titre_fr": "Nobody Like U",
    "titre_en": "Nobody Like U",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Nobody+Like+U+Alerte+Rouge+Disney+bande+originale"
  },
  {
    "id": 144,
    "film": "Wish",
    "annee": 2023,
    "titre_fr": "Je m'appelle Asha",
    "titre_en": "This Wish",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Je+m%27appelle+Asha+Wish+Disney+bande+originale"
  },
  {
    "id": 145,
    "film": "Wish",
    "annee": 2023,
    "titre_fr": "Savoir qui je suis",
    "titre_en": "Knowing What I Know Now",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Savoir+qui+je+suis+Wish+Disney+bande+originale"
  },
  {
    "id": 146,
    "film": "Vaiana 2",
    "annee": 2024,
    "titre_fr": "Au bout du chemin",
    "titre_en": "Beyond",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Au+bout+du+chemin+Vaiana+2+Disney+bande+originale"
  },
  {
    "id": 147,
    "film": "Mufasa : Le Roi Lion",
    "annee": 2024,
    "titre_fr": "J'ai toujours voulu un frère",
    "titre_en": "I Always Wanted a Brother",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=J%27ai+toujours+voulu+un+fr%C3%A8re+Mufasa+%3A+Le+Roi+Lion+Disney+bande+originale"
  },
  {
    "id": 148,
    "film": "Mufasa : Le Roi Lion",
    "annee": 2024,
    "titre_fr": "Frère",
    "titre_en": "Brother Betrayed",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Fr%C3%A8re+Mufasa+%3A+Le+Roi+Lion+Disney+bande+originale"
  },
  {
    "id": 149,
    "film": "Zootopie 2",
    "annee": 2025,
    "titre_fr": "Zoo (Thème Gazelle)",
    "titre_en": "Zoo",
    "type": "Chanson",
    "yt_fallback": "https://www.youtube.com/results?search_query=Zoo+%28Th%C3%A8me+Gazelle%29+Zootopie+2+Disney+bande+originale"
  },
  {
    "id": 150,
    "film": "Star Wars (Disney / Lucasfilm)",
    "annee": 1977,
    "titre_fr": "La Marche impériale",
    "titre_en": "The Imperial March",
    "type": "Instrumental",
    "yt_fallback": "https://www.youtube.com/results?search_query=La+Marche+imp%C3%A9riale+Star+Wars+%28Disney+%2F+Lucasfilm%29+Disney+bande+originale"
  },
  {
    "id": 151,
    "film": "Pirates des Caraïbes",
    "annee": 2003,
    "titre_fr": "He's a Pirate",
    "titre_en": "He's a Pirate",
    "type": "Instrumental",
    "yt_fallback": "https://www.youtube.com/results?search_query=He%27s+a+Pirate+Pirates+des+Cara%C3%AFbes+Disney+bande+originale"
  }
];
