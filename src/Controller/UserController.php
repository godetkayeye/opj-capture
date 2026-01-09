<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/users')]
class UserController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly UserRepository $userRepository,
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly ValidatorInterface $validator,
    ) {
    }

    #[Route('', name: 'api_users_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        // Vérifier que l'utilisateur est authentifié
        $this->denyAccessUnlessGranted('ROLE_OPJ');

        $users = $this->userRepository->findAll();

        $usersData = array_map(function (User $user) {
            $createdAt = $user->getCreatedAt();
            $formattedDate = $createdAt ? $createdAt->format('d M Y') : '';
            
            // Convertir les mois en français
            $months = [
                'Jan' => 'Jan', 'Feb' => 'Fév', 'Mar' => 'Mar', 'Apr' => 'Avr',
                'May' => 'Mai', 'Jun' => 'Jun', 'Jul' => 'Jul', 'Aug' => 'Aoû',
                'Sep' => 'Sep', 'Oct' => 'Oct', 'Nov' => 'Nov', 'Dec' => 'Déc'
            ];
            foreach ($months as $en => $fr) {
                $formattedDate = str_replace($en, $fr, $formattedDate);
            }
            
            return [
                'id' => $user->getId(),
                'nom' => $user->getNom(),
                'prenom' => $user->getPrenom(),
                'email' => $user->getEmail(),
                'matricule' => $user->getMatricule(),
                'role' => $user->getRole(),
                'isActive' => $user->isActive(),
                'createdAt' => $formattedDate,
            ];
        }, $users);

        return new JsonResponse($usersData);
    }

    #[Route('', name: 'api_users_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        // Vérifier que l'utilisateur est authentifié
        $user = $this->getUser();
        
        if (!$user) {
            return new JsonResponse([
                'message' => 'Authentification requise',
            ], Response::HTTP_UNAUTHORIZED);
        }
        
        // Vérifier que l'utilisateur a les permissions pour créer (Admin ou Superviseur)
        $userRole = $user->getRole();
        
        if (!in_array($userRole, ['ROLE_ADMIN', 'ROLE_SUPERVISEUR'], true)) {
            return new JsonResponse([
                'message' => 'Vous n\'avez pas les permissions nécessaires pour créer un utilisateur. Seuls les administrateurs et superviseurs peuvent créer des utilisateurs.',
            ], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return new JsonResponse([
                'message' => 'Données JSON invalides',
            ], Response::HTTP_BAD_REQUEST);
        }

        // Vérifier si l'email existe déjà
        $existingUser = $this->userRepository->findOneBy(['email' => $data['email'] ?? '']);
        if ($existingUser) {
            return new JsonResponse([
                'message' => 'Cet email est déjà utilisé',
            ], Response::HTTP_CONFLICT);
        }

        // Vérifier si le matricule existe déjà
        $existingMatricule = $this->userRepository->findOneBy(['matricule' => $data['matricule'] ?? '']);
        if ($existingMatricule) {
            return new JsonResponse([
                'message' => 'Ce matricule est déjà utilisé',
            ], Response::HTTP_CONFLICT);
        }

        $user = new User();
        $user
            ->setNom($data['nom'] ?? '')
            ->setPrenom($data['prenom'] ?? '')
            ->setEmail($data['email'] ?? '')
            ->setMatricule($data['matricule'] ?? '')
            ->setRole($data['role'] ?? 'ROLE_OPJ')
            ->setIsActive(true);

        // Hasher le mot de passe
        $hashedPassword = $this->passwordHasher->hashPassword(
            $user,
            $data['password'] ?? ''
        );
        $user->setPassword($hashedPassword);

        // Valider l'entité
        $errors = $this->validator->validate($user);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[] = $error->getPropertyPath() . ': ' . $error->getMessage();
            }
            return new JsonResponse([
                'message' => 'Erreurs de validation',
                'errors' => $errorMessages,
            ], Response::HTTP_BAD_REQUEST);
        }

        $this->em->persist($user);
        $this->em->flush();

        return new JsonResponse([
            'message' => 'Utilisateur créé avec succès',
            'user' => [
                'id' => $user->getId(),
                'nom' => $user->getNom(),
                'prenom' => $user->getPrenom(),
                'email' => $user->getEmail(),
                'matricule' => $user->getMatricule(),
                'role' => $user->getRole(),
                'isActive' => $user->isActive(),
                'createdAt' => $user->getCreatedAt()?->format('d M Y'),
            ],
        ], Response::HTTP_CREATED);
    }
}

