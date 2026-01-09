<?php

namespace App\Controller;

use App\Entity\Preuve;
use App\Entity\Capture;
use App\Repository\PreuveRepository;
use App\Repository\CaptureRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/preuves')]
class PreuveController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly PreuveRepository $preuveRepository,
        private readonly CaptureRepository $captureRepository,
        private readonly ValidatorInterface $validator,
    ) {
    }

    #[Route('/capture/{captureId}', name: 'api_preuves_by_capture', methods: ['GET'])]
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

        $preuves = $this->preuveRepository->findBy(['capture' => $capture]);

        $preuvesData = array_map(function (Preuve $preuve) {
            return [
                'id' => $preuve->getId(),
                'type' => $preuve->getType(),
                'fichier' => $preuve->getFichier(),
                'description' => $preuve->getDescription(),
                'createdAt' => $preuve->getCreatedAt()?->format('Y-m-d H:i:s'),
            ];
        }, $preuves);

        return new JsonResponse($preuvesData);
    }

    #[Route('/capture/{captureId}', name: 'api_preuves_create', methods: ['POST'])]
    public function create(int $captureId, Request $request): JsonResponse
    {
        // Vérifier que l'utilisateur est authentifié
        $this->denyAccessUnlessGranted('ROLE_OPJ');

        $capture = $this->captureRepository->find($captureId);
        if (!$capture) {
            return new JsonResponse([
                'message' => 'Capture non trouvée',
            ], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return new JsonResponse([
                'message' => 'Données JSON invalides',
            ], Response::HTTP_BAD_REQUEST);
        }

        // Vérifier que le fichier est fourni
        if (empty($data['fichier'])) {
            return new JsonResponse([
                'message' => 'Le fichier est requis',
            ], Response::HTTP_BAD_REQUEST);
        }

        // Vérifier que le type est valide
        $validTypes = ['PHOTO', 'PDF', 'VIDEO'];
        $type = $data['type'] ?? 'PHOTO';
        if (!in_array($type, $validTypes, true)) {
            return new JsonResponse([
                'message' => 'Type de preuve invalide. Types acceptés: PHOTO, PDF, VIDEO',
            ], Response::HTTP_BAD_REQUEST);
        }

        $preuve = new Preuve();
        $preuve
            ->setCapture($capture)
            ->setType($type)
            ->setFichier($data['fichier'])
            ->setDescription($data['description'] ?? null);

        // Valider l'entité
        $errors = $this->validator->validate($preuve);
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

        try {
            $this->em->persist($preuve);
            $this->em->flush();
        } catch (\Exception $e) {
            return new JsonResponse([
                'message' => 'Erreur lors de l\'enregistrement de la preuve',
                'error' => $e->getMessage(),
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        return new JsonResponse([
            'message' => 'Preuve créée avec succès',
            'preuve' => [
                'id' => $preuve->getId(),
                'type' => $preuve->getType(),
                'fichier' => $preuve->getFichier(),
                'description' => $preuve->getDescription(),
                'createdAt' => $preuve->getCreatedAt()?->format('Y-m-d H:i:s'),
            ],
        ], Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'api_preuves_delete', methods: ['DELETE'])]
    public function delete(int $id): JsonResponse
    {
        // Vérifier que l'utilisateur est authentifié
        $this->denyAccessUnlessGranted('ROLE_OPJ');

        $preuve = $this->preuveRepository->find($id);
        if (!$preuve) {
            return new JsonResponse([
                'message' => 'Preuve non trouvée',
            ], Response::HTTP_NOT_FOUND);
        }

        $this->em->remove($preuve);
        $this->em->flush();

        return new JsonResponse([
            'message' => 'Preuve supprimée avec succès',
        ]);
    }
}

