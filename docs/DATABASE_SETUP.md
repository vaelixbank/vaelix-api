# 🗄️ Vaelix Bank API - Database Setup Guide

Ce guide explique comment configurer et injecter le schéma de base de données pour l'API Vaelix Bank.

## 📋 Prérequis

- PostgreSQL 12+ installé et en cours d'exécution
- Node.js 16+ installé
- Accès à une base de données PostgreSQL

## ⚙️ Configuration des Variables d'Environnement

1. **Copiez le fichier d'exemple d'environnement :**
   ```bash
   cp .env.example .env
   ```

2. **Configurez les variables de base de données dans `.env` :**
   ```env
   # Database Configuration
   DB_HOST=localhost          # Adresse du serveur PostgreSQL
   DB_PORT=5432              # Port PostgreSQL (défaut: 5432)
   DB_NAME=vaelixbank        # Nom de la base de données
   DB_USER=vaelixbank_user   # Utilisateur PostgreSQL
   DB_PASSWORD=your_password # Mot de passe sécurisé
   ```

3. **Variables optionnelles :**
   ```env
   NODE_ENV=development      # Environnement (development/production)
   ```

## 🚀 Injection du Schéma de Base de Données

### Méthode 1: Utilisation du Script Automatique (Recommandé)

Le script automatique gère la connexion, la validation et l'injection du schéma :

```bash
# Injection complète du schéma
npm run db:schema

# Ou directement avec Node.js
node scripts/inject-schema.js
```

**Ce que fait le script :**
- ✅ Valide les variables d'environnement
- ✅ Teste la connexion à la base de données
- ✅ Lit et parse le fichier `data/schema-pgsql.sql`
- ✅ Exécute toutes les instructions SQL
- ✅ Gère les erreurs et continue l'exécution
- ✅ Affiche un rapport détaillé des opérations

### Méthode 2: Injection Manuelle avec psql

Si vous préférez une approche manuelle :

```bash
# Via psql directement
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f data/schema-pgsql.sql

# Ou via Docker si vous utilisez PostgreSQL en conteneur
docker exec -i vaelixbank-postgres psql -U $DB_USER -d $DB_NAME < data/schema-pgsql.sql
```

## 📊 Contenu du Schéma

Le schéma inclut **73 tables** organisées en sections :

### 🏦 **Core Banking (Tables de Base)**
- `users` - Utilisateurs et authentification
- `accounts` - Comptes bancaires
- `transactions` - Transactions financières
- `cards` - Cartes de paiement
- `wallets` - Portefeuilles électroniques

### 🔓 **Open Banking (Berlin Group API)**
- `open_banking_consents` - Consentements Open Banking
- `payment_initiations` - Initiations de paiement
- `webhook_subscriptions` - Abonnements webhooks
- `webhook_events_open_banking` - Événements Open Banking

### 🏢 **BaaS (Banking as a Service)**
- `baas_customers` - Clients BaaS
- `baas_accounts` - Comptes BaaS
- `baas_cards` - Cartes BaaS
- `baas_transactions` - Transactions BaaS

### ⚖️ **Conformité Légale (KYC, AML, RGPD)**
- `kyc_profiles` - Profils KYC avancés
- `aml_screening_results` - Résultats de screening AML
- `regulatory_reports` - Rapports réglementaires
- `compliance_incidents` - Incidents de conformité
- `consent_records` - Gestion des consentements RGPD
- `risk_assessments` - Évaluations des risques
- `audit_trail` - Traçabilité complète
- `security_events` - Événements de sécurité

### 🔗 **Intégration Weavr**
- Champs Weavr dans toutes les tables pertinentes
- `weavr_sync` - Synchronisation bidirectionnelle
- Références KYC et vérifications Weavr

## 🔍 Validation du Schéma

Après l'injection, vous pouvez valider que tout est correct :

```bash
# Validation de la syntaxe du schéma
npm run db:validate

# Ou vérifier manuellement le nombre de tables
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
```

## 🛠️ Dépannage

### Erreur de Connexion
```
❌ Missing required environment variables
```
**Solution :** Vérifiez que toutes les variables `DB_*` sont définies dans `.env`

### Erreur d'Authentification
```
FATAL: password authentication failed
```
**Solution :** Vérifiez les identifiants PostgreSQL et les permissions utilisateur

### Tables Déjà Existantes
```
ERROR: relation "users" already exists
```
**Solution :** Le script gère automatiquement ces erreurs et continue. C'est normal lors de ré-exécutions.

### Erreurs de Permissions
```
ERROR: permission denied for database
```
**Solution :** Accordez les permissions nécessaires à l'utilisateur PostgreSQL :
```sql
GRANT ALL PRIVILEGES ON DATABASE vaelixbank TO vaelixbank_user;
```

## 📈 Performances et Indexation

Le schéma inclut **80+ indexes** optimisés pour :
- ✅ Requêtes fréquentes (recherche par ID, statut, dates)
- ✅ Jointures complexes (relations entre entités)
- ✅ Filtrage réglementaire (KYC, AML, audit)
- ✅ Recherche temporelle (transactions, événements)

## 🔐 Sécurité

- ✅ **Chiffrement des mots de passe** et données sensibles
- ✅ **Contraintes de validation** sur toutes les données critiques
- ✅ **Audit trails complets** pour conformité
- ✅ **Gestion des permissions** granulaire

## 🚀 Prochaines Étapes

Après l'injection du schéma :

1. **Démarrer l'API :**
   ```bash
   npm start
   ```

2. **Créer un utilisateur administrateur :**
   ```bash
   # Utilisez les endpoints d'authentification
   ```

3. **Configurer Weavr :**
   - Définir `WEAVR_API_KEY` dans `.env`
   - Tester l'intégration Weavr

4. **Configurer la surveillance :**
   - Logs, métriques, alertes

## 📞 Support

En cas de problème :
1. Vérifiez les logs du script d'injection
2. Consultez les erreurs PostgreSQL détaillées
3. Vérifiez la configuration réseau et les firewalls

---

**🎉 Votre base de données Vaelix Bank est maintenant prête pour la production !**