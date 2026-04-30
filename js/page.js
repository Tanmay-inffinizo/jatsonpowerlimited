
    // File input label
    document.getElementById('fileInput').addEventListener('change', function () {
      document.getElementById('fileName').textContent =
        this.files.length ? this.files[0].name : 'No file chosen';
    });

    // Live char counter
    document.getElementById('messageArea').addEventListener('input', function () {
      document.getElementById('charCount').textContent = this.value.length;
    });

    // Hero fade-ups on load
    window.addEventListener('load', function () {
      document.querySelectorAll('.page-hero .fade-up').forEach(function (el, i) {
        setTimeout(function () { el.classList.add('revealed'); }, 200 + i * 100);
      });

      // Contact items — staggered reveal on scroll
      var items = document.querySelectorAll('.page-item');
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('revealed');
          io.unobserve(entry.target);
        });
      }, { threshold: 0.15 });
      items.forEach(function (el, i) {
        el.style.transitionDelay = (i * 0.10) + 's';
        io.observe(el);
      });
    });

    // Form submit — demo handler (replace with real endpoint)
    document.getElementById('contactForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var label = this.querySelector('.submit-btn span');
      label.textContent = 'Message Sent \u2713';
      setTimeout(function () { label.textContent = 'Send Question'; }, 3000);
    });