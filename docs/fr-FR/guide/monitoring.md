# Guide d’utilisation

Commencez par le résumé environnemental, repérez une application à examiner et ouvrez son détail. Utilisez l’historique pour étudier la période et la méthodologie pour comprendre les estimations. Tenez toujours compte de la couverture avant de comparer.

## Trouver une application {#catalog}

Dans le catalogue, recherchez par nom, identifiant ou région et filtrez par état. Parcourez les pages du tableau et ouvrez une application. Sans correspondance, vérifiez les filtres. L’adresse conserve recherche et pagination pour partager ou reprendre la consultation.

## Lire le tableau de bord {#dashboard}

Dans le tableau de bord, choisissez 24 heures, 7, 30 ou 90 jours, une région et un état. Consultez énergie, émissions, couverture et répartition par état. Le graphique présente les parts d’émissions en barres ou anneau. Recherche, filtres et tri par impact concernent les lignes du tableau ; les totaux conservent le périmètre sélectionné.

Dans la série temporelle, alternez entre énergie et CO₂e ou consultez le tableau des intervalles. La fenêtre de 24 heures utilise un regroupement horaire ; les autres, un regroupement quotidien. Les intervalles suivent UTC et les mêmes filtres que les indicateurs. Les lacunes restent sans valeur.

## Examiner le détail {#detail}

Ouvrez le détail pour vérifier identité, localisation, état et horaires de mise à jour. Examinez métriques et résultats environnementaux sur la même période. La méthodologie enregistrée présente modèle, paramètres et facteur de carbone utilisés sans modifier le résultat. Sans ville disponible, les autres informations géographiques restent utiles.

Le facteur équivalent résume les facteurs régionaux appliqués, pondérés par l’énergie avec des émissions calculées. L’explication utilise cette énergie, qui peut être inférieure au total si des facteurs manquent sur une partie de la période. Ouvrez les détails pour consulter les valeurs et les sources par région.

## Explorer l’historique {#history}

Dans l’historique, choisissez application, période et regroupement par heure, jour, mois ou année. Filtres et pagination permettent de trouver un intervalle, puis sa composition présente observations incluses et exclusions. Le fuseau change l’affichage des dates ; le regroupement reste UTC. La superposition du détail compare l’application à la période précédente de même durée.

## Comparer avec un aperçu de recalcul {#preview}

Dans l’aperçu de recalcul, choisissez application et dates pour comparer l’original à une estimation avec le modèle actuel et les facteurs actuels des régions observées. Le dernier jour est entièrement inclus en UTC. Limites : 30 jours et 10 000 observations. L’aperçu n’est pas sauvegardé et ne modifie pas l’historique. Les écarts en pourcentage exigent unités et couvertures identiques et une valeur originale positive.

## Personnaliser l’analyse {#preferences}

Dans Méthodologie, explorez énergie, émissions, couverture et analyse. Les démonstrations utilisent des exemples signalés à l’écran. Connectez-vous pour sauvegarder seuils d’affichage et options initiales de période et regroupement. Chacun modifie uniquement ses préférences ; calculs et configuration générale sont conservés. En cas de conflit, rechargez la préférence avant de réessayer. Les choix déjà présents dans l’adresse de l’analyse sont prioritaires.

## Se connecter {#access}

Catalogue, tableau de bord et consultations environnementales sont publics. Pour sauvegarder des préférences, utilisez e-mail/mot de passe ou Google si activé et si le compte est lié par invitation. Les administrateurs confirment aussi un code à six chiffres de l’application d’authentification. Recharger termine la session de l’interface et impose une reconnexion. Les droits administratifs dépendent du rôle du compte.

## Langue et apparence {#appearance}

Le sélecteur propose 12 langues ; le choix reste dans ce navigateur. Le mode sombre modifie l’apparence ; avant un choix explicite, l’interface suit le système. Un stockage bloqué peut empêcher la conservation après rechargement. La langue formate dates et nombres sans changer les instants observés.

## Interpréter les données {#data}

Zéro signifie qu’une observation valide justifie cette valeur. Une lacune indique des données inutilisables ou absentes, pas une consommation nulle. Après un échec de mise à jour, la dernière lecture valide peut rester affichée avec son horaire initial. Vérifiez actualisation et couverture avant de décider. Les écrans interrogent les données 60 secondes après chaque tentative ; cela ne garantit pas une nouvelle mesure.

| État | Signification |
| --- | --- |
| Disponible | L’application a renvoyé des métriques utilisables. |
| Indisponible | La tentative actuelle a échoué ; un historique valide peut exister. |
| Sans métriques | L’application est connue, mais aucune métrique utilisable n’est disponible pour la tentative. |
| Supprimée | L’absence a été confirmée dans le catalogue source ; identité et historique sont conservés. |

La couverture est la proportion de la période étayée par des observations valides. Énergie et émissions ont des couvertures distinctes : l’énergie peut être estimée sans facteur permettant de calculer les émissions. Comparez périodes, unités et couvertures compatibles. Une faible couverture indique une analyse partielle, pas une baisse prouvée de consommation.

## Diagnostic {#support}

Signalez application, période, filtres, heure avec fuseau et action effectuée. Décrivez résultat attendu et observé. Les captures aident si elles ne contiennent ni identifiants secrets ni données privées.

## Lectures associées {#related}

[Méthodologie et données](../product/methodology) · [Référence de l’API](../reference/api)
