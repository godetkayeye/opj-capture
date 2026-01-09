<?php

namespace App\EventListener;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

class SessionListener implements EventSubscriberInterface
{
    private string $projectDir;
    private static bool $configured = false;

    public function __construct(string $projectDir)
    {
        $this->projectDir = $projectDir;
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => ['onKernelRequest', 1024],
        ];
    }

    public function onKernelRequest(RequestEvent $event): void
    {
        // Le répertoire de sessions est maintenant configuré dans public/index.php
        // Ce listener n'est plus nécessaire mais on le garde pour s'assurer que le répertoire existe
        $sessionPath = $this->projectDir . '/var/sessions';
        if (!is_dir($sessionPath)) {
            mkdir($sessionPath, 0777, true);
        }
    }
}

