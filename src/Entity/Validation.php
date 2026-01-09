<?php

namespace App\Entity;

use App\Repository\ValidationRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ValidationRepository::class)]
#[ORM\Table(name: 'validations')]
class Validation
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Capture::class, inversedBy: 'validations')]
    #[ORM\JoinColumn(name: 'capture_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?Capture $capture = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'superviseur_id', referencedColumnName: 'id', nullable: false, onDelete: 'RESTRICT')]
    private ?User $superviseur = null;

    /**
     * Colonne ENUM côté base, mappée ici comme string simple.
     * Valeurs possibles: EN_ATTENTE, VALIDEE, REJETEE.
     */
    #[ORM\Column(length: 20, options: ['default' => 'EN_ATTENTE'])]
    private ?string $statut = 'EN_ATTENTE';

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $remarque = null;

    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?\DateTimeInterface $dateValidation = null;

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

    public function getSuperviseur(): ?User
    {
        return $this->superviseur;
    }

    public function setSuperviseur(?User $superviseur): self
    {
        $this->superviseur = $superviseur;

        return $this;
    }

    public function getStatut(): ?string
    {
        return $this->statut;
    }

    public function setStatut(string $statut): self
    {
        $this->statut = $statut;

        return $this;
    }

    public function getRemarque(): ?string
    {
        return $this->remarque;
    }

    public function setRemarque(?string $remarque): self
    {
        $this->remarque = $remarque;

        return $this;
    }

    public function getDateValidation(): ?\DateTimeInterface
    {
        return $this->dateValidation;
    }

    public function setDateValidation(?\DateTimeInterface $dateValidation): self
    {
        $this->dateValidation = $dateValidation;

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


