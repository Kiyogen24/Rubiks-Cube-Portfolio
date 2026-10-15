// « Écrivez-moi », la dernière section : un mail au sujet déjà rempli, l'adresse à copier ;
// après un cube résolu à la main, son message change
import { $ } from '../state.js';
import { t } from '../i18n.js';

const EMAIL = 'r.goldenchtein@proton.me';
const copyLabel = $('#copy-label');
let solvedMoves = null;
let copyTimer = 0;

export function renderContact() {
  const ui = t();
  const solved = solvedMoves !== null;
  $('#contact-title').textContent = solved ? ui.contactTitleSolved : ui.contactTitle;
  $('#contact-lead').textContent = solved ? ui.contactLeadSolved(solvedMoves) : ui.contactLead;
  $('#mail').href = `mailto:${EMAIL}?subject=${encodeURIComponent(solved ? ui.mailSubjectSolved : ui.mailSubject)}`;
}

export function showSolvedContact(moves) {
  solvedMoves = moves;
  renderContact();
}

export function setupContact() {
  $('#copy-mail').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      copyLabel.textContent = t().copied;
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => (copyLabel.textContent = t().copyMail), 2200);
    } catch {
      // presse-papiers refusé : l'adresse est sélectionnée, prête à être copiée
      window.getSelection().selectAllChildren($('#contact-email'));
    }
  });
}
