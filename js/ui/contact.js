// « Contactez-moi », la dernière section : on écrit son message ici, le bouton ouvre la messagerie avec le mail
// déjà rédigé (sujet et texte) ; l'adresse se copie aussi. Après un cube résolu à la main, le message change.
import { S, $ } from '../state.js';
import { t } from '../i18n.js';

const EMAIL = 'r.goldenchtein@proton.me';
const message = $('#message');
const mail = $('#mail');
const copyLabel = $('#copy-label');
let solvedMoves = null;
let copyTimer = 0;

// le lien du mail suit ce qui est écrit : « Écrire un mail » tant que c'est vide, puis « Envoyer le mail »
function updateMail() {
  const ui = t();
  const subject = solvedMoves !== null ? ui.mailSubjectSolved : ui.mailSubject;
  const body = message.value.trim();
  mail.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ''}`;
  $('#mail-label').textContent = body ? ui.sendMail : ui.writeMe;
}

// Sur téléphone, le cube se place dans la hauteur libre au-dessus du texte (cube/scene.js)
export function measureContact() {
  S.contactTextTop = $('.contact-text').offsetTop;
}

export function renderContact() {
  const ui = t();
  const solved = solvedMoves !== null;
  $('#contact-title').textContent = solved ? ui.contactTitleSolved : ui.contactTitle;
  $('#contact-lead').textContent = solved ? ui.contactLeadSolved(solvedMoves) : ui.contactLead;
  message.placeholder = ui.messagePlaceholder;
  updateMail();
  measureContact();
}

export function showSolvedContact(moves) {
  solvedMoves = moves;
  renderContact();
}

export function setupContact() {
  message.addEventListener('input', updateMail);
  // Ctrl + Entrée (⌘ + Entrée sur Mac) envoie, comme dans une messagerie
  message.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) mail.click();
  });
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
