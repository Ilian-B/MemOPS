// Filtre des questions embarquées dans l'appli (fonction pure).
// Production : seules les questions « validee ». Développement : « a_verifier » aussi.
// Les questions « rejetee » ne sont jamais gardées.
export function filtrerQuestions(questions, modeDev) {
  const statuts = modeDev ? ['validee', 'a_verifier'] : ['validee']
  return questions.filter((q) => statuts.includes(q.statut))
}
