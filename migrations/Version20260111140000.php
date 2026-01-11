<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260111140000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add approval fields to infractions table';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE infractions ADD COLUMN is_approved TINYINT(1) DEFAULT 0 NOT NULL');
        $this->addSql('ALTER TABLE infractions ADD COLUMN approved_by_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE infractions ADD COLUMN approved_at DATETIME DEFAULT NULL');
        $this->addSql('ALTER TABLE infractions ADD CONSTRAINT FK_4C4A14D1C3C4C098 FOREIGN KEY (approved_by_id) REFERENCES users (id) ON DELETE SET NULL');
        $this->addSql('CREATE INDEX IDX_4C4A14D1C3C4C098 ON infractions (approved_by_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE infractions DROP FOREIGN KEY FK_4C4A14D1C3C4C098');
        $this->addSql('DROP INDEX IDX_4C4A14D1C3C4C098 ON infractions');
        $this->addSql('ALTER TABLE infractions DROP COLUMN is_approved');
        $this->addSql('ALTER TABLE infractions DROP COLUMN approved_by_id');
        $this->addSql('ALTER TABLE infractions DROP COLUMN approved_at');
    }
}
