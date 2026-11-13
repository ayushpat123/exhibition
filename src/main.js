import { initPhotos } from './photos.js';
import { createGallery } from './motion.js';

initPhotos();

const motion = createGallery([...document.querySelectorAll('canvas[data-art]')]);
const button = document.querySelector('#motion');
function updateButton() {
  button.textContent = motion.paused ? 'Play motion' : 'Pause motion';
  button.setAttribute('aria-pressed', String(motion.paused));
}
button.hidden = false;
button.addEventListener('click', () => {
  motion.setPaused(!motion.paused);
  updateButton();
});
motion.onPauseChange = updateButton;
updateButton();
