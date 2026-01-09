<?php

namespace App\Entity;

use App\Repository\PreuveRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: PreuveRepository::class)]
#[ORM\Table(name: 'preuves')]
class Preuve
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Capture::class, inversedBy: 'preuves')]
    #[ORM\JoinColumn(name: 'capture_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?Capture $capture = null;

    /**
     * Colonne ENUM côté base, mappée ici comme string simple.
     * Valeurs possibles: PHOTO, PDF, VIDEO.
     */
    #[ORM\Column(length: 20)]
    private ?string $type = null;

    #[ORM\Column(type: 'text')]
    private ?string $fichier = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $description = null;

    #[ORM\Column(type: 'datetime', options: ['default' => 'CURRENT_TIMESTAMP'])]
    private ?\DateTimeInterface $createdAt = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCapture(): ?Capture
    {
        return $this->capture;
    }

    public function setCapture(?Capture $capture): self
    {
        $this->capture = $capture;

        return $this;
    }

    public function getType(): ?string
    {
        return $this->type;
    }

    public function setType(string $type): self
    {
        $this->type = $type;

        return $this;
    }

    public function getFichier(): ?string
    {
        return $this->fichier;
    }

    public function setFichier(string $fichier): self
    {
        $this->fichier = $fichier;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): self
    {
        $this->description = $description;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeInterface
    {
        return $this->createdAt;
    }

    public function setCreatedAt(?\DateTimeInterface $createdAt): self
    {
        $this->createdAt = $createdAt;

        return $this;
    }
}


