// Validation des banques de questions (questions/*.json).
// Fonction pure : elle reçoit des fichiers déjà lus et renvoie la liste des erreurs.
import Ajv from 'ajv/dist/2020'
import addFormats from 'ajv-formats'
import schema from '../../../schema/question.schema.json'

// Le schéma est compilé une seule fois, à l'import du module.
const ajv = new Ajv({ allErrors: true })
addFormats(ajv)
const verifierSchema = ajv.compile(schema)

// Reformule une erreur ajv en phrase simple, avec le chemin du champ.
function reformuler(e) {
  const champ = e.instancePath.replace(/^\//, '').replaceAll('/', ' > ')
  const ou = champ ? `champ « ${champ} »` : 'question'
  switch (e.keyword) {
    case 'required':
      return `${ou} : le champ « ${e.params.missingProperty} » est manquant`
    case 'additionalProperties':
      return `${ou} : champ inconnu « ${e.params.additionalProperty} »`
    case 'enum':
      return `${ou} : valeur non autorisée (attendu : ${e.params.allowedValues.join(', ')})`
    case 'type':
      return `${ou} : type attendu « ${e.params.type} »`
    case 'minLength':
      return `${ou} : texte trop court (${e.params.limit} caractères minimum)`
    case 'minItems':
      return `${ou} : au moins ${e.params.limit} élément(s) attendu(s)`
    case 'pattern':
      if (e.instancePath === '/id') return `${ou} : format incorrect (attendu : thème, tiret, 4 chiffres, ex. « incendie-0001 »)`
      if (e.instancePath === '/portee') return `${ou} : format incorrect (attendu : « national » ou un numéro de département, ex. « 50 »)`
      return `${ou} : format incorrect`
    case 'format':
      return `${ou} : format « ${e.params.format} » incorrect`
    case 'minimum':
    case 'maximum':
      return `${ou} : valeur hors limites (${e.keyword} ${e.params.limit})`
    default:
      return `${ou} : ${e.message}`
  }
}

// Contrôles de cohérence propres à une question (hors schéma).
function controlerCoherence(q) {
  const erreurs = []
  const props = Array.isArray(q.propositions) ? q.propositions : null
  const bonnes = Array.isArray(q.bonnes_reponses) ? q.bonnes_reponses : null

  if (props && bonnes) {
    // c. index existants et sans doublon
    for (const i of bonnes) {
      if (Number.isInteger(i) && i >= props.length) {
        erreurs.push(`la bonne réponse n°${i} n'existe pas (${props.length} propositions, numérotées de 0 à ${props.length - 1})`)
      }
    }
    if (new Set(bonnes).size !== bonnes.length) {
      erreurs.push('une même proposition est indiquée deux fois comme bonne réponse')
    }
    // d. ordre : chaque proposition exactement une fois
    if (q.type === 'ordre' && (bonnes.length !== props.length || new Set(bonnes).size !== props.length)) {
      erreurs.push('type « ordre » : chaque proposition doit apparaître exactement une fois dans les bonnes réponses')
    }
    // e. vrai-faux : 2 propositions, 1 bonne réponse
    if (q.type === 'vrai-faux' && (props.length !== 2 || bonnes.length !== 1)) {
      erreurs.push('type « vrai-faux » : il faut exactement 2 propositions et 1 bonne réponse')
    }
  }
  // f. une question validée doit être vérifiée
  if (q.statut === 'validee') {
    if (!q.verifie_le) erreurs.push('statut « validee » : la date de vérification (verifie_le) est obligatoire')
    if (typeof q.verification !== 'string' || !q.verification.trim()) erreurs.push('statut « validee » : le compte rendu de vérification (verification) est obligatoire')
  }
  return erreurs
}

/**
 * @param {{nom: string, contenu: unknown}[]} fichiers
 * @returns {string[]} erreurs lisibles (vide si tout est correct)
 */
export function validerQuestions(fichiers) {
  const erreurs = []
  const dejaVus = new Map() // id -> fichier où il est apparu en premier

  for (const { nom, contenu } of fichiers) {
    // a. le fichier doit contenir un tableau
    if (!Array.isArray(contenu)) {
      erreurs.push(`${nom} : le fichier doit contenir un tableau de questions`)
      continue
    }
    contenu.forEach((q, rang) => {
      const id = q && typeof q === 'object' && typeof q.id === 'string' ? q.id : `question n°${rang + 1}`
      const prefixe = `${nom}, ${id} : `
      const ajouter = (msg) => erreurs.push(prefixe + msg)

      // b. schéma
      if (!verifierSchema(q)) verifierSchema.errors.forEach((e) => ajouter(reformuler(e)))
      if (q && typeof q === 'object') controlerCoherence(q).forEach(ajouter)

      // g. identifiants uniques, y compris entre fichiers
      if (q && typeof q.id === 'string') {
        const avant = dejaVus.get(q.id)
        if (avant === nom) ajouter('identifiant déjà utilisé dans ce fichier')
        else if (avant) ajouter(`identifiant déjà utilisé (dans ${avant})`)
        else dejaVus.set(q.id, nom)
      }
    })
  }
  return erreurs
}
