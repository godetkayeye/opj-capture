<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260109233750 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE bandits CHANGE surnom surnom VARCHAR(100) DEFAULT NULL, CHANGE date_naissance date_naissance DATE DEFAULT NULL, CHANGE sexe sexe VARCHAR(1) NOT NULL, CHANGE etat etat VARCHAR(20) DEFAULT \'CAPTURE\' NOT NULL, CHANGE created_at created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL');
        $this->addSql('ALTER TABLE bandit_infraction RENAME INDEX fk_bandit_infraction_infraction TO IDX_A461049A7697C467');
        $this->addSql('DROP INDEX idx_captures_date ON captures');
        $this->addSql('ALTER TABLE captures CHANGE commentaire commentaire LONGTEXT DEFAULT NULL, CHANGE created_at created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL');
        $this->addSql('ALTER TABLE captures RENAME INDEX fk_capture_bandit TO IDX_CBE5275A294E5988');
        $this->addSql('ALTER TABLE captures RENAME INDEX fk_capture_opj TO IDX_CBE5275A7C29F7A6');
        $this->addSql('ALTER TABLE infractions CHANGE description description LONGTEXT DEFAULT NULL, CHANGE created_at created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL');
        $this->addSql('ALTER TABLE preuves CHANGE type type VARCHAR(20) NOT NULL, CHANGE fichier fichier LONGTEXT NOT NULL, CHANGE description description VARCHAR(255) DEFAULT NULL, CHANGE created_at created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL');
        $this->addSql('ALTER TABLE preuves RENAME INDEX fk_preuve_capture TO IDX_BB27A08A6B301384');
        $this->addSql('DROP INDEX idx_users_role ON users');
        $this->addSql('ALTER TABLE users CHANGE role role VARCHAR(30) NOT NULL, CHANGE is_active is_active TINYINT DEFAULT 1 NOT NULL, CHANGE created_at created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL');
        $this->addSql('ALTER TABLE users RENAME INDEX matricule TO UNIQ_1483A5E912B2DC9C');
        $this->addSql('ALTER TABLE users RENAME INDEX email TO UNIQ_1483A5E9E7927C74');
        $this->addSql('ALTER TABLE validations CHANGE statut statut VARCHAR(20) DEFAULT \'EN_ATTENTE\' NOT NULL, CHANGE remarque remarque LONGTEXT DEFAULT NULL, CHANGE date_validation date_validation DATETIME DEFAULT NULL, CHANGE created_at created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL');
        $this->addSql('ALTER TABLE validations RENAME INDEX fk_validation_capture TO IDX_B1122F0F6B301384');
        $this->addSql('ALTER TABLE validations RENAME INDEX fk_validation_superviseur TO IDX_B1122F0FB7BB80FF');
        $this->addSql('ALTER TABLE messenger_messages CHANGE delivered_at delivered_at DATETIME DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE bandits CHANGE surnom surnom VARCHAR(100) DEFAULT \'NULL\', CHANGE date_naissance date_naissance DATE DEFAULT \'NULL\', CHANGE sexe sexe ENUM(\'M\', \'F\') NOT NULL, CHANGE etat etat ENUM(\'CAPTURE\', \'TRANSFERE\', \'LIBERE\') DEFAULT \'\'\'CAPTURE\'\'\', CHANGE created_at created_at DATETIME DEFAULT \'current_timestamp()\'');
        $this->addSql('ALTER TABLE bandit_infraction RENAME INDEX idx_a461049a7697c467 TO fk_bandit_infraction_infraction');
        $this->addSql('ALTER TABLE captures CHANGE commentaire commentaire TEXT DEFAULT NULL, CHANGE created_at created_at DATETIME DEFAULT \'current_timestamp()\'');
        $this->addSql('CREATE INDEX idx_captures_date ON captures (date_capture)');
        $this->addSql('ALTER TABLE captures RENAME INDEX idx_cbe5275a294e5988 TO fk_capture_bandit');
        $this->addSql('ALTER TABLE captures RENAME INDEX idx_cbe5275a7c29f7a6 TO fk_capture_opj');
        $this->addSql('ALTER TABLE infractions CHANGE description description TEXT DEFAULT NULL, CHANGE created_at created_at DATETIME DEFAULT \'current_timestamp()\'');
        $this->addSql('ALTER TABLE messenger_messages CHANGE delivered_at delivered_at DATETIME DEFAULT \'NULL\'');
        $this->addSql('ALTER TABLE preuves CHANGE type type ENUM(\'PHOTO\', \'PDF\', \'VIDEO\') NOT NULL, CHANGE fichier fichier TEXT NOT NULL, CHANGE description description VARCHAR(255) DEFAULT \'NULL\', CHANGE created_at created_at DATETIME DEFAULT \'current_timestamp()\'');
        $this->addSql('ALTER TABLE preuves RENAME INDEX idx_bb27a08a6b301384 TO fk_preuve_capture');
        $this->addSql('ALTER TABLE users CHANGE role role ENUM(\'ROLE_OPJ\', \'ROLE_SUPERVISEUR\', \'ROLE_ADMIN\') NOT NULL, CHANGE is_active is_active TINYINT DEFAULT 1, CHANGE created_at created_at DATETIME DEFAULT \'current_timestamp()\'');
        $this->addSql('CREATE INDEX idx_users_role ON users (role)');
        $this->addSql('ALTER TABLE users RENAME INDEX uniq_1483a5e9e7927c74 TO email');
        $this->addSql('ALTER TABLE users RENAME INDEX uniq_1483a5e912b2dc9c TO matricule');
        $this->addSql('ALTER TABLE validations CHANGE statut statut ENUM(\'EN_ATTENTE\', \'VALIDEE\', \'REJETEE\') DEFAULT \'\'\'EN_ATTENTE\'\'\', CHANGE remarque remarque TEXT DEFAULT NULL, CHANGE date_validation date_validation DATETIME DEFAULT \'NULL\', CHANGE created_at created_at DATETIME DEFAULT \'current_timestamp()\'');
        $this->addSql('ALTER TABLE validations RENAME INDEX idx_b1122f0f6b301384 TO fk_validation_capture');
        $this->addSql('ALTER TABLE validations RENAME INDEX idx_b1122f0fb7bb80ff TO fk_validation_superviseur');
    }
}
