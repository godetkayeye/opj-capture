<?php

namespace App\EventListener;

use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

#[AsEventListener(event: KernelEvents::REQUEST, priority: 100)]
class CorsListener
{
    public function onKernelRequest(RequestEvent $event): void
    {
        // Ne traiter que les requêtes OPTIONS (preflight CORS)
        if (!$event->isMainRequest() || $event->getRequest()->getMethod() !== 'OPTIONS') {
            return;
        }

        $request = $event->getRequest();
        $origin = $request->headers->get('Origin');

        // Autoriser uniquement les origines autorisées
        $allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
        
        if (!in_array($origin, $allowedOrigins, true)) {
            return;
        }

        // Créer une réponse pour la requête OPTIONS
        $response = new Response();
        $response->headers->set('Access-Control-Allow-Origin', $origin);
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        $response->headers->set('Access-Control-Allow-Credentials', 'true');
        $response->headers->set('Access-Control-Max-Age', '3600');
        $response->setStatusCode(Response::HTTP_NO_CONTENT);

        $event->setResponse($response);
    }
}

