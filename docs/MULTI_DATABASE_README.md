# Multi-Database Support

Ce document décrit le système multi-base de données implémenté dans l'API Vaelix Bank, permettant l'interconnexion et la communication entre plusieurs serveurs PostgreSQL via des clés API dédiées.

## Architecture

### Composants principaux

1. **DatabaseManager** (`app/services/databaseManager.ts`)
   - Gestion centralisée des connexions à plusieurs bases de données
   - Routage automatique basé sur les clés API
   - Monitoring de santé des bases
   - Support pour les requêtes fédérées

2. **ReplicationService** (`app/services/replicationService.ts`)
   - Synchronisation automatique entre bases de données
   - Jobs de réplication configurables
   - Réplication manuelle à la demande

3. **DatabaseController** (`app/controllers/DatabaseController.ts`)
   - Endpoints pour les opérations multi-base
   - Gestion des requêtes fédérées
   - Contrôle des jobs de réplication

4. **Middleware de routage** (`app/middleware/apiKeyAuth.ts`)
   - Routage automatique vers la bonne base selon la clé API
   - Validation de santé des bases

## Configuration

### Variables d'environnement

```bash
# Base primaire (obligatoire)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vaelixbank
DB_USER=postgres
DB_PASSWORD=password

# Base secondaire (optionnelle)
DB2_HOST=secondary-db.example.com
DB2_PORT=5432
DB2_NAME=vaelixbank_secondary
DB2_USER=postgres
DB2_PASSWORD=password

# Base d'analytics (optionnelle)
DB3_HOST=analytics-db.example.com
DB3_PORT=5432
DB3_NAME=vaelixbank_analytics
DB3_USER=postgres
DB3_PASSWORD=password
```

### Configuration des bases

La configuration des bases se fait automatiquement dans `app/config/index.ts` :

```typescript
databases: [
  {
    id: 'primary',
    name: 'Primary Database',
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    maxConnections: 20,
    region: 'eu-west',
    readOnly: false,
  },
  // ... autres bases
]
```

## Utilisation

### Authentification

Toutes les opérations multi-base nécessitent une clé API de type `database` :

```bash
curl -X POST /api/database/query \
  -H "X-API-Key: vb_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  -H "X-API-Secret: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT * FROM users LIMIT 10"}'
```

### Endpoints disponibles

#### Exécution de requêtes

```http
POST /api/database/query
```

Exécute une requête sur la base routée automatiquement.

**Exemple :**
```json
{
  "query": "SELECT id, name FROM accounts WHERE balance > 1000",
  "params": []
}
```

#### Transactions multi-requêtes

```http
POST /api/database/transaction
```

Exécute plusieurs requêtes dans une transaction.

**Exemple :**
```json
{
  "queries": [
    {
      "query": "UPDATE accounts SET balance = balance - 100 WHERE id = $1",
      "params": [123]
    },
    {
      "query": "UPDATE accounts SET balance = balance + 100 WHERE id = $1",
      "params": [456]
    }
  ]
}
```

#### Requêtes fédérées

```http
POST /api/database/federated-query
```

Exécute une requête sur plusieurs bases simultanément.

**Exemple :**
```json
{
  "query": "SELECT COUNT(*) as user_count FROM users",
  "databases": ["primary", "secondary"]
}
```

#### Informations sur les bases

```http
GET /api/database/info
```

Retourne les informations sur la base courante et toutes les bases disponibles.

#### Schéma de base de données

```http
GET /api/database/schema
```

Retourne la structure des tables de la base routée.

#### Health check

```http
GET /api/database/health
```

Vérifie la santé de la base routée.

### Gestion de la réplication

#### Lister les jobs de réplication

```http
GET /api/database/replication/jobs
```

#### Créer un job de réplication

```http
POST /api/database/replication/jobs
```

**Exemple :**
```json
{
  "sourceDatabase": "primary",
  "targetDatabases": ["secondary", "analytics"],
  "tables": ["users", "transactions"],
  "syncKey": "updated_at",
  "intervalMinutes": 15,
  "enabled": true
}
```

#### Lancer une réplication manuelle

```http
POST /api/database/replication/jobs/{jobId}/run
```

#### Répliquer une table immédiatement

```http
POST /api/database/replication/table
```

**Exemple :**
```json
{
  "sourceDatabase": "primary",
  "targetDatabases": ["secondary"],
  "table": "transactions",
  "syncKey": "created_at"
}
```

## Routage automatique

Le système route automatiquement les requêtes vers la bonne base selon le type de clé API :

- **Clés `database`** : Routage basé sur l'ID utilisateur (sharding simple)
- **Clés `client`** : Toujours vers la base primaire
- **Clés `server`** : Accès à toutes les bases selon le contexte

### Logique de sharding

Par défaut, un sharding simple basé sur la parité de l'ID utilisateur :

```typescript
private routeByUserId(userId: number): string {
  if (userId % 2 === 0) {
    return 'primary';
  } else if (this.pools.has('secondary')) {
    return 'secondary';
  } else {
    return 'primary';
  }
}
```

## Monitoring et santé

### Checks de santé automatiques

Le système effectue des checks de santé toutes les 30 secondes :

- Connexions actives
- Temps de réponse
- État des pools de connexions

### Métriques disponibles

```json
{
  "currentDatabase": {
    "id": "primary",
    "name": "Primary Database",
    "health": {
      "status": "healthy",
      "lastChecked": "2025-10-17T...",
      "connectionCount": 5,
      "responseTime": 12
    }
  }
}
```

## Sécurité

### Authentification obligatoire

Toutes les opérations multi-base nécessitent :
- Clé API valide de type `database`
- Secret API correspondant
- Base de données saine

### Isolation des données

- Chaque clé API ne peut accéder qu'à une base spécifique
- Les requêtes fédérées sont contrôlées
- Audit trail complet des opérations

## Performance

### Optimisations

- Pools de connexions configurables
- Requêtes parallèles pour les opérations fédérées
- Cache des métadonnées de santé
- Transactions optimisées

### Limitations

- Pas de support pour les requêtes JOIN cross-database natives
- Latence réseau pour les opérations fédérées
- Consistance éventuelle pour la réplication

## Déploiement

### Prérequis

1. Plusieurs instances PostgreSQL configurées
2. Réseau permettant la connectivité entre serveurs
3. Clés API de type `database` créées

### Démarrage

Le système s'initialise automatiquement au démarrage de l'API :

1. Connexions aux bases configurées
2. Démarrage des checks de santé
3. Initialisation des jobs de réplication par défaut

### Monitoring

Surveiller les logs pour :
- Échecs de connexion aux bases
- Erreurs de réplication
- Performances des requêtes fédérées

## Exemples d'usage

### Migration de données

```bash
# Répliquer une table vers plusieurs bases
curl -X POST /api/database/replication/table \
  -H "X-API-Key: ..." \
  -H "X-API-Secret: ..." \
  -d '{
    "sourceDatabase": "primary",
    "targetDatabases": ["secondary", "analytics"],
    "table": "transactions",
    "syncKey": "created_at"
  }'
```

### Requête analytique fédérée

```bash
# Compter les utilisateurs sur toutes les bases
curl -X POST /api/database/federated-query \
  -H "X-API-Key: ..." \
  -H "X-API-Secret: ..." \
  -d '{
    "query": "SELECT COUNT(*) as total_users FROM users"
  }'
```

### Health check global

```bash
# Vérifier l'état de toutes les bases
curl -X GET /api/database/info \
  -H "X-API-Key: ..." \
  -H "X-API-Secret: ..."
```