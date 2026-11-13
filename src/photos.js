export function setPhotoFlipped(button, flipped) {
  const front = button.querySelector('.photo-front');
  const back = button.querySelector('.photo-back');
  const copy = button.querySelector('.photo-copy').textContent.trim().replace(/\s+/g, ' ');
  button.setAttribute('aria-pressed', String(flipped));
  button.setAttribute('aria-label', flipped ? `${copy}. Show photo` : `Show notes for ${button.dataset.title}`);
  front.setAttribute('aria-hidden', String(flipped));
  back.setAttribute('aria-hidden', String(!flipped));
}

export function initPhotos(root = document) {
  const buttons = [...root.querySelectorAll('.photo-flip')];
  function toggle(event) {
    const button = event.currentTarget;
    setPhotoFlipped(button, button.getAttribute('aria-pressed') !== 'true');
  }
  function escape(event) {
    if (event.key === 'Escape') setPhotoFlipped(event.currentTarget, false);
  }
  for (const button of buttons) {
    button.disabled = false;
    button.addEventListener('click', toggle);
    button.addEventListener('keydown', escape);
  }
  return () => {
    for (const button of buttons) {
      button.removeEventListener('click', toggle);
      button.removeEventListener('keydown', escape);
      setPhotoFlipped(button, false);
      button.disabled = true;
    }
  };
}
