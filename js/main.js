/* ══════════════════════════════════════
   SCROLL REVEAL
   ══════════════════════════════════════
   Fades in sections as they enter the viewport.
*/

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  },
  { threshold: 0.1 }
);

document.querySelectorAll('.reveal').forEach((el) => {
  observer.observe(el);
});


/* ══════════════════════════════════════
   SMOOTH SCROLL
   ══════════════════════════════════════
   Handles anchor links for smooth navigation.
*/

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});


/* ══════════════════════════════════════
   CONTACT INFO DISPLAY
   ══════════════════════════════════════
   Click 1: reveals the info + "click to copy" tooltip
   Click 2 (while showing): copies to clipboard
   Info is assembled in JS so Cloudflare
   email obfuscation can't detect it.
*/

function getEmail() {
  return 'reidwebster' + '@' + 'verizon.net';
}

function getPhone() {
  return '315-956-2749';
}

function toggleEmail(e) {
  e.preventDefault();
  var btn = document.getElementById('emailBtn');
  var state = btn.dataset.state || 'hidden';

  if (state === 'hidden') {
    btn.innerHTML = '\u2709 ' + getEmail() + '<span class="copy-hint">click to copy</span>';
    btn.dataset.state = 'showing';
    btn.classList.add('showing-info');
  } else if (state === 'showing') {
    navigator.clipboard.writeText(getEmail()).then(function() {
      btn.innerHTML = '\u2713 Copied!';
      btn.classList.add('copied');
      setTimeout(function() {
        btn.innerHTML = '\u2709 ' + getEmail() + '<span class="copy-hint">click to copy</span>';
        btn.classList.remove('copied');
      }, 2000);
    }).catch(function() {
      btn.innerHTML = '\u2709 ' + getEmail();
    });
  }
}

function togglePhone(e) {
  e.preventDefault();
  var btn = document.getElementById('phoneBtn');
  var state = btn.dataset.state || 'hidden';

  if (state === 'hidden') {
    btn.innerHTML = '\uD83D\uDCDE ' + getPhone() + '<span class="copy-hint">click to copy</span>';
    btn.dataset.state = 'showing';
    btn.classList.add('showing-info');
  } else if (state === 'showing') {
    navigator.clipboard.writeText(getPhone()).then(function() {
      btn.innerHTML = '\u2713 Copied!';
      btn.classList.add('copied');
      setTimeout(function() {
        btn.innerHTML = '\uD83D\uDCDE ' + getPhone() + '<span class="copy-hint">click to copy</span>';
        btn.classList.remove('copied');
      }, 2000);
    }).catch(function() {
      btn.innerHTML = '\uD83D\uDCDE ' + getPhone();
    });
  }
}

// Close info when clicking elsewhere
document.addEventListener('click', function(e) {
  var emailBtn = document.getElementById('emailBtn');
  var phoneBtn = document.getElementById('phoneBtn');

  if (emailBtn && !emailBtn.contains(e.target) && emailBtn.dataset.state === 'showing') {
    emailBtn.innerHTML = '\u2709 Email';
    emailBtn.dataset.state = 'hidden';
    emailBtn.classList.remove('showing-info');
  }
  if (phoneBtn && !phoneBtn.contains(e.target) && phoneBtn.dataset.state === 'showing') {
    phoneBtn.innerHTML = '\uD83D\uDCDE Phone';
    phoneBtn.dataset.state = 'hidden';
    phoneBtn.classList.remove('showing-info');
  }
});