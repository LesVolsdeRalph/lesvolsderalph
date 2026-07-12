# Les Vols de Ralph — serveur Duffel

Petit serveur qui interroge l'API Duffel pour Les Vols de Ralph, sans jamais exposer la clé secrète côté navigateur.

## 1. Obtenir ta clé API Duffel (sandbox / test)

1. Va sur https://duffel.com et clique sur "Sign up" / "Get started".
2. Crée un compte (email + mot de passe).
3. Une fois connecté, va dans **Developers → API keys** (ou "Settings" selon la version du dashboard).
4. Duffel te donne automatiquement une clé de **test** qui commence par `duffel_test_...`. C'est celle-ci qu'on utilise pour développer — elle renvoie de vraies données de vols mais aucune réservation réelle n'est faite ni facturée.
5. Garde cette clé de côté, tu vas la coller à l'étape 3 ci-dessous.

⚠️ Il existe aussi une clé "live" (`duffel_live_...`) pour quand le site sera en production et fera de vraies réservations facturées. Ne jamais utiliser la clé live pendant les tests.

## 2. Installer les dépendances

Il te faut [Node.js](https://nodejs.org) installé (version 18 ou plus récente).

```bash
cd duffel-backend
npm install
```

## 3. Configurer ta clé

```bash
cp .env.example .env
```

Puis ouvre le fichier `.env` et remplace la valeur par ta vraie clé de test :

```
DUFFEL_API_KEY=duffel_test_ta_vraie_cle_ici
```

## 4. Lancer le serveur

```bash
npm start
```

Tu devrais voir : `✅ Serveur Les Vols de Ralph lancé sur http://localhost:3001`

## 5. Tester que ça marche

Dans un autre terminal, ou directement dans le navigateur :

```bash
curl http://localhost:3001/api/health
```

Puis un vrai test de recherche :

```bash
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "CDG",
    "destination": "DSS",
    "departDate": "2026-09-10",
    "returnDate": "2026-09-24",
    "roundTrip": true,
    "passengers": 1
  }'
```

Si tout est bien configuré, tu reçois une liste de vols réels avec prix, compagnie et horaires.

## Prochaine étape

Une fois que ce serveur tourne chez toi, on connecte la page `resultats.html` du site pour qu'elle appelle `http://localhost:3001/api/search` au lieu des liens vers Google Flights / Skyscanner / Kayak, et qu'elle affiche les résultats directement dans le design en verre dépoli du site.

Pour que le site soit accessible en ligne (pas seulement sur ton ordinateur), il faudra héberger ce serveur quelque part (Railway, Render, Fly.io par exemple) — on verra ça quand tu seras prêt à passer en ligne.
