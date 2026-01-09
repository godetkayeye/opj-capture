<?php

namespace App\Entity;

use App\Repository\InfractionRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: InfractionRepository::class)]
#[ORM\Table(name: 'infractions')]
class Infraction
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 150)]
    private ?string $libelle = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $description = null;

    #[ORM\Column(type: 'datetime', options: ['default' => 'CURRENT_TIMESTAMP'])]
    private ?\DateTimeInterface $createdAt = null;

    /**
     * @var Collection<int, Bandit>
     */
    #[ORM\ManyToMany(targetEntity: Bandit::class, mappedBy: 'infractions')]
    private Collection $bandits;

    public function __construct()
    {
        $this->bandits = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getLibelle(): ?string
    {
        return $this->libelle;
    }

    public function setLibelle(string $libelle): self
    {
        $this->libelle = $libelle;

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

    /**
     * @return Collection<int, Bandit>
     */
    public function getBandits(): Collection
    {
        return $this->bandits;
    }

    public function addBandit(Bandit $bandit): self
    {
        if (!$this->bandits->contains($bandit)) {
            $this->bandits->add($bandit);
            $bandit->addInfraction($this);
        }

        return $this;
    }

    public function removeBandit(Bandit $bandit): self
    {
        if ($this->bandits->removeElement($bandit)) {
            $bandit->removeInfraction($this);
        }

        return $this;
    }
}


