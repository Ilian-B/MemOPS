// Filtre des questions embarquées dans l'appli (fonction pure).
// Toutes les questions sont publiées, sauf celles au statut « rejetee ».
export function filtrerQuestions(questions) {
  return questions.filter((q) => q.statut !== 'rejetee')
}
