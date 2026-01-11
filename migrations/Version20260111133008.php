<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260111133008 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add createdBy relationship to Bandit entity';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE bandits ADD created_by_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE bandits ADD CONSTRAINT FK_B449AD35B08E074E FOREIGN KEY (created_by_id) REFERENCES users (id)');
        $this->addSql('CREATE INDEX IDX_B449AD35B08E074E ON bandits (created_by_id)');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE bandits DROP FOREIGN KEY FK_B449AD35B08E074E');
        $this->addSql('DROP INDEX IDX_B449AD35B08E074E ON bandits');
        $this->addSql('ALTER TABLE bandits DROP COLUMN created_by_id');
    }
}
