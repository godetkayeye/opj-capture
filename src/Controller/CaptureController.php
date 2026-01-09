<?php

namespace App\Controller;

use App\Entity\Capture;
use App\Repository\CaptureRepository;
use App\Repository\BanditRepository;
use App\Repository\UserRepository;
use App\Repository\PreuveRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/captures')]
class CaptureController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly CaptureRepository $captureRepository,
        private readonly BanditRepository $banditRepository,
        private readonly UserRepository $userRepository,
        private readonly PreuveRepository $preuveRepository,
        private readonly ValidatorInterface $validator,
    ) {
    }

    #[Route('', name: 'api_captures_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        // Vérifier que l'utilisateur est authentifié
        $this->denyAccessUnlessGranted('ROLE_OPJ');

        $captures = $this->captureRepository->findAll();

        $capturesData = array_map(function (Capture $capture) {
            $createdAt = $capture->getCreatedAt();
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

            $dateCapture = $capture->getDateCapture();
            $formattedDateCapture = $dateCapture ? $dateCapture->format('d M Y à H:i') : '';
            foreach ($months as $en => $fr) {
                $formattedDateCapture = str_replace($en, $fr, $formattedDateCapture);
            }

            // Récupérer les preuves
            $preuves = $this->preuveRepository->findBy(['capture' => $capture]);
            $preuvesData = array_map(function ($preuve) {
                return [
                    'id' => $preuve->getId(),
                    'type' => $preuve->getType(),
                    'fichier' => $preuve->getFichier(),
                    'description' => $preuve->getDescription(),
                    'createdAt' => $preuve->getCreatedAt()?->format('Y-m-d H:i:s'),
                ];
            }, $preuves);

            return [
                'id' => $capture->getId(),
                'bandit' => [
                    'id' => $capture->getBandit()->getId(),
                    'nom' => $capture->getBandit()->getNom(),
                    'surnom' => $capture->getBandit()->getSurnom(),
                    'photo' => $capture->getBandit()->getPhoto(),
                ],
                'opj' => [
                    'id' => $capture->getOpj()->getId(),
                    'nom' => $capture->getOpj()->getNom(),
                    'prenom' => $capture->getOpj()->getPrenom(),
                    'matricule' => $capture->getOpj()->getMatricule(),
                ],
                'dateCapture' => $capture->getDateCapture()?->format('Y-m-d H:i:s'),
                'dateCaptureFormatted' => $formattedDateCapture,
                'lieuCapture' => $capture->getLieuCapture(),
                'commentaire' => $capture->getCommentaire(),
                'preuves' => $preuvesData,
                'createdAt' => $formattedDate,
            ];
        }, $captures);

        return new JsonResponse($capturesData);
    }

    #[Route('', name: 'api_captures_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        // Vérifier que l'utilisateur est authentifié
        $this->denyAccessUnlessGranted('ROLE_OPJ');

        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return new JsonResponse([
                'message' => 'Données JSON invalides',
            ], Response::HTTP_BAD_REQUEST);
        }

        // Récupérer l'utilisateur connecté
        $user = $this->getUser();
        if (!$user) {
            return new JsonResponse([
                'message' => 'Utilisateur non authentifié',
            ], Response::HTTP_UNAUTHORIZED);
        }

        // Récupérer le bandit
        $bandit = $this->banditRepository->find($data['banditId'] ?? 0);
        if (!$bandit) {
            return new JsonResponse([
                'message' => 'Bandit non trouvé',
            ], Response::HTTP_BAD_REQUEST);
        }

        $capture = new Capture();
        $capture
            ->setBandit($bandit)
            ->setOpj($user)
            ->setLieuCapture($data['lieuCapture'] ?? '')
            ->setCommentaire($data['commentaire'] ?? null);

        // Gérer la date de capture
        if (!empty($data['dateCapture'])) {
            try {
                $dateCapture = new \DateTime($data['dateCapture']);
                $capture->setDateCapture($dateCapture);
            } catch (\Exception $e) {
                return new JsonResponse([
                    'message' => 'Format de date invalide',
                ], Response::HTTP_BAD_REQUEST);
            }
        } else {
            $capture->setDateCapture(new \DateTime());
        }

        // Valider l'entité
        $errors = $this->validator->validate($capture);
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

        $this->em->persist($capture);
        $this->em->flush();

        $createdAt = $capture->getCreatedAt();
        $formattedDate = $createdAt ? $createdAt->format('d M Y') : '';
        
        $months = [
            'Jan' => 'Jan', 'Feb' => 'Fév', 'Mar' => 'Mar', 'Apr' => 'Avr',
            'May' => 'Mai', 'Jun' => 'Jun', 'Jul' => 'Jul', 'Aug' => 'Aoû',
            'Sep' => 'Sep', 'Oct' => 'Oct', 'Nov' => 'Nov', 'Dec' => 'Déc'
        ];
        foreach ($months as $en => $fr) {
            $formattedDate = str_replace($en, $fr, $formattedDate);
        }

        $dateCapture = $capture->getDateCapture();
        $formattedDateCapture = $dateCapture ? $dateCapture->format('d M Y à H:i') : '';
        foreach ($months as $en => $fr) {
            $formattedDateCapture = str_replace($en, $fr, $formattedDateCapture);
        }

        return new JsonResponse([
            'message' => 'Capture créée avec succès',
            'capture' => [
                'id' => $capture->getId(),
                'bandit' => [
                    'id' => $capture->getBandit()->getId(),
                    'nom' => $capture->getBandit()->getNom(),
                    'surnom' => $capture->getBandit()->getSurnom(),
                    'photo' => $capture->getBandit()->getPhoto(),
                ],
                'opj' => [
                    'id' => $capture->getOpj()->getId(),
                    'nom' => $capture->getOpj()->getNom(),
                    'prenom' => $capture->getOpj()->getPrenom(),
                    'matricule' => $capture->getOpj()->getMatricule(),
                ],
                'dateCapture' => $capture->getDateCapture()?->format('Y-m-d H:i:s'),
                'dateCaptureFormatted' => $formattedDateCapture,
                'lieuCapture' => $capture->getLieuCapture(),
                'commentaire' => $capture->getCommentaire(),
                'createdAt' => $formattedDate,
            ],
        ], Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'api_captures_detail', methods: ['GET'])]
    public function detail(int $id): JsonResponse
    {
        // Vérifier que l'utilisateur est authentifié
        $this->denyAccessUnlessGranted('ROLE_OPJ');

        $capture = $this->captureRepository->find($id);
        if (!$capture) {
            return new JsonResponse([
                'message' => 'Capture non trouvée',
            ], Response::HTTP_NOT_FOUND);
        }

        $createdAt = $capture->getCreatedAt();
        $formattedDate = $createdAt ? $createdAt->format('d M Y') : '';
        
        $months = [
            'Jan' => 'Jan', 'Feb' => 'Fév', 'Mar' => 'Mar', 'Apr' => 'Avr',
            'May' => 'Mai', 'Jun' => 'Jun', 'Jul' => 'Jul', 'Aug' => 'Aoû',
            'Sep' => 'Sep', 'Oct' => 'Oct', 'Nov' => 'Nov', 'Dec' => 'Déc'
        ];
        foreach ($months as $en => $fr) {
            $formattedDate = str_replace($en, $fr, $formattedDate);
        }

        $dateCapture = $capture->getDateCapture();
        $formattedDateCapture = $dateCapture ? $dateCapture->format('d M Y à H:i') : '';
        foreach ($months as $en => $fr) {
            $formattedDateCapture = str_replace($en, $fr, $formattedDateCapture);
        }

        // Récupérer les preuves
        $preuves = $this->preuveRepository->findBy(['capture' => $capture]);
        $preuvesData = array_map(function ($preuve) {
            return [
                'id' => $preuve->getId(),
                'type' => $preuve->getType(),
                'fichier' => $preuve->getFichier(),
                'description' => $preuve->getDescription(),
                'createdAt' => $preuve->getCreatedAt()?->format('Y-m-d H:i:s'),
            ];
        }, $preuves);

        return new JsonResponse([
            'id' => $capture->getId(),
            'bandit' => [
                'id' => $capture->getBandit()->getId(),
                'nom' => $capture->getBandit()->getNom(),
                'surnom' => $capture->getBandit()->getSurnom(),
                'photo' => $capture->getBandit()->getPhoto(),
            ],
            'opj' => [
                'id' => $capture->getOpj()->getId(),
                'nom' => $capture->getOpj()->getNom(),
                'prenom' => $capture->getOpj()->getPrenom(),
                'matricule' => $capture->getOpj()->getMatricule(),
            ],
            'dateCapture' => $capture->getDateCapture()?->format('Y-m-d H:i:s'),
            'dateCaptureFormatted' => $formattedDateCapture,
            'lieuCapture' => $capture->getLieuCapture(),
            'commentaire' => $capture->getCommentaire(),
            'preuves' => $preuvesData,
            'createdAt' => $formattedDate,
        ]);
    }
}

