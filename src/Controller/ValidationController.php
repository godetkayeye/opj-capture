<?php

namespace App\Controller;

use App\Entity\Validation;
use App\Entity\Capture;
use App\Repository\ValidationRepository;
use App\Repository\CaptureRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/validations')]
class ValidationController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly ValidationRepository $validationRepository,
        private readonly CaptureRepository $captureRepository,
        private readonly ValidatorInterface $validator,
    ) {
    }

    #[Route('', name: 'api_validations_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        // Vérifier que l'utilisateur est authentifié
        $this->denyAccessUnlessGranted('ROLE_OPJ');

        $statutFilter = $request->query->get('statut', 'all');
        
        if ($statutFilter === 'all') {
            $validations = $this->validationRepository->findAll();
        } else {
            $validations = $this->validationRepository->findBy(['statut' => $statutFilter]);
        }

        $validationsData = array_map(function (Validation $validation) {
            $createdAt = $validation->getCreatedAt();
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

            $dateValidation = $validation->getDateValidation();
            $formattedDateValidation = $dateValidation ? $dateValidation->format('d M Y à H:i') : '';
            foreach ($months as $en => $fr) {
                $formattedDateValidation = str_replace($en, $fr, $formattedDateValidation);
            }

            $capture = $validation->getCapture();
            $dateCapture = $capture->getDateCapture();
            $formattedDateCapture = $dateCapture ? $dateCapture->format('d M Y à H:i') : '';
            foreach ($months as $en => $fr) {
                $formattedDateCapture = str_replace($en, $fr, $formattedDateCapture);
            }

            return [
                'id' => $validation->getId(),
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
                ],
                'superviseur' => [
                    'id' => $validation->getSuperviseur()->getId(),
                    'nom' => $validation->getSuperviseur()->getNom(),
                    'prenom' => $validation->getSuperviseur()->getPrenom(),
                    'matricule' => $validation->getSuperviseur()->getMatricule(),
                ],
                'statut' => $validation->getStatut(),
                'remarque' => $validation->getRemarque(),
                'dateValidation' => $validation->getDateValidation()?->format('Y-m-d H:i:s'),
                'dateValidationFormatted' => $formattedDateValidation,
                'createdAt' => $formattedDate,
            ];
        }, $validations);

        return new JsonResponse($validationsData);
    }

    #[Route('/capture/{captureId}', name: 'api_validations_create', methods: ['POST'])]
    public function create(int $captureId, Request $request): JsonResponse
    {
        // Vérifier que l'utilisateur est un superviseur ou admin
        $this->denyAccessUnlessGranted('ROLE_SUPERVISEUR');

        $capture = $this->captureRepository->find($captureId);
        if (!$capture) {
            return new JsonResponse([
                'message' => 'Capture non trouvée',
            ], Response::HTTP_NOT_FOUND);
        }

        // Vérifier si une validation existe déjà pour cette capture
        $existingValidation = $this->validationRepository->findOneBy(['capture' => $capture]);
        if ($existingValidation) {
            return new JsonResponse([
                'message' => 'Une validation existe déjà pour cette capture',
            ], Response::HTTP_BAD_REQUEST);
        }

        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return new JsonResponse([
                'message' => 'Données JSON invalides',
            ], Response::HTTP_BAD_REQUEST);
        }

        // Récupérer l'utilisateur connecté (superviseur)
        $user = $this->getUser();
        if (!$user) {
            return new JsonResponse([
                'message' => 'Utilisateur non authentifié',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $validation = new Validation();
        $validation
            ->setCapture($capture)
            ->setSuperviseur($user)
            ->setStatut($data['statut'] ?? 'EN_ATTENTE')
            ->setRemarque($data['remarque'] ?? null);

        // Si la validation est validée ou rejetée, définir la date de validation
        if (in_array($validation->getStatut(), ['VALIDEE', 'REJETEE'], true)) {
            $validation->setDateValidation(new \DateTime());
        }

        // Valider l'entité
        $errors = $this->validator->validate($validation);
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

        $this->em->persist($validation);
        $this->em->flush();

        $createdAt = $validation->getCreatedAt();
        $formattedDate = $createdAt ? $createdAt->format('d M Y') : '';
        
        $months = [
            'Jan' => 'Jan', 'Feb' => 'Fév', 'Mar' => 'Mar', 'Apr' => 'Avr',
            'May' => 'Mai', 'Jun' => 'Jun', 'Jul' => 'Jul', 'Aug' => 'Aoû',
            'Sep' => 'Sep', 'Oct' => 'Oct', 'Nov' => 'Nov', 'Dec' => 'Déc'
        ];
        foreach ($months as $en => $fr) {
            $formattedDate = str_replace($en, $fr, $formattedDate);
        }

        $dateValidation = $validation->getDateValidation();
        $formattedDateValidation = $dateValidation ? $dateValidation->format('d M Y à H:i') : '';
        foreach ($months as $en => $fr) {
            $formattedDateValidation = str_replace($en, $fr, $formattedDateValidation);
        }

        return new JsonResponse([
            'message' => 'Validation créée avec succès',
            'validation' => [
                'id' => $validation->getId(),
                'statut' => $validation->getStatut(),
                'remarque' => $validation->getRemarque(),
                'dateValidation' => $validation->getDateValidation()?->format('Y-m-d H:i:s'),
                'dateValidationFormatted' => $formattedDateValidation,
                'createdAt' => $formattedDate,
            ],
        ], Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'api_validations_update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        // Vérifier que l'utilisateur est un superviseur ou admin
        $this->denyAccessUnlessGranted('ROLE_SUPERVISEUR');

        $validation = $this->validationRepository->find($id);
        if (!$validation) {
            return new JsonResponse([
                'message' => 'Validation non trouvée',
            ], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return new JsonResponse([
                'message' => 'Données JSON invalides',
            ], Response::HTTP_BAD_REQUEST);
        }

        // Mettre à jour le statut
        if (isset($data['statut'])) {
            $validation->setStatut($data['statut']);
            
            // Si la validation est validée ou rejetée, définir la date de validation
            if (in_array($validation->getStatut(), ['VALIDEE', 'REJETEE'], true)) {
                $validation->setDateValidation(new \DateTime());
            } else {
                $validation->setDateValidation(null);
            }
        }

        // Mettre à jour la remarque
        if (isset($data['remarque'])) {
            $validation->setRemarque($data['remarque'] ?? null);
        }

        // Valider l'entité
        $errors = $this->validator->validate($validation);
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

        $this->em->flush();

        $createdAt = $validation->getCreatedAt();
        $formattedDate = $createdAt ? $createdAt->format('d M Y') : '';
        
        $months = [
            'Jan' => 'Jan', 'Feb' => 'Fév', 'Mar' => 'Mar', 'Apr' => 'Avr',
            'May' => 'Mai', 'Jun' => 'Jun', 'Jul' => 'Jul', 'Aug' => 'Aoû',
            'Sep' => 'Sep', 'Oct' => 'Oct', 'Nov' => 'Nov', 'Dec' => 'Déc'
        ];
        foreach ($months as $en => $fr) {
            $formattedDate = str_replace($en, $fr, $formattedDate);
        }

        $dateValidation = $validation->getDateValidation();
        $formattedDateValidation = $dateValidation ? $dateValidation->format('d M Y à H:i') : '';
        foreach ($months as $en => $fr) {
            $formattedDateValidation = str_replace($en, $fr, $formattedDateValidation);
        }

        return new JsonResponse([
            'message' => 'Validation modifiée avec succès',
            'validation' => [
                'id' => $validation->getId(),
                'statut' => $validation->getStatut(),
                'remarque' => $validation->getRemarque(),
                'dateValidation' => $validation->getDateValidation()?->format('Y-m-d H:i:s'),
                'dateValidationFormatted' => $formattedDateValidation,
                'createdAt' => $formattedDate,
            ],
        ]);
    }

    #[Route('/capture/{captureId}', name: 'api_validations_by_capture', methods: ['GET'])]
    public function getByCapture(int $captureId): JsonResponse
    {
        // Vérifier que l'utilisateur est authentifié
        $this->denyAccessUnlessGranted('ROLE_OPJ');

        $capture = $this->captureRepository->find($captureId);
        if (!$capture) {
            return new JsonResponse([
                'message' => 'Capture non trouvée',
            ], Response::HTTP_NOT_FOUND);
        }

        $validation = $this->validationRepository->findOneBy(['capture' => $capture]);

        if (!$validation) {
            return new JsonResponse(null, Response::HTTP_NOT_FOUND);
        }

        $createdAt = $validation->getCreatedAt();
        $formattedDate = $createdAt ? $createdAt->format('d M Y') : '';
        
        $months = [
            'Jan' => 'Jan', 'Feb' => 'Fév', 'Mar' => 'Mar', 'Apr' => 'Avr',
            'May' => 'Mai', 'Jun' => 'Jun', 'Jul' => 'Jul', 'Aug' => 'Aoû',
            'Sep' => 'Sep', 'Oct' => 'Oct', 'Nov' => 'Nov', 'Dec' => 'Déc'
        ];
        foreach ($months as $en => $fr) {
            $formattedDate = str_replace($en, $fr, $formattedDate);
        }

        $dateValidation = $validation->getDateValidation();
        $formattedDateValidation = $dateValidation ? $dateValidation->format('d M Y à H:i') : '';
        foreach ($months as $en => $fr) {
            $formattedDateValidation = str_replace($en, $fr, $formattedDateValidation);
        }

        return new JsonResponse([
            'id' => $validation->getId(),
            'statut' => $validation->getStatut(),
            'remarque' => $validation->getRemarque(),
            'dateValidation' => $validation->getDateValidation()?->format('Y-m-d H:i:s'),
            'dateValidationFormatted' => $formattedDateValidation,
            'superviseur' => [
                'id' => $validation->getSuperviseur()->getId(),
                'nom' => $validation->getSuperviseur()->getNom(),
                'prenom' => $validation->getSuperviseur()->getPrenom(),
                'matricule' => $validation->getSuperviseur()->getMatricule(),
            ],
            'createdAt' => $formattedDate,
        ]);
    }
}

