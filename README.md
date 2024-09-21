Simple Browser - Node.js Script

Ce projet est une adaptation en Node.js d'un script permettant de lancer des requêtes automatisées avec gestion de proxy. Il simule des attaques réseau simples en utilisant des techniques de bypass pour certains défis de sécurité, comme ceux des pages protégées par CAPTCHA ou UAM.
Fonctionnalités

    Automatisation du navigateur avec Puppeteer.
    Utilisation de proxies pour masquer l'origine des requêtes.
    Gestion de threads multiples pour simuler plusieurs connexions simultanées.
    Support des requêtes HTTP/HTTPS avec et sans proxies.

Utilisation

    Installez les dépendances nécessaires : npm install puppeteer https-proxy-agent
    node main.js <target> <threads> <proxies-file> | les threads dépenderont du nombre de cors de la machine sur la quelle il est executé --> les proxies seront a renew a chaque utilisation

Exemple

- `node main.js https://marseillelesfdp.com/ 50 proxies.txt`
  


