<?php

use App\Kernel;

require_once dirname(__DIR__).'/vendor/autoload_runtime.php';

// Configurer le répertoire de sessions avant que Symfony ne démarre
$sessionPath = dirname(__DIR__) . '/var/sessions';
if (!is_dir($sessionPath)) {
    mkdir($sessionPath, 0777, true);
}
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.save_path', $sessionPath);
}

return function (array $context) {
    return new Kernel($context['APP_ENV'], (bool) $context['APP_DEBUG']);
};
