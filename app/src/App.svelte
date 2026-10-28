<script>
  import { tick } from 'svelte'
  import questionsDispo from 'virtual:questions'
  import { AVERTISSEMENT } from './lib/avertissement.js'
  import { estCorrecte, estJouable } from './lib/session.js'
  import { ouvrirStockage } from './lib/stockage.js'
  import {
    enregistrerReponse, tirerSessionRevision, statistiques, libelleTheme,
  } from './lib/revision.js'

  // Mode développement : on affiche un bandeau sur les questions non relues
  const modeDev = import.meta.env.DEV

  // Questions réellement jouables (le type « ordre » n'est pas encore géré)
  const jouables = questionsDispo.filter(estJouable)
  const nbDispo = jouables.length

  // Progression locale : une fiche par question (Map id -> fiche), lue au démarrage.
  // $state.raw : nous remplaçons toute la Map à chaque réponse.
  let stockage
  let fiches = $state.raw(new Map())
  const chargement = ouvrirStockage().then(async (s) => {
    stockage = s
    fiches = await s.toutLire()
  })
  const stats = $derived(statistiques(jouables, fiches, new Date()))

  let ecran = $state('accueil') // 'accueil' | 'question' | 'fin'
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

  const question = $derived(session[index])
  const multiple = $derived(question ? question.bonnes_reponses.length > 1 : false)
  const reussie = $derived(question ? estCorrecte(question, choisis) : false)

  async function commencer() {
    await chargement
    session = tirerSessionRevision(jouables, fiches, new Date())
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
    const bonne = question.bonnes_reponses.includes(i)
    if (bonne) return 'bonne'
    return choisis.includes(i) ? 'mauvaise' : 'neutre'
  }
</script>

<main>
  <h1>MemOPS</h1>

  {#if ecran === 'accueil'}
    <p class="avertissement" role="note">{AVERTISSEMENT}</p>
    {#if nbDispo > 0}
      <p class="compteur">{nbDispo} question{nbDispo > 1 ? 's' : ''} disponible{nbDispo > 1 ? 's' : ''}</p>
      <button class="gros principal" onclick={commencer}>Commencer</button>

      <section class="progression-bloc" aria-labelledby="titre-progression">
        <h2 id="titre-progression">Ma progression</h2>
        <p class="a-revoir">À revoir aujourd'hui : <strong>{stats.aRevoir}</strong></p>
        <ul class="themes">
          {#each stats.parTheme as t (t.theme)}
            <li>
              <span class="theme-nom">{libelleTheme(t.theme)}</span>
              <div class="barre" aria-hidden="true">
                <div class="barre-remplie" style="width: {t.taux ?? 0}%"></div>
              </div>
              <span class="theme-detail">
                {#if t.taux === null}Pas encore de réponse{:else}{t.taux} % sur {t.reponses} réponse{t.reponses > 1 ? 's' : ''}{/if}
              </span>
            </li>
          {/each}
        </ul>
      </section>
    {:else}
      <p class="vide">
        Les premières questions sont en cours de relecture par des experts. Revenez très bientôt pour
        vous entraîner !
      </p>
    {/if}
  {:else if ecran === 'question'}
    <p class="progression">{index + 1} / {session.length}</p>
    {#if modeDev && question.statut === 'a_verifier'}
      <p class="bandeau-dev">Question en attente de relecture</p>
    {/if}
    <h2 id="enonce" tabindex="-1" bind:this={enonceEl}>{question.enonce}</h2>
    {#if multiple}<p class="indice">Plusieurs réponses possibles</p>{/if}

    <div class="choix" role="group" aria-labelledby="enonce">
      {#each question.propositions as texte, i}
        <button
          class="gros choix-btn {etat(i)}"
          class:anime={repondu && (etat(i) === 'bonne' || etat(i) === 'mauvaise')}
          aria-pressed={multiple ? choisis.includes(i) : undefined}
          disabled={repondu}
          onclick={() => appuyer(i)}
        >
          {#if multiple}<span class="case" aria-hidden="true">{choisis.includes(i) ? '☑' : '☐'}</span>{/if}
          {texte}
        </button>
      {/each}
    </div>

    {#if multiple && !repondu}
      <button class="gros principal" disabled={choisis.length === 0} onclick={() => valider(choisis)}>
        Valider
      </button>
    {/if}

    <div aria-live="polite">
      {#if repondu}
        <section class="retour" tabindex="-1" bind:this={retourEl} class:ok={reussie} class:ko={!reussie}>
          <p class="verdict">{reussie ? 'Bonne réponse !' : 'Raté, mais ça se retient !'}</p>
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
    <button class="gros principal" onclick={commencer}>Nouvelle session</button>
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
  .progression-bloc {
    background: #fff;
    border-radius: 12px;
    padding: 0.5rem 1rem 1rem;
    margin-top: 1.5rem;
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
  .theme-detail {
    font-size: 0.9rem;
    color: #444;
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
