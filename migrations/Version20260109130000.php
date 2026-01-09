<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Migration pour modifier la colonne photo de VARCHAR(255) à TEXT
 */
final class Version20260109130000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Modifie la colonne photo de la table bandits de VARCHAR(255) à TEXT pour permettre le stockage d\'images en base64';
    }

    public function up(Schema $schema): void
    {
        // Modifier uniquement la colonne photo
        $this->addSql('ALTER TABLE bandits MODIFY COLUMN photo TEXT DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // Revenir à VARCHAR(255)
        $this->addSql('ALTER TABLE bandits MODIFY COLUMN photo VARCHAR(255) DEFAULT NULL');
    }
}

