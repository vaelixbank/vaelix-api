require('dotenv').config();
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

// Configuration de la base de données depuis les variables d'environnement
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function testApiKeySystem() {
  try {
    console.log('🧪 Test du système de clés API...\n');

    // 1. Vérifier la connexion à la DB
    await pool.query('SELECT 1');
    console.log('✅ Connexion à la base de données établie\n');

    // 2. Générer une nouvelle clé API
    console.log('🔑 Génération d\'une nouvelle clé API...');
    const keySuffix = crypto.randomBytes(24).toString('hex');
    const key = `vb_${keySuffix}`;
    const secret = crypto.randomBytes(64).toString('hex');
    const hashedSecret = await bcrypt.hash(secret, 12);

    // Trouver un utilisateur existant
    const userResult = await pool.query('SELECT id FROM users LIMIT 1');
    if (userResult.rows.length === 0) {
      throw new Error('Aucun utilisateur trouvé dans la base de données');
    }
    const userId = userResult.rows[0].id;

    // Insérer la clé API
    const insertResult = await pool.query(
      `INSERT INTO api_keys (user_id, key, secret, type, name, description, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, key, type, name, description, created_at`,
      [userId, key, hashedSecret, 'client', 'test-key', 'Clé de test pour validation']
    );

    const apiKey = insertResult.rows[0];
    console.log('✅ Clé API créée avec succès');
    console.log(`   ID: ${apiKey.id}`);
    console.log(`   Clé: ${apiKey.key}`);
    console.log(`   Type: ${apiKey.type}`);
    console.log(`   Nom: ${apiKey.name}\n`);

    // 3. Tester la validation de la clé
    console.log('🔍 Test de validation de la clé...');

    // Récupérer la clé depuis la DB (simulation de ce que fait l'API)
    const dbResult = await pool.query(
      'SELECT * FROM api_keys WHERE key = $1',
      [key]
    );

    if (dbResult.rows.length === 0) {
      throw new Error('Clé non trouvée dans la base de données');
    }

    const storedKey = dbResult.rows[0];

    // Vérifier le secret avec bcrypt
    const isValidSecret = await bcrypt.compare(secret, storedKey.secret);

    if (!isValidSecret) {
      throw new Error('Échec de validation du secret');
    }

    console.log('✅ Validation réussie !');
    console.log(`   Clé trouvée: ${storedKey.key}`);
    console.log(`   Type: ${storedKey.type}`);
    console.log(`   Utilisateur: ${storedKey.user_id}`);
    console.log(`   Nom: ${storedKey.name}\n`);

    // 4. Tester avec un secret invalide
    console.log('🛡️  Test de sécurité avec secret invalide...');
    const invalidSecret = crypto.randomBytes(64).toString('hex');
    const isInvalidValid = await bcrypt.compare(invalidSecret, storedKey.secret);

    if (isInvalidValid) {
      throw new Error('Le système de sécurité a échoué');
    }

    console.log('✅ Sécurité validée - secret invalide rejeté\n');

    // 5. Lister toutes les clés de l'utilisateur
    console.log('📋 Liste des clés API de l\'utilisateur:');
    const userKeys = await pool.query(
      'SELECT id, key, type, name, description, created_at FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    userKeys.rows.forEach((k, index) => {
      console.log(`   ${index + 1}. ${k.key} (${k.type}) - ${k.name || 'sans nom'}`);
    });

    console.log('\n🎉 Test complet réussi ! Le système de clés API fonctionne correctement.');
    console.log('\n💡 Récapitulatif :');
    console.log('   • Clés générées avec préfixe vb_');
    console.log('   • Secrets hashés avec bcrypt');
    console.log('   • Validation sécurisée');
    console.log('   • Multi-gestion par utilisateur');
    console.log('   • Support des noms/alias');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testApiKeySystem();