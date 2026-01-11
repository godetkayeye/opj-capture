<?php

namespace App\Entity;

use App\Repository\BanditRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: BanditRepository::class)]
#[ORM\Table(name: 'bandits')]
class Bandit
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 100)]
    private ?string $nom = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $surnom = null;

    #[ORM\Column(type: 'date', nullable: true)]
    private ?\DateTimeInterface $dateNaissance = null;

    #[ORM\Column(length: 1)]
    private ?string $sexe = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $photo = null;

    #[ORM\Column(length: 20, options: ['default' => 'CAPTURE'])]
    private ?string $etat = 'CAPTURE';

    #[ORM\Column(type: 'datetime', options: ['default' => 'CURRENT_TIMESTAMP'])]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'created_by_id', referencedColumnName: 'id', nullable: true)]
    private ?User $createdBy = null;

    /**
     * @var Collection<int, Infraction>
     */
    #[ORM\ManyToMany(targetEntity: Infraction::class, inversedBy: 'bandits')]
    #[ORM\JoinTable(name: 'bandit_infraction')]
    #[ORM\JoinColumn(name: 'bandit_id', referencedColumnName: 'id', onDelete: 'CASCADE')]
    #[ORM\InverseJoinColumn(name: 'infraction_id', referencedColumnName: 'id', onDelete: 'CASCADE')]
    private Collection $infractions;

    /**
     * @var Collection<int, Capture>
     */
    #[ORM\OneToMany(mappedBy: 'bandit', targetEntity: Capture::class)]
    private Collection $captures;

    public function __construct()
    {
        $this->infractions = new ArrayCollection();
        $this->captures = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getNom(): ?string
    {
        return $this->nom;
    }

    public function setNom(string $nom): self
    {
        $this->nom = $nom;

        return $this;
    }

    public function getSurnom(): ?string
    {
        return $this->surnom;
    }

    public function setSurnom(?string $surnom): self
    {
        $this->surnom = $surnom;

        return $this;
    }

    public function getDateNaissance(): ?\DateTimeInterface
    {
        return $this->dateNaissance;
    }

    public function setDateNaissance(?\DateTimeInterface $dateNaissance): self
    {
        $this->dateNaissance = $dateNaissance;

        return $this;
    }

    public function getSexe(): ?string
    {
        return $this->sexe;
    }

    public function setSexe(string $sexe): self
    {
        $this->sexe = $sexe;

        return $this;
    }

    public function getPhoto(): ?string
    {
        return $this->photo;
    }

    public function setPhoto(?string $photo): self
    {
        $this->photo = $photo;

        return $this;
    }

    public function getEtat(): ?string
    {
        return $this->etat;
    }

    public function setEtat(string $etat): self
    {
        $this->etat = $etat;

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

    public function getCreatedBy(): ?User
    {
        return $this->createdBy;
    }

    public function setCreatedBy(?User $createdBy): self
    {
        $this->createdBy = $createdBy;

        return $this;
    }

    /**
     * @return Collection<int, Infraction>
     */
    public function getInfractions(): Collection
    {
        return $this->infractions;
    }

    public function addInfraction(Infraction $infraction): self
    {
        if (!$this->infractions->contains($infraction)) {
            $this->infractions->add($infraction);
        }

        return $this;
    }

    public function removeInfraction(Infraction $infraction): self
    {
        $this->infractions->removeElement($infraction);

        return $this;
    }

    /**
     * @return Collection<int, Capture>
     */
    public function getCaptures(): Collection
    {
        return $this->captures;
    }

    public function addCapture(Capture $capture): self
    {
        if (!$this->captures->contains($capture)) {
            $this->captures->add($capture);
            $capture->setBandit($this);
        }

        return $this;
    }

    public function removeCapture(Capture $capture): self
    {
        if ($this->captures->removeElement($capture)) {
            if ($capture->getBandit() === $this) {
                $capture->setBandit(null);
            }
        }

        return $this;
    }
}


