#!/bin/bash
# Télécharge les référentiels nationaux activités-compétences (RAC) des emplois opérationnels
# depuis le site officiel de la Sécurité civile, dans sources/referentiels-emplois/.
# Source : https://www.securite-civile.interieur.gouv.fr/documentation/formation-des-sapeurs-pompiers/sapeurs-pompiers-formation-aux-emplois-operationnels-et-dencadrement.html
# Usage (depuis le dossier du projet) : bash docs/telecharger-referentiels-emplois.sh

cd "$(dirname "$0")/.." || exit 1
DEST="sources/referentiels-emplois"
mkdir -p "$DEST"
BASE="https://www.securite-civile.interieur.gouv.fr/sites/securitecivile/files/medias/documents/2026-07"

telecharger() { # $1 = nom local, $2 = fin d'URL
  if curl -fsSL --retry 2 -o "$DEST/$1" "$BASE/$2"; then
    echo "OK     $1"
  else
    echo "ÉCHEC  $1  ->  $BASE/$2"
    rm -f "$DEST/$1"
  fi
}

telecharger "RAC-equipier-SPP-2022.pdf"                 "20220922_Referentiel_national_activites_competences_equipierSPP.pdf"
telecharger "RAC-equipier-SPV-2022.pdf"                 "20220922_referentiel_national_activites_competences_equipierSPV.pdf"
telecharger "RAC-chef-equipe-SPP.pdf"                   "r%C3%A9f%C3%A9rentiel%20activit%C3%A9s%20comp%C3%A9tences%20chef%20d%27%C3%A9quipe%20SPP.pdf"
telecharger "RAC-chef-equipe-SPV.pdf"                   "r%C3%A9f%C3%A9rentiel%20activit%C3%A9s%20comp%C3%A9tences%20chef%20d%27%C3%A9quipe%20SPV.pdf"
telecharger "RAC-chef-agres-une-equipe-SPP.pdf"         "r%C3%A9f%C3%A9rentiel%20activit%C3%A9s%20comp%C3%A9tences%20chef%20d%27agr%C3%A8s%20un%20engin%20une%20%C3%A9quipe%20SPP.pdf"
telecharger "RAC-chef-agres-une-equipe-SPV.pdf"         "r%C3%A9f%C3%A9rentiel%20activit%C3%A9s%20comp%C3%A9tences%20chef%20d%27agr%C3%A8s%20un%20engin%20une%20%C3%A9quipe%20SPV.pdf"
telecharger "RAC-chef-agres-tout-engin-SPP.pdf"         "r%C3%A9f%C3%A9rentiel%20activit%C3%A9s%20comp%C3%A9tences%20chef%20d%27agr%C3%A8s%20tout%20engin%20SPP.pdf"
telecharger "RAC-chef-agres-tout-engin-SPV.pdf"         "r%C3%A9f%C3%A9rentiel%20activit%C3%A9s%20comp%C3%A9tences%20chef%20d%27agr%C3%A8s%20tout%20engin%20SPV.pdf"
telecharger "RAC-sous-officier-de-garde-SPP.pdf"        "r%C3%A9f%C3%A9rentiel%20activit%C3%A9s%20comp%C3%A9tences%20sous%20officier%20de%20garde%20SPP.pdf"
telecharger "RAC-sous-officier-de-garde-SPV.pdf"        "r%C3%A9f%C3%A9rentiel%20activit%C3%A9s%20comp%C3%A9tences%20sous%20officier%20de%20garde%20SPV.pdf"
telecharger "RAC-chef-de-groupe-2026-04.pdf"            "r%C3%A9f%C3%A9rentiel%20national%20activit%C3%A9s%20comp%C3%A9tences%20chef%20de%20groupe%20-%20avril%202026.pdf"
telecharger "RAC-chef-de-colonne-2026-04.pdf"           "r%C3%A9f%C3%A9rentiel%20national%20activit%C3%A9s%20comp%C3%A9tences%20chef%20de%20colonne%20-%20avril%202026.pdf"
telecharger "RAC-chef-de-site.pdf"                      "referentiel_national_activites_competences_chef_de_site.pdf"
telecharger "RAC-officier-de-garde-2026-04.pdf"         "r%C3%A9f%C3%A9rentiel%20national%20activit%C3%A9s%20comp%C3%A9tences%20officier%20de%20garde%20-%20avril%202026.pdf"

echo
echo "Terminé. En cas d'ÉCHEC, télécharger le fichier à la main depuis la page source indiquée en tête du script."
