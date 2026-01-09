<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Authentication\AuthenticationUtils;

#[Route('/api')]
class SecurityController extends AbstractController
{
    #[Route('/login', name: 'api_login', methods: ['POST', 'OPTIONS'])]
    public function login(Request $request): JsonResponse
    {
        // Gérer les requêtes OPTIONS (preflight CORS)
        if ($request->getMethod() === 'OPTIONS') {
            return new JsonResponse([], Response::HTTP_NO_CONTENT);
        }

        // Cette méthode ne sera normalement jamais appelée pour POST
        // car json_login intercepte la requête avant
        // Mais elle doit exister pour que la route soit reconnue
        // Si on arrive ici, c'est qu'il y a un problème de configuration
        return new JsonResponse([
            'message' => 'Login endpoint - handled by json_login'
        ], Response::HTTP_OK);
    }

    #[Route('/logout', name: 'api_logout', methods: ['POST', 'OPTIONS'])]
    public function logout(): JsonResponse
    {
        // La déconnexion est gérée par le firewall
        return new JsonResponse(['message' => 'Logged out successfully']);
    }
}

