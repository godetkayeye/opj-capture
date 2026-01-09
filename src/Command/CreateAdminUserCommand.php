<?php

namespace App\Command;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[AsCommand(
    name: 'app:create-admin',
    description: 'Crée un utilisateur administrateur',
)]
class CreateAdminUserCommand extends Command
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UserPasswordHasherInterface $passwordHasher,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('email', InputArgument::REQUIRED, 'Email de l’admin')
            ->addArgument('password', InputArgument::REQUIRED, 'Mot de passe de l’admin')
            ->addArgument('nom', InputArgument::OPTIONAL, 'Nom', 'Admin')
            ->addArgument('prenom', InputArgument::OPTIONAL, 'Prénom', 'Super')
            ->addArgument('matricule', InputArgument::OPTIONAL, 'Matricule', 'ADMIN-001');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $user = new User();
        $user
            ->setEmail($input->getArgument('email'))
            ->setNom($input->getArgument('nom'))
            ->setPrenom($input->getArgument('prenom'))
            ->setMatricule($input->getArgument('matricule'))
            ->setRole('ROLE_ADMIN');

        $hashedPassword = $this->passwordHasher->hashPassword(
            $user,
            $input->getArgument('password')
        );
        $user->setPassword($hashedPassword);

        $this->em->persist($user);
        $this->em->flush();

        $output->writeln('Administrateur créé avec succès.');

        return Command::SUCCESS;
    }
}


