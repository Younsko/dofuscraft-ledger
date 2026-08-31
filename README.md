<div align="center">

# ⚔️ DofusCraft Ledger

**L'application web ultime pour artisans, traders et forgemages de Dofus 3.**
*Indexation d'achats HDV multi-lots, scanner OCR de captures d'écran, gestion de stock en temps réel, calcul du Prix de Revient Unitaire (PRU) et simulateur de craft.*

[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![OCR Engine](https://img.shields.io/badge/OCR-Tesseract.js-yellow?style=for-the-badge)](https://tesseract.projectnaptha.com/)
[![Netlify Deploy](https://img.shields.io/badge/Deploy-Netlify-00C7B7?style=for-the-badge&logo=netlify)](https://www.netlify.com/)

[Fonctionnalités](#-fonctionnalités) • [Installation Locale](#-installation-locale) • [Déploiement GitHub & Netlify](#-déploiement-sur-github--netlify) • [Technologies](#-technologies)

</div>

---

## ✨ Fonctionnalités Clés

### ⚡ 1. Indexeur HDV Rapide & Grille Préchargée (0ms de Latence)
- **Catalogue préchargé en mémoire** : Toutes les ressources, runes, consommables et équipements du jeu accessibles instantanément.
- **Grille avec densité réglable** : Basculez en 1 clic entre grille compacte (dense 3 colonnes), moyenne (2 colonnes) ou vue liste détaillée.
- **Curseur de niveau dynamique (1 à 200)** avec presets rapides (BL, ML, HL, THL 200).
- **1 clic sur un item** l'ajoute immédiatement à votre panier d'achats sans ouvrir de modal.
- **Saisie intelligente des Kamas** : comprend nativement les notations Dofus (`1m`, `500k`, `2.5m`, `1 200 000`).
- **Gestion multi-lots & PRU** : gestion de plusieurs lots achetés à des prix différents avec calcul automatique du Prix de Revient Unitaire pondéré.

### 📷 2. Scanner OCR pour Screenshots du Chat Dofus
- **Coller directement un screenshot (`Ctrl+V`)** : Prenez une capture d'écran de vos messages d'achats en jeu (ex : *« Vous avez acheté 100 '[Gelée Bleuet]' pour 120 000 kamas »*).
- **Reconnaissance optique locale (Tesseract.js)** : Détection automatique des quantités, noms d'objets et prix payés, et ajout ligne par ligne dans le tableur.
- **Support copier-coller texte** pour coller directement des logs de chat textuels.

### 🔨 3. Atelier de Craft & Déduction Automatique des Stocks
- **Multiplicateur de craft** (`x1`, `x5`, `x10`, `x50`, `x100`...).
- **Checklist dynamique des ingrédients** :
  - 🟢 **Vert** : Ingrédient disponible en stock avec affichage de votre PRU réel.
  - 🔴 **Rouge écarlate** : Ingrédient manquant avec affichage du déficit exact (ex: `-25u`) et bouton d'achat direct pré-rempli.
- **Calcul du coût de fabrication réel** et projection de la marge nette après taxe HDV (2%).
- **Exécution du craft en 1 clic** : déduit les ressources consommées du stock (méthode FIFO) et crée l'item crafté avec son coût exact de production.

### 🔮 4. Support Intégral des Runes de Forgemagie
- **Runes de Transcendance** : Trans Do So (Dommages Sorts), Trans Do Dis, Trans Do Mel, Trans Vi, Trans Fo, Trans Ine, Trans Cha, Trans Agi, Trans Fuite, Trans Tacle, Trans Ré Crit...
- **Runes de Corruption** : Corrup Vi (+90 Vi), Corrup Fo, Corrup Ine, Corrup Cha, Corrup Agi.
- **Runes Classiques & Spéciales** : Ga Pâ, Ga Pme, Po, Invo, Cri, Dommages élémentaires, % Résistances, Ra / Pa / Fo, Vi, Sa.

### 💰 5. Suivi des Ventes & Rentabilité (ROI)
- Enregistrement des ventes d'items craftés au prix HDV.
- Déduction automatique de la taxe de vente HDV (2%).
- Calcul du bénéfice net en Kamas ($+\text{Kamas}$) et du pourcentage de retour sur investissement (ROI).

### 💾 6. Sauvegarde & Export/Import JSON
- Persistance automatique en LocalStorage dans votre navigateur.
- Export et import de fichiers de sauvegarde JSON.

---

## 🚀 Installation Locale

### Prérequis
- [Node.js](https://nodejs.org/) version 18 ou supérieure.
- Git.

### Étapes
```bash
# 1. Cloner le dépôt
git clone https://github.com/Younsko/dofuscraft-ledger.git
cd dofuscraft-ledger

# 2. Installer les dépendances
npm install

# 3. Lancer le serveur de développement local
npm run dev
```

L'application sera accessible sur `http://localhost:3000/`.

---

## 🌐 Déploiement sur GitHub & Netlify

### 1. Publier sur GitHub
Créez un nouveau dépôt vide sur votre compte GitHub (ex: `dofuscraft-ledger`), puis exécutez :

```bash
git branch -M main
git remote add origin https://github.com/Younsko/dofuscraft-ledger.git
git add .
git commit -m "feat: initial release DofusCraft Ledger v3"
git push -u origin main
```

### 2. Déployer sur Netlify (Gratuit & Automatique)
1. Rendez-vous sur [Netlify](https://app.netlify.com/) et connectez-vous avec votre compte GitHub.
2. Cliquez sur **"Add new site"** > **"Import an existing project"** > **GitHub**.
3. Sélectionnez le dépôt `dofuscraft-ledger`.
4. Netlify détecte automatiquement la configuration grâce au fichier `netlify.toml` inclus :
   - **Build command** : `npm run build`
   - **Publish directory** : `dist`
5. Cliquez sur **"Deploy dofuscraft-ledger"**. Votre site sera en ligne en moins de 60 secondes avec une URL sécurisée HTTPS !

---

## 🛠️ Technologies Utilisées

- **Frontend** : React 19, TypeScript, Vite
- **Styling** : Tailwind CSS v4, Lucide Icons, Google Fonts (Marcellus, Outfit, JetBrains Mono)
- **OCR Engine** : Tesseract.js (reconnaissance optique de caractères côté client)
- **Data** : API Dofus 3 (DofusDude) + dataset complet des runes FM
- **Animations** : Canvas Confetti

---

## 📜 Mentions Légales

Dofus est un MMORPG édité par Ankama Games. Ce projet est une application communautaire non-officielle et indépendante, créée pour faciliter le calcul de rentabilité des artisans et joueurs.
