<?php

namespace App\Entity;

use App\Repository\CaptureRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: CaptureRepository::class)]
#[ORM\Table(name: 'captures')]
class Capture
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Bandit::class, inversedBy: 'captures')]
    #[ORM\JoinColumn(name: 'bandit_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?Bandit $bandit = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'opj_id', referencedColumnName: 'id', nullable: false, onDelete: 'RESTRICT')]
    private ?User $opj = null;

    #[ORM\Column(type: 'datetime')]
    private ?\DateTimeInterface $dateCapture = null;

    #[ORM\Column(length: 255)]
    private ?string $lieuCapture = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $commentaire = null;

    #[ORM\Column(type: 'datetime', options: ['default' => 'CURRENT_TIMESTAMP'])]
    private ?\DateTimeInterface $createdAt = null;

    /**
     * @var Collection<int, Preuve>
     */
    #[ORM\OneToMany(mappedBy: 'capture', targetEntity: Preuve::class)]
    private Collection $preuves;

    /**
     * @var Collection<int, Validation>
     */
    #[ORM\OneToMany(mappedBy: 'capture', targetEntity: Validation::class)]
    private Collection $validations;

    public function __construct()
    {
        $this->preuves = new ArrayCollection();
        $this->validations = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getBandit(): ?Bandit
    {
        return $this->bandit;
    }

    public function setBandit(?Bandit $bandit): self
    {
        $this->bandit = $bandit;

        return $this;
    }

    public function getOpj(): ?User
    {
        return $this->opj;
    }

    public function setOpj(?User $opj): self
    {
        $this->opj = $opj;

        return $this;
    }

    public function getDateCapture(): ?\DateTimeInterface
    {
        return $this->dateCapture;
    }

    public function setDateCapture(\DateTimeInterface $dateCapture): self
    {
        $this->dateCapture = $dateCapture;

        return $this;
    }

    public function getLieuCapture(): ?string
    {
        return $this->lieuCapture;
    }

    public function setLieuCapture(string $lieuCapture): self
    {
        $this->lieuCapture = $lieuCapture;

        return $this;
    }

    public function getCommentaire(): ?string
    {
        return $this->commentaire;
    }

    public function setCommentaire(?string $commentaire): self
    {
        $this->commentaire = $commentaire;

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

    /**
     * @return Collection<int, Preuve>
     */
    public function getPreuves(): Collection
    {
        return $this->preuves;
    }

    public function addPreuve(Preuve $preuve): self
    {
        if (!$this->preuves->contains($preuve)) {
            $this->preuves->add($preuve);
            $preuve->setCapture($this);
        }

        return $this;
    }

    public function removePreuve(Preuve $preuve): self
    {
        if ($this->preuves->removeElement($preuve)) {
            if ($preuve->getCapture() === $this) {
                $preuve->setCapture(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Validation>
     */
    public function getValidations(): Collection
    {
        return $this->validations;
    }

    public function addValidation(Validation $validation): self
    {
        if (!$this->validations->contains($validation)) {
            $this->validations->add($validation);
            $validation->setCapture($this);
        }

        return $this;
    }

    public function removeValidation(Validation $validation): self
    {
        if ($this->validations->removeElement($validation)) {
            if ($validation->getCapture() === $this) {
                $validation->setCapture(null);
            }
        }

        return $this;
    }
}


