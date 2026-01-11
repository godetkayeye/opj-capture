<?php

namespace App\Controller;

use App\Entity\Infraction;
use App\Repository\InfractionRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/infractions')]
class InfractionController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly InfractionRepository $infractionRepository,
        private readonly ValidatorInterface $validator,
    ) {
    }

    #[Route('', name: 'api_infractions_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        // Vérifier que l'utilisateur est authentifié
        $this->denyAccessUnlessGranted('ROLE_OPJ');

        $infractions = $this->infractionRepository->findAll();

        $infractionsData = array_map(function (Infraction $infraction) {
            $createdAt = $infraction->getCreatedAt();
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
                'id' => $infraction->getId(),
                'libelle' => $infraction->getLibelle(),
                'description' => $infraction->getDescription(),
                'createdAt' => $formattedDate,
                'isApproved' => $infraction->isApproved(),
                'approvedBy' => $infraction->getApprovedBy() ? [
                    'id' => $infraction->getApprovedBy()->getId(),
                    'nom' => $infraction->getApprovedBy()->getNom(),
                    'prenom' => $infraction->getApprovedBy()->getPrenom(),
                ] : null,
                'approvedAt' => $infraction->getApprovedAt()?->format('Y-m-d H:i:s'),
            ];
        }, $infractions);

        return new JsonResponse($infractionsData);
    }

    #[Route('', name: 'api_infractions_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        // Vérifier que l'utilisateur est un superviseur ou admin
        $this->denyAccessUnlessGranted('ROLE_SUPERVISEUR');

        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return new JsonResponse([
                'message' => 'Données JSON invalides',
            ], Response::HTTP_BAD_REQUEST);
        }

        $infraction = new Infraction();
        $infraction->setLibelle($data['libelle'] ?? '');
        $infraction->setDescription($data['description'] ?? null);

        // Valider l'entité
        $errors = $this->validator->validate($infraction);
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

        $this->em->persist($infraction);
        $this->em->flush();

        $createdAt = $infraction->getCreatedAt();
        $formattedDate = $createdAt ? $createdAt->format('d M Y') : '';
        
        $months = [
            'Jan' => 'Jan', 'Feb' => 'Fév', 'Mar' => 'Mar', 'Apr' => 'Avr',
            'May' => 'Mai', 'Jun' => 'Jun', 'Jul' => 'Jul', 'Aug' => 'Aoû',
            'Sep' => 'Sep', 'Oct' => 'Oct', 'Nov' => 'Nov', 'Dec' => 'Déc'
        ];
        foreach ($months as $en => $fr) {
            $formattedDate = str_replace($en, $fr, $formattedDate);
        }

        return new JsonResponse([
            'message' => 'Infraction créée avec succès',
            'infraction' => [
                'id' => $infraction->getId(),
                'libelle' => $infraction->getLibelle(),
                'description' => $infraction->getDescription(),
                'createdAt' => $formattedDate,
            ],
        ], Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'api_infractions_update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        // Vérifier que l'utilisateur est un superviseur ou admin
        $this->denyAccessUnlessGranted('ROLE_SUPERVISEUR');

        $infraction = $this->infractionRepository->find($id);
        if (!$infraction) {
            return new JsonResponse([
                'message' => 'Infraction non trouvée',
            ], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return new JsonResponse([
                'message' => 'Données JSON invalides',
            ], Response::HTTP_BAD_REQUEST);
        }

        $infraction->setLibelle($data['libelle'] ?? $infraction->getLibelle());
        $infraction->setDescription($data['description'] ?? $infraction->getDescription());

        // Valider l'entité
        $errors = $this->validator->validate($infraction);
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

        $createdAt = $infraction->getCreatedAt();
        $formattedDate = $createdAt ? $createdAt->format('d M Y') : '';
        
        $months = [
            'Jan' => 'Jan', 'Feb' => 'Fév', 'Mar' => 'Mar', 'Apr' => 'Avr',
            'May' => 'Mai', 'Jun' => 'Jun', 'Jul' => 'Jul', 'Aug' => 'Aoû',
            'Sep' => 'Sep', 'Oct' => 'Oct', 'Nov' => 'Nov', 'Dec' => 'Déc'
        ];
        foreach ($months as $en => $fr) {
            $formattedDate = str_replace($en, $fr, $formattedDate);
        }

        return new JsonResponse([
            'message' => 'Infraction modifiée avec succès',
            'infraction' => [
                'id' => $infraction->getId(),
                'libelle' => $infraction->getLibelle(),
                'description' => $infraction->getDescription(),
                'createdAt' => $formattedDate,
            ],
        ]);
    }

    #[Route('/{id}', name: 'api_infractions_delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        // Vérifier que l'utilisateur est un admin
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $infraction = $this->infractionRepository->find($id);
        if (!$infraction) {
            return new JsonResponse([
                'message' => 'Infraction non trouvée',
            ], Response::HTTP_NOT_FOUND);
        }

        // Vérifier si l'infraction est utilisée par des bandits
        if ($infraction->getBandits()->count() > 0) {
            return new JsonResponse([
                'message' => 'Impossible de supprimer cette infraction car elle est associée à des bandits',
            ], Response::HTTP_BAD_REQUEST);
        }

        $this->em->remove($infraction);
        $this->em->flush();

        return new JsonResponse([
            'message' => 'Infraction supprimée avec succès',
        ]);
    }

    #[Route('/{id}/approve', name: 'api_infractions_approve', methods: ['POST'])]
    public function approve(int $id): JsonResponse
    {
        // Vérifier que l'utilisateur est un superviseur ou admin
        $this->denyAccessUnlessGranted('ROLE_SUPERVISEUR');

        $infraction = $this->infractionRepository->find($id);
        if (!$infraction) {
            return new JsonResponse([
                'message' => 'Infraction non trouvée',
            ], Response::HTTP_NOT_FOUND);
        }

        $infraction->setApproved(true);
        $infraction->setApprovedBy($this->getUser());
        $infraction->setApprovedAt(new \DateTime());

        $this->em->flush();

        return new JsonResponse([
            'message' => 'Infraction approuvée avec succès',
            'infraction' => [
                'id' => $infraction->getId(),
                'libelle' => $infraction->getLibelle(),
                'isApproved' => $infraction->isApproved(),
                'approvedBy' => $infraction->getApprovedBy() ? [
                    'id' => $infraction->getApprovedBy()->getId(),
                    'nom' => $infraction->getApprovedBy()->getNom(),
                    'prenom' => $infraction->getApprovedBy()->getPrenom(),
                ] : null,
                'approvedAt' => $infraction->getApprovedAt()?->format('Y-m-d H:i:s'),
            ],
        ]);
    }

    #[Route('/{id}/reject', name: 'api_infractions_reject', methods: ['POST'])]
    public function reject(int $id): JsonResponse
    {
        // Vérifier que l'utilisateur est un superviseur ou admin
        $this->denyAccessUnlessGranted('ROLE_SUPERVISEUR');

        $infraction = $this->infractionRepository->find($id);
        if (!$infraction) {
            return new JsonResponse([
                'message' => 'Infraction non trouvée',
            ], Response::HTTP_NOT_FOUND);
        }

        $infraction->setApproved(false);
        $infraction->setApprovedBy(null);
        $infraction->setApprovedAt(null);

        $this->em->flush();

        return new JsonResponse([
            'message' => 'Infraction rejetée avec succès',
            'infraction' => [
                'id' => $infraction->getId(),
                'libelle' => $infraction->getLibelle(),
                'isApproved' => $infraction->isApproved(),
                'approvedBy' => null,
                'approvedAt' => null,
            ],
        ]);
    }
}
