// Stockage local de la progression : une « fiche » par question (clé = id de la question).
// Interface commune aux deux implémentations (toutes les méthodes sont asynchrones) :
//   lire(id)          -> la fiche, ou undefined
//   enregistrer(fiche) -> écrit la fiche (remplace l'ancienne)
//   toutLire()        -> Map id -> fiche
// Aucune donnée personnelle, aucun réseau : tout reste dans le navigateur.

const NOM_BASE = 'memops'
const NOM_TABLE = 'fiches'

/** Stockage en mémoire : sert aux tests et de solution de secours. */
export function creerStockageMemoire() {
  const fiches = new Map()
  return {
    async lire(id) {
      return fiches.get(id)
    },
    async enregistrer(fiche) {
      fiches.set(fiche.id, fiche)
    },
    async toutLire() {
      return new Map(fiches)
    },
  }
}

// Transforme une requête IndexedDB (à callbacks) en promesse
function promesse(requete) {
  return new Promise((resolve, reject) => {
    requete.onsuccess = () => resolve(requete.result)
    requete.onerror = () => reject(requete.error)
  })
}

/** Ouvre la base IndexedDB `memops` ; échoue si IndexedDB est absent ou refusé. */
export function creerStockageIndexedDB(fabrique = globalThis.indexedDB) {
  return new Promise((resolve, reject) => {
    if (!fabrique) return reject(new Error('IndexedDB indisponible'))
    let ouverture
    try {
      ouverture = fabrique.open(NOM_BASE, 1)
    } catch (erreur) {
      return reject(erreur)
    }
    ouverture.onupgradeneeded = () => {
      ouverture.result.createObjectStore(NOM_TABLE, { keyPath: 'id' })
    }
    ouverture.onerror = () => reject(ouverture.error)
    ouverture.onblocked = () => reject(new Error('Base bloquée'))
    ouverture.onsuccess = () => {
      const base = ouverture.result
      // Une autre fenêtre veut mettre la base à jour : nous la libérons
      base.onversionchange = () => base.close()
      const table = (mode) => base.transaction(NOM_TABLE, mode).objectStore(NOM_TABLE)
      resolve({
        lire: (id) => promesse(table('readonly').get(id)),
        // Réussi seulement quand la transaction est validée ; rejeté si elle échoue (quota…)
        enregistrer: (fiche) =>
          new Promise((resolve, reject) => {
            const tx = base.transaction(NOM_TABLE, 'readwrite')
            tx.oncomplete = () => resolve()
            tx.onabort = () => reject(tx.error ?? new Error('Transaction annulée'))
            tx.onerror = () => reject(tx.error)
            tx.objectStore(NOM_TABLE).put(fiche)
          }),
        async toutLire() {
          const liste = await promesse(table('readonly').getAll())
          return new Map(liste.map((f) => [f.id, f]))
        },
      })
    }
  })
}

// Délai maximal pour ouvrir IndexedDB (certains navigateurs ne répondent jamais)
export const DELAI_OUVERTURE_MS = 2500

/**
 * Renvoie un stockage qui ne plante jamais : IndexedDB si possible, sinon la mémoire.
 * Si l'ouverture échoue ou dépasse 2,5 s, nous prenons la mémoire.
 * Si une opération échoue plus tard (quota, navigation privée…), le stockage reste en mémoire
 * pour le reste de la session (choix assumé du POC) : l'appli reste utilisable, mais la
 * progression de cette session n'est plus sauvegardée durablement.
 * Pour que l'écriture ne soit pas perdue, `enregistrer` écrit toujours aussi en mémoire.
 */
export async function ouvrirStockage(fabrique = globalThis.indexedDB) {
  const memoire = creerStockageMemoire()
  let actif
  let minuteur
  try {
    const delai = new Promise((_, reject) => {
      minuteur = setTimeout(() => reject(new Error('IndexedDB trop lent')), DELAI_OUVERTURE_MS)
    })
    actif = await Promise.race([creerStockageIndexedDB(fabrique), delai])
  } catch {
    return memoire
  } finally {
    clearTimeout(minuteur)
  }
  // Appelle l'opération sur le stockage actif ; en cas d'échec, bascule sur la mémoire
  async function proteger(operation) {
    try {
      return await operation(actif)
    } catch {
      actif = memoire
      return operation(actif)
    }
  }
  return {
    lire: (id) => proteger((s) => s.lire(id)),
    async enregistrer(fiche) {
      await memoire.enregistrer(fiche)
      await proteger((s) => (s === memoire ? undefined : s.enregistrer(fiche)))
    },
    toutLire: () => proteger((s) => s.toutLire()),
  }
}
