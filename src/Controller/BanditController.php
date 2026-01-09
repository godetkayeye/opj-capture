<?php

namespace App\Controller;

use App\Entity\Bandit;
use App\Repository\BanditRepository;
use App\Repository\InfractionRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/bandits')]
class BanditController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly BanditRepository $banditRepository,
        private readonly InfractionRepository $infractionRepository,
        private readonly ValidatorInterface $validator,
    ) {
    }

    #[Route('', name: 'api_bandits_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        // Vérifier que l'utilisateur est authentifié
        $this->denyAccessUnlessGranted('ROLE_OPJ');

        $bandits = $this->banditRepository->findAll();

        $banditsData = array_map(function (Bandit $bandit) {
            $infractions = [];
            foreach ($bandit->getInfractions() as $infraction) {
                $infractions[] = [
                    'id' => $infraction->getId(),
                    'libelle' => $infraction->getLibelle(),
                ];
            }

            $createdAt = $bandit->getCreatedAt();
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
                'id' => $bandit->getId(),
                'nom' => $bandit->getNom(),
                'surnom' => $bandit->getSurnom(),
                'dateNaissance' => $bandit->getDateNaissance()?->format('Y-m-d'),
                'sexe' => $bandit->getSexe(),
                'photo' => $bandit->getPhoto(),
                'etat' => $bandit->getEtat(),
                'infractions' => $infractions,
                'createdAt' => $formattedDate,
            ];
        }, $bandits);

        return new JsonResponse($banditsData);
    }

    #[Route('', name: 'api_bandits_create', methods: ['POST'])]
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

        $bandit = new Bandit();
        $bandit
            ->setNom($data['nom'] ?? '')
            ->setSurnom($data['surnom'] ?? null)
            ->setSexe($data['sexe'] ?? 'M')
            ->setEtat($data['etat'] ?? 'CAPTURE');

        // Gérer la photo (base64 string)
        if (!empty($data['photo'])) {
            // Pour l'instant, on stocke directement la chaîne base64
            // Plus tard, on pourra implémenter un système de stockage de fichiers
            $bandit->setPhoto($data['photo']);
        }

        // Gérer la date de naissance
        if (!empty($data['dateNaissance'])) {
            try {
                $dateNaissance = new \DateTime($data['dateNaissance']);
                $bandit->setDateNaissance($dateNaissance);
            } catch (\Exception $e) {
                return new JsonResponse([
                    'message' => 'Format de date invalide',
                ], Response::HTTP_BAD_REQUEST);
            }
        }

        // Gérer les infractions
        if (!empty($data['infractions']) && is_array($data['infractions'])) {
            foreach ($data['infractions'] as $infractionId) {
                $infraction = $this->infractionRepository->find($infractionId);
                if ($infraction) {
                    $bandit->addInfraction($infraction);
                }
            }
        }

        // Valider l'entité
        $errors = $this->validator->validate($bandit);
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

        $this->em->persist($bandit);
        $this->em->flush();

        // Récupérer les infractions pour la réponse
        $infractionsData = [];
        foreach ($bandit->getInfractions() as $infraction) {
            $infractionsData[] = [
                'id' => $infraction->getId(),
                'libelle' => $infraction->getLibelle(),
            ];
        }

        return new JsonResponse([
            'message' => 'Bandit créé avec succès',
            'bandit' => [
                'id' => $bandit->getId(),
                'nom' => $bandit->getNom(),
                'surnom' => $bandit->getSurnom(),
                'dateNaissance' => $bandit->getDateNaissance()?->format('Y-m-d'),
                'sexe' => $bandit->getSexe(),
                'photo' => $bandit->getPhoto(),
                'etat' => $bandit->getEtat(),
                'infractions' => $infractionsData,
                'createdAt' => $bandit->getCreatedAt()?->format('d M Y'),
            ],
        ], Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'api_bandits_update', methods: ['PUT'])]
    public function update(int $id, Request $request): JsonResponse
    {
        // Vérifier que l'utilisateur est authentifié
        $this->denyAccessUnlessGranted('ROLE_OPJ');

        $bandit = $this->banditRepository->find($id);
        if (!$bandit) {
            return new JsonResponse([
                'message' => 'Bandit non trouvé',
            ], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return new JsonResponse([
                'message' => 'Données JSON invalides',
            ], Response::HTTP_BAD_REQUEST);
        }

        // Mettre à jour les champs
        if (isset($data['nom'])) {
            $bandit->setNom($data['nom']);
        }
        if (isset($data['surnom'])) {
            $bandit->setSurnom($data['surnom'] ?? null);
        }
        if (isset($data['sexe'])) {
            $bandit->setSexe($data['sexe']);
        }
        if (isset($data['etat'])) {
            $bandit->setEtat($data['etat']);
        }

        // Gérer la photo
        if (isset($data['photo'])) {
            $bandit->setPhoto($data['photo'] ?? null);
        }

        // Gérer la date de naissance
        if (isset($data['dateNaissance'])) {
            if (!empty($data['dateNaissance'])) {
                try {
                    $dateNaissance = new \DateTime($data['dateNaissance']);
                    $bandit->setDateNaissance($dateNaissance);
                } catch (\Exception $e) {
                    return new JsonResponse([
                        'message' => 'Format de date invalide',
                    ], Response::HTTP_BAD_REQUEST);
                }
            } else {
                $bandit->setDateNaissance(null);
            }
        }

        // Gérer les infractions
        if (isset($data['infractions']) && is_array($data['infractions'])) {
            // Supprimer toutes les infractions existantes
            foreach ($bandit->getInfractions() as $infraction) {
                $bandit->removeInfraction($infraction);
            }
            // Ajouter les nouvelles infractions
            foreach ($data['infractions'] as $infractionId) {
                $infraction = $this->infractionRepository->find($infractionId);
                if ($infraction) {
                    $bandit->addInfraction($infraction);
                }
            }
        }

        // Valider l'entité
        $errors = $this->validator->validate($bandit);
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

        // Récupérer les infractions pour la réponse
        $infractionsData = [];
        foreach ($bandit->getInfractions() as $infraction) {
            $infractionsData[] = [
                'id' => $infraction->getId(),
                'libelle' => $infraction->getLibelle(),
            ];
        }

        $createdAt = $bandit->getCreatedAt();
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

        return new JsonResponse([
            'message' => 'Bandit modifié avec succès',
            'bandit' => [
                'id' => $bandit->getId(),
                'nom' => $bandit->getNom(),
                'surnom' => $bandit->getSurnom(),
                'dateNaissance' => $bandit->getDateNaissance()?->format('Y-m-d'),
                'sexe' => $bandit->getSexe(),
                'photo' => $bandit->getPhoto(),
                'etat' => $bandit->getEtat(),
                'infractions' => $infractionsData,
                'createdAt' => $formattedDate,
            ],
        ]);
    }
}

