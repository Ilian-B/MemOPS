<script>
  import { tick } from 'svelte'
  import questionsDispo from 'virtual:questions'
  import { AVERTISSEMENT } from './lib/avertissement.js'
  import { estCorrecte, estJouable, melangerPropositions, toucherEtape } from './lib/session.js'
  import { EMPLOIS, pourEmploi, pourTheme } from './lib/filtre-questions.js'
  import { progressionParTheme, niveauTaux } from './lib/progression.js'
  import { lireEmploi, ecrireEmploi } from './lib/preferences.js'
  import { ouvrirStockage } from './lib/stockage.js'
  import {
    enregistrerReponse, tirerSessionRevision, aRevoirAujourdhui, libelleTheme,
  } from './lib/revision.js'

  // Mode développement : on affiche un bandeau sur les questions non relues
  const modeDev = import.meta.env.DEV

  // Emploi choisi (null tant qu'il n'est pas connu), lu sur l'appareil
  const emploiEnregistre = lireEmploi()
  let emploi = $state(emploiEnregistre)

  // Questions réellement jouables (le type « ordre » n'est pas encore géré),
  // limitées à l'emploi choisi
  const jouables = $derived(pourEmploi(questionsDispo.filter(estJouable), emploi))
  const nbDispo = $derived(jouables.length)
  const libelleEmploi = $derived(EMPLOIS.find((e) => e.id === emploi)?.libelle)

  // Progression locale : une fiche par question (Map id -> fiche), lue au démarrage.
  // $state.raw : nous remplaçons toute la Map à chaque réponse.
  let stockage
  let fiches = $state.raw(new Map())
  const chargement = ouvrirStockage().then(async (s) => {
    stockage = s
    fiches = await s.toutLire()
  })
  // Écran « Ma progression » : mêmes questions jouables que la session (déjà filtrées par emploi)
  const progression = $derived(progressionParTheme(jouables, fiches, emploi))
  const aRevoir = $derived(aRevoirAujourdhui(jouables, fiches, new Date()))

  // Premier lancement : sans emploi enregistré, nous demandons d'abord l'emploi
  let ecran = $state(emploiEnregistre ? 'accueil' : 'emploi') // 'emploi' | 'accueil' | 'progression' | 'question' | 'fin'
  let premierLancement = $state(!emploiEnregistre)
  let themeCourant = $state(null) // null = mode aléatoire
  let titreEmploiEl = $state()
  let titreProgressionEl = $state()
  // Remise à zéro de la progression
  let confirmationOuverte = $state(false)
  let erreurRaz = $state(false)
  let encartRazEl = $state()
  let boutonRazEl = $state()
  let changerEl = $state() // bouton « changer » : reçoit le focus après le choix
  let session = $state([])
  let index = $state(0)
  let choisis = $state([]) // index des propositions cochées
  let repondu = $state(false)
  let score = $state(0)
  let avertissementOuvert = $state(false)

  // Éléments à qui nous donnons le focus (lecteurs d'écran et clavier)
  let enonceEl = $state()
  let retourEl = $state()
  let scoreEl = $state()

  // Attend la mise à jour de l'écran, puis place le focus
  async function focaliser(getEl) {
    await tick()
    getEl()?.focus()
  }

  // Focus sur le titre à chaque ouverture de l'écran emploi (y compris au premier lancement)
  $effect(() => {
    if (ecran === 'emploi') focaliser(() => titreEmploiEl)
  })

  const question = $derived(session[index])
  const estOrdre = $derived(question?.type === 'ordre')
  // Les questions « ordre » ont toutes leurs propositions dans bonnes_reponses : ce n'est pas un QCM multiple
  const multiple = $derived(question && !estOrdre ? question.bonnes_reponses.length > 1 : false)
  // Peut-on valider ? (QCM multiple : au moins une case ; ordre : toutes les étapes placées)
  const validable = $derived(estOrdre ? choisis.length === question.propositions.length : choisis.length > 0)
  const reussie = $derived(question ? estCorrecte(question, choisis) : false)

  function ouvrirRaz() {
    erreurRaz = false
    confirmationOuverte = true
    focaliser(() => encartRazEl)
  }

  function annulerRaz() {
    confirmationOuverte = false
    focaliser(() => boutonRazEl)
  }

  // Efface toutes les fiches (l'emploi choisi est conservé)
  async function remettreAZero() {
    try {
      await chargement
      await stockage?.toutEffacer()
      fiches = new Map()
      confirmationOuverte = false
      focaliser(() => boutonRazEl)
    } catch {
      erreurRaz = true
    }
  }

  // Choix de l'emploi : enregistré sur l'appareil (sinon gardé en mémoire)
  function choisirEmploi(id) {
    emploi = id
    ecrireEmploi(id)
    premierLancement = false
    ecran = 'accueil'
    focaliser(() => changerEl)
  }

  function changerEmploi() {
    ecran = 'emploi'
  }

  // theme null : aléatoire sur tous les thèmes
  async function commencer(theme = null) {
    await chargement
    themeCourant = theme
    // Propositions mélangées à la mise en place de la session (une seule fois par question)
    session = tirerSessionRevision(pourTheme(jouables, theme), fiches, new Date()).map((q) => melangerPropositions(q))
    index = 0
    score = 0
    preparerQuestion()
    ecran = 'question'
    focaliser(() => enonceEl)
  }

  function preparerQuestion() {
    choisis = []
    repondu = false
  }

  // Valide la réponse et compte le point si elle est juste
  function valider(selection) {
    if (repondu) return
    choisis = selection
    repondu = true
    const juste = estCorrecte(question, selection)
    if (juste) score += 1
    // Nous enregistrons la réponse tout de suite (la mémoire se met à jour, puis le stockage)
    const fiche = enregistrerReponse(fiches.get(question.id), question.id, juste, new Date())
    fiches = new Map(fiches).set(question.id, fiche)
    stockage?.enregistrer(fiche).catch(() => {})
    focaliser(() => retourEl)
  }

  // Une seule bonne réponse : un appui répond directement. Sinon on coche/décoche.
  function appuyer(i) {
    if (repondu) return
    if (estOrdre) {
      choisis = toucherEtape(choisis, i)
      return
    }
    if (!multiple) return valider([i])
    choisis = choisis.includes(i) ? choisis.filter((x) => x !== i) : [...choisis, i]
  }

  function suivante() {
    if (index + 1 >= session.length) {
      ecran = 'fin'
      focaliser(() => scoreEl)
    } else {
      index += 1
      preparerQuestion()
      focaliser(() => enonceEl)
    }
  }

  // Message encourageant selon le score
  function messageFin(s, n) {
    if (s === n) return 'Sans faute, bravo !'
    if (s >= n / 2) return 'Bien joué, continuons comme ça !'
    return "Ce n'est qu'un début, une nouvelle session et ça ira mieux !"
  }

  // Classe de couleur d'une proposition après la réponse
  function etat(i) {
    if (!repondu) return choisis.includes(i) ? 'coche' : ''
    // Ordre : une étape est verte si elle est à sa place, rouge sinon
    if (estOrdre) return choisis.indexOf(i) === question.bonnes_reponses.indexOf(i) ? 'bonne' : 'mauvaise'
    const bonne = question.bonnes_reponses.includes(i)
    if (bonne) return 'bonne'
    return choisis.includes(i) ? 'mauvaise' : 'neutre'
  }
</script>

<main>
  <h1>MemOPS</h1>

  {#if ecran === 'emploi'}
    {#if premierLancement}<p class="avertissement" role="note">{AVERTISSEMENT}</p>{/if}
    <h2 tabindex="-1" bind:this={titreEmploiEl}>Quel est mon emploi ?</h2>
    {#each EMPLOIS as e (e.id)}
      <button
        class="gros secondaire"
        class:choisi={e.id === emploi}
        aria-pressed={e.id === emploi}
        onclick={() => choisirEmploi(e.id)}
      >
        {#if e.id === emploi}<span aria-hidden="true">✓ </span>{/if}{e.libelle}
      </button>
    {/each}
    <p class="note-emploi">Vous recevrez aussi les questions des emplois précédents.</p>
    {#if emploi && !premierLancement}
      <button class="lien" onclick={() => { ecran = 'accueil'; focaliser(() => changerEl) }}>Retour</button>
    {/if}
  {:else if ecran === 'accueil'}
    <p class="avertissement" role="note">{AVERTISSEMENT}</p>
    <p class="emploi">
      Mon emploi : <strong>{libelleEmploi}</strong>
      <button class="lien" bind:this={changerEl} onclick={changerEmploi}>changer</button>
    </p>
    {#if nbDispo > 0}
      <p class="compteur">{nbDispo} question{nbDispo > 1 ? 's' : ''} disponible{nbDispo > 1 ? 's' : ''}</p>
      <button class="gros principal" onclick={() => commencer()}>Commencer</button>
      <p class="a-revoir">À revoir aujourd'hui : <strong>{aRevoir}</strong></p>
      <button class="gros secondaire" onclick={() => { confirmationOuverte = false; ecran = 'progression'; focaliser(() => titreProgressionEl) }}>
        Ma progression
      </button>

    {:else}
      <p class="vide">
        Les premières questions sont en cours de relecture par des experts. Revenez très bientôt pour
        vous entraîner !
      </p>
    {/if}
  {:else if ecran === 'progression'}
    <button class="gros secondaire" onclick={() => { ecran = 'accueil'; focaliser(() => changerEl) }}>Retour à l'accueil</button>
    <h2 tabindex="-1" bind:this={titreProgressionEl}>Ma progression</h2>
    <ul class="themes">
      {#each progression as t (t.theme)}
        <li class="carte-theme">
          <span class="theme-nom">{libelleTheme(t.theme)}</span>
          {#if t.taux === null}
            <span class="theme-detail">Pas encore commencé</span>
          {:else}
            <div class="barre" role="progressbar" aria-label="Taux de réussite" aria-valuemin="0" aria-valuemax="100" aria-valuenow={t.taux}>
              <div class="barre-remplie {niveauTaux(t.taux)}" style="width: {t.taux}%"></div>
            </div>
            <span class="theme-detail">Réussite : <strong>{t.taux} %</strong> ({t.bonnes} / {t.reponses})</span>
          {/if}
          <span class="theme-detail">Questions vues : {t.vues} / {t.total}</span>
          <span class="theme-detail">Questions acquises : {t.acquises}</span>
          <button class="gros secondaire reviser" aria-label="Réviser le thème {libelleTheme(t.theme)}" onclick={() => commencer(t.theme)}>Réviser ce thème</button>
        </li>
      {/each}
    </ul>
    <button class="gros principal" onclick={() => { ecran = 'accueil'; focaliser(() => changerEl) }}>Retour</button>
    {#if confirmationOuverte}
      <div class="encart-raz" role="alertdialog" aria-labelledby="titre-raz" tabindex="-1" bind:this={encartRazEl}>
        <p id="titre-raz">Effacer toute ma progression ? Cette action est définitive.</p>
        {#if erreurRaz}<p class="erreur" role="alert">L'effacement a échoué. Veuillez réessayer.</p>{/if}
        <button class="gros principal" onclick={remettreAZero}>Oui, tout effacer</button>
        <button class="gros secondaire" onclick={annulerRaz}>Annuler</button>
      </div>
    {:else}
      <button class="lien" bind:this={boutonRazEl} onclick={ouvrirRaz}>Remettre ma progression à zéro</button>
    {/if}
  {:else if ecran === 'question'}
    <div class="entete-question">
      <!-- Les réponses déjà données sont enregistrées : quitter ne perd rien -->
      <button class="lien" onclick={() => { ecran = 'accueil'; focaliser(() => changerEl) }}>✕ Quitter</button>
      <p class="progression">{index + 1} / {session.length}</p>
    </div>
    {#if modeDev && question.statut === 'a_verifier'}
      <p class="bandeau-dev">Question en attente de relecture</p>
    {/if}
    <h2 id="enonce" tabindex="-1" bind:this={enonceEl}>{question.enonce}</h2>
    {#if multiple}<p class="indice">Plusieurs réponses possibles</p>{/if}
    {#if estOrdre}<p class="indice">Mise en ordre : touchez les étapes dans l'ordre, de la première à la dernière.</p>{/if}

    <div class="choix" role="group" aria-labelledby="enonce">
      {#each question.propositions as texte, i}
        <button
          class="gros choix-btn {etat(i)}"
          class:anime={repondu && (etat(i) === 'bonne' || etat(i) === 'mauvaise')}
          aria-pressed={multiple || estOrdre ? choisis.includes(i) : undefined}
          aria-label={estOrdre && choisis.includes(i)
            ? `Étape ${choisis.indexOf(i) + 1}${repondu ? (etat(i) === 'bonne' ? ' (bien placée)' : ' (mal placée)') : ''} : ${texte}`
            : undefined}
          disabled={repondu}
          onclick={() => appuyer(i)}
        >
          {#if multiple}<span class="case" aria-hidden="true">{choisis.includes(i) ? '☑' : '☐'}</span>{/if}
          {#if estOrdre}<span class="rang" aria-hidden="true">{choisis.includes(i) ? choisis.indexOf(i) + 1 : '·'}</span>{/if}
          {texte}
        </button>
      {/each}
    </div>

    {#if estOrdre}
      <section class="mon-ordre" aria-label="Mon ordre">
        <strong>Mon ordre</strong>
        {#if choisis.length === 0}
          <p class="indice">Touchez les étapes dans l'ordre.</p>
        {:else}
          <ol>
            {#each choisis as i (i)}<li>{question.propositions[i]}</li>{/each}
          </ol>
        {/if}
      </section>
    {/if}

    {#if (multiple || estOrdre) && !repondu}
      <button class="gros principal" disabled={!validable} onclick={() => valider(choisis)}>
        Valider
      </button>
    {/if}
    {#if estOrdre && !repondu}
      <button class="gros secondaire" aria-label="Effacer mon ordre" disabled={choisis.length === 0} onclick={() => (choisis = [])}>Effacer</button>
    {/if}

    <div aria-live="polite">
      {#if repondu}
        <section class="retour" tabindex="-1" bind:this={retourEl} class:ok={reussie} class:ko={!reussie}>
          <p class="verdict">{reussie ? 'Bonne réponse !' : 'Raté, mais ça se retient !'}</p>
          {#if estOrdre && !reussie}
            <p><strong>Ordre attendu</strong></p>
            <ol class="ordre-attendu">
              {#each question.bonnes_reponses as i}<li>{question.propositions[i]}</li>{/each}
            </ol>
          {/if}
          <p>{question.explication}</p>
          <div class="source">
            <strong>Source</strong>
            <p>{question.source.document} — {question.source.version}</p>
            <p>{question.source.emplacement}</p>
            <blockquote>« {question.source.citation} »</blockquote>
          </div>
        </section>
      {/if}
    </div>
    {#if repondu}
      <button class="gros principal" onclick={suivante}>
        {index + 1 >= session.length ? 'Voir mon score' : 'Question suivante'}
      </button>
    {/if}
  {:else}
    <h2>Session terminée</h2>
    <p class="score" tabindex="-1" bind:this={scoreEl}>{score} / {session.length}</p>
    <p>{messageFin(score, session.length)}</p>
    <p class="a-venir">
      {#if session.length - score > 0}
        {session.length - score} question{session.length - score > 1 ? 's' : ''} ratée{session.length - score > 1 ? 's' : ''}
        reviendr{session.length - score > 1 ? 'ont' : 'a'} demain.
      {/if}
      {#if score > 0}
        {score} question{score > 1 ? 's' : ''} bien répondue{score > 1 ? 's' : ''}
        reviendr{score > 1 ? 'ont' : 'a'} dans quelques jours.
      {/if}
    </p>
    <button class="gros principal" onclick={() => commencer(themeCourant)}>Nouvelle session</button>
    <button class="gros secondaire" onclick={() => (ecran = 'accueil')}>Retour à l'accueil</button>
  {/if}

  {#if ecran !== 'accueil'}
    <footer>
      <button class="lien" onclick={() => (avertissementOuvert = !avertissementOuvert)}>
        Avertissement
      </button>
      {#if avertissementOuvert}<p class="avertissement" role="note">{AVERTISSEMENT}</p>{/if}
    </footer>
  {:else}
    <footer></footer>
  {/if}
</main>

<style>
  main {
    max-width: 480px;
    margin: 0 auto;
    padding: 1.5rem 1rem 2rem;
  }
  h1 {
    color: #d62828;
    font-size: 2rem;
    margin: 0 0 1rem;
    text-align: center;
  }
  h2 {
    font-size: 1.25rem;
    line-height: 1.35;
  }
  .avertissement {
    background: #ffe8b0;
    border-left: 6px solid #f77f00;
    border-radius: 8px;
    padding: 1rem;
    line-height: 1.4;
  }
  .emploi {
    text-align: center;
  }
  .encart-raz {
    background: #fff4e0;
    border-left: 6px solid #d62828;
    border-radius: 8px;
    padding: 0.5rem 1rem;
    margin-top: 1rem;
  }
  .encart-raz:focus {
    outline: none;
  }
  .erreur {
    color: #b3261e;
    font-weight: bold;
  }
  .note-emploi {
    text-align: center;
  }
  /* Après .secondaire dans la feuille : le sélecteur doublé est nécessaire */
  .secondaire.choisi {
    background: #ffe3e3;
    border-width: 6px;
  }
  .gros.reviser {
    min-height: 48px;
    margin: 0.4rem 0 0;
    font-size: 0.95rem;
  }
  .compteur,
  .vide,
  .score {
    text-align: center;
  }
  .compteur {
    font-size: 1.1rem;
  }
  .vide {
    background: #fff;
    border-radius: 12px;
    padding: 1rem;
    line-height: 1.4;
  }
  .score {
    font-size: 3rem;
    font-weight: bold;
    color: #d62828;
    margin: 0.5rem 0;
  }
  .a-revoir,
  .a-venir {
    text-align: center;
  }
  .themes {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .themes li {
    margin-top: 0.8rem;
  }
  .theme-nom {
    font-weight: bold;
  }
  .barre {
    height: 14px;
    background: #f1e6d0;
    border-radius: 7px;
    overflow: hidden;
    margin: 0.25rem 0;
  }
  .barre-remplie {
    height: 100%;
    background: #1b7a3a;
  }
  .barre-remplie.rouge {
    background: #b3261e;
  }
  .barre-remplie.orange {
    background: #b85c00;
  }
  .barre-remplie.vert {
    background: #1b7a3a;
  }
  .carte-theme {
    background: #fff;
    border-radius: 12px;
    padding: 0.5rem 1rem 0.8rem;
  }
  .carte-theme .theme-nom,
  .carte-theme .theme-detail {
    display: block;
  }
  .theme-detail {
    font-size: 0.9rem;
    color: #444;
  }
  .entete-question {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .entete-question .lien {
    padding-left: 0;
    min-height: 44px; /* assez grand pour le pouce */
  }
  .progression {
    text-align: right;
    font-weight: bold;
    color: #8f1a1a;
    margin: 0;
  }
  .indice {
    font-style: italic;
    color: #8f1a1a;
  }
  .bandeau-dev {
    background: #6a1b9a;
    color: #fff;
    font-weight: bold;
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    text-align: center;
  }

  /* Gros boutons pensés pour le pouce */
  .gros {
    display: block;
    width: 100%;
    min-height: 56px;
    margin: 0.6rem 0;
    padding: 0.8rem 1rem;
    font: inherit;
    font-size: 1.05rem;
    text-align: left;
    border: 3px solid transparent;
    border-radius: 14px;
    cursor: pointer;
  }
  .gros:focus-visible,
  .lien:focus-visible {
    outline: 3px solid #1d3557;
    outline-offset: 2px;
  }
  .principal {
    background: #d62828;
    color: #fff;
    font-weight: bold;
    text-align: center;
    box-shadow: 0 4px 0 #8f1a1a;
  }
  .principal:disabled {
    background: #6b6b6b; /* blanc dessus : environ 5,3:1 */
    box-shadow: 0 4px 0 #444;
    cursor: not-allowed;
  }
  .secondaire {
    background: #fff;
    color: #8f1a1a;
    border-color: #d62828;
    text-align: center;
    font-weight: bold;
  }
  .choix-btn {
    background: #fff;
    color: #2b2b2b;
    border-color: #e0c9a0;
  }
  .choix-btn.coche {
    border-color: #d62828;
    background: #ffe3e3;
  }
  .choix-btn.bonne {
    background: #1b7a3a;
    color: #fff;
    border-color: #14602d;
  }
  .choix-btn.mauvaise {
    background: #b3261e;
    color: #fff;
    border-color: #8c1c16;
  }
  .choix-btn.neutre {
    background: #f1e6d0;
    border-style: dashed;
  }
  .retour:focus,
  h2:focus,
  .score:focus {
    outline: none;
  }
  .rang {
    display: inline-block;
    min-width: 1.6rem;
    margin-right: 0.5rem;
    font-weight: bold;
  }
  .mon-ordre {
    background: #fff;
    border-radius: 12px;
    padding: 0.5rem 1rem;
    margin: 0.6rem 0;
  }
  .mon-ordre ol,
  .ordre-attendu {
    margin: 0.3rem 0;
    padding-left: 1.5rem;
  }
  .case {
    margin-right: 0.5rem;
  }

  /* Petite animation : rebond pour la bonne réponse, secousse pour la mauvaise */
  .anime.bonne {
    animation: rebond 0.4s ease;
  }
  .anime.mauvaise {
    animation: secousse 0.4s ease;
  }
  @keyframes rebond {
    50% {
      transform: scale(1.04);
    }
  }
  @keyframes secousse {
    25% {
      transform: translateX(-6px);
    }
    75% {
      transform: translateX(6px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .anime.bonne,
    .anime.mauvaise {
      animation: none;
    }
  }

  .retour {
    background: #fff;
    border-left: 8px solid;
    border-radius: 12px;
    padding: 0.5rem 1rem 1rem;
    margin-top: 1rem;
    line-height: 1.4;
  }
  .retour.ok {
    border-color: #1b7a3a;
  }
  .retour.ko {
    border-color: #b3261e;
  }
  .verdict {
    font-weight: bold;
    font-size: 1.15rem;
  }
  .source {
    font-size: 0.9rem;
    background: #fff4e0;
    border-radius: 8px;
    padding: 0.5rem 0.75rem;
  }
  .source p {
    margin: 0.2rem 0;
  }
  blockquote {
    margin: 0.4rem 0 0;
    font-style: italic;
  }
  footer {
    margin-top: 2rem;
    text-align: center;
    min-height: 1rem;
  }
  .lien {
    background: none;
    border: none;
    color: #5f1111;
    text-decoration: underline;
    font: inherit;
    font-size: 0.9rem;
    padding: 0.5rem;
    cursor: pointer;
  }
  footer .avertissement {
    text-align: left;
  }
</style>
