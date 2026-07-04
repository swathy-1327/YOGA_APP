(function () {
  const selectors = {
    bannerStatus: '#bannerStatus',
    bannerMount: '#bannerMount',
    videoStatus: '#videoStatus',
    videoMount: '#videoMount',
    classStatus: '#classStatus',
    classMount: '#classMount',
    testimonialStatus: '#testimonialStatus',
    testimonialMount: '#testimonialMount',
    form: '#registrationForm',
    name: '#nameInput',
    phone: '#phoneInput',
    email: '#emailInput',
    classSelect: '#classSelect',
    submit: '#submitButton',
    formStatus: '#formStatus',
    selectedClassCard: '#selectedClassCard',
    nameError: '#nameError',
    phoneError: '#phoneError',
    emailError: '#emailError',
    classError: '#classError',
  };

  const dom = Object.fromEntries(
    Object.entries(selectors).map(([key, selector]) => [key, document.querySelector(selector)]),
  );

  const state = {
    classes: [],
    selectedClassId: '',
    validity: {
      name: false,
      phone: false,
      email: false,
      classId: false,
    },
    submitting: false,
  };

  document.addEventListener('DOMContentLoaded', () => {
    document.documentElement.classList.add('js');
    bindEvents();
    initReveal();
    loadContent();
  });

  function bindEvents() {
    dom.name.addEventListener('input', () => validateField('name'));
    dom.name.addEventListener('blur', () => validateField('name'));
    dom.phone.addEventListener('input', () => validateField('phone'));
    dom.phone.addEventListener('blur', () => validateField('phone'));
    dom.email.addEventListener('input', () => validateField('email'));
    dom.email.addEventListener('blur', () => validateField('email'));
    dom.classSelect.addEventListener('change', () => {
      state.selectedClassId = dom.classSelect.value;
      validateField('classId');
      renderSelectedClass();
    });
    dom.form.addEventListener('submit', submitRegistration);
    document.querySelectorAll('[data-scroll-register]').forEach((link) => {
      link.addEventListener('click', scrollToRegistration);
    });
  }

  async function loadContent() {
    setLoading(dom.bannerStatus, dom.bannerMount, skeleton('banner'));
    setLoading(dom.videoStatus, dom.videoMount, skeleton('video'));
    setLoading(dom.classStatus, dom.classMount, skeleton('classes'));
    setLoading(dom.testimonialStatus, dom.testimonialMount, skeleton('testimonial'));

    await Promise.all([
      loadBanners(),
      loadVideos(),
      loadClasses(),
      loadTestimonials(),
    ]);
  }

  async function loadBanners() {
    try {
      const banners = (await window.YogaApi.getBanners()).filter((item) => item.image);
      clearStatus(dom.bannerStatus);

      if (!banners.length) {
        renderEmpty(dom.bannerMount, 'No webinar banners are available right now.');
        return;
      }

      dom.bannerMount.innerHTML = `
        <div id="heroBannerCarousel" class="carousel slide hero-carousel" data-bs-ride="false" data-bs-touch="true">
          <div class="carousel-inner">
            ${banners.map((banner, index) => `
              <div class="carousel-item ${index === 0 ? 'active' : ''}">
                <figure class="banner-card">
                  <img src="${escapeAttribute(banner.image)}" alt="Yoga webinar banner ${index + 1}" loading="${index === 0 ? 'eager' : 'lazy'}">
                  <figcaption>
                    <a href="#registration" class="btn btn-light banner-action" data-scroll-register>Register Now</a>
                  </figcaption>
                </figure>
              </div>
            `).join('')}
          </div>
          ${banners.length > 1 ? carouselControls('heroBannerCarousel', 'banner') : ''}
        </div>
      `;

      dom.bannerMount.querySelectorAll('[data-scroll-register]').forEach((link) => {
        link.addEventListener('click', scrollToRegistration);
      });
    } catch (error) {
      renderError(dom.bannerMount, 'We could not load the webinar banner.', loadBanners);
    }
  }

  async function loadVideos() {
    try {
      const videos = (await window.YogaApi.getVideos()).filter((item) => item.link);
      clearStatus(dom.videoStatus);

      if (!videos.length) {
        renderEmpty(dom.videoMount, 'No intro videos are available right now.');
        return;
      }

      dom.videoMount.innerHTML = videos.map((video, index) => {
        const videoId = getYouTubeId(video.link);
        const src = toYouTubeEmbed(video.link);

        if (!videoId || !src) {
          return '';
        }

        return `
          <article class="video-card reveal">
            <div class="video-card-header">
              <img src="https://img.youtube.com/vi/${escapeAttribute(videoId)}/hqdefault.jpg" alt="Yoga video preview ${index + 1}" loading="${index === 0 ? 'eager' : 'lazy'}">
              <div>
                <p class="video-label">Intro video</p>
                <h3>Yoga Webinar Intro</h3>
                <a class="btn btn-outline-primary btn-sm" href="${escapeAttribute(toYouTubeWatchUrl(videoId))}" target="_blank" rel="noopener">
                  Watch on YouTube
                </a>
              </div>
            </div>
            <div class="video-player-shell">
              <iframe
                src="${escapeAttribute(src)}"
                title="Yoga intro video ${index + 1}"
                referrerpolicy="strict-origin-when-cross-origin"
                allow="autoplay; encrypted-media; picture-in-picture; web-share"
                allowfullscreen
                loading="${index === 0 ? 'eager' : 'lazy'}">
              </iframe>
            </div>
          </article>
        `;
      }).join('');

      if (!dom.videoMount.innerHTML.trim()) {
        renderEmpty(dom.videoMount, 'No playable intro videos are available right now.');
        return;
      }

      initReveal(dom.videoMount);
    } catch (error) {
      renderError(dom.videoMount, 'We could not load the intro video.', loadVideos);
    }
  }

  async function loadClasses() {
    try {
      state.classes = await window.YogaApi.getClasses();
      clearStatus(dom.classStatus);
      renderClassOptions();
      validateField('classId', false);

      if (!state.classes.length) {
        renderEmpty(dom.classMount, 'No yoga classes are open for registration right now.');
        renderSelectedClass();
        return;
      }

      dom.classMount.innerHTML = state.classes.map((item) => `
        <article class="class-card reveal">
          <div>
            <span class="class-pill">${escapeHtml(item.type || 'Class')}</span>
            <h3>${escapeHtml(item.title || 'Untitled class')}</h3>
            ${item.subtitle ? `<p class="class-subtitle">${escapeHtml(item.subtitle)}</p>` : ''}
            ${item.description ? `<p>${escapeHtml(shorten(item.description, 150))}</p>` : ''}
          </div>
          <dl class="class-facts">
            <div><dt>Date</dt><dd>${escapeHtml(formatDate(item.date))}</dd></div>
            <div><dt>Time</dt><dd>${escapeHtml(formatTimeRange(item.start_time, item.end_time))}</dd></div>
            ${isOffline(item) ? `<div><dt>Place</dt><dd>${escapeHtml(item.place)}</dd></div>` : ''}
          </dl>
          <div class="class-footer">
            <strong>${escapeHtml(formatCurrency(item.amount))}</strong>
            <button class="btn btn-primary" type="button" data-class-id="${escapeAttribute(item.id)}">Select Class</button>
          </div>
        </article>
      `).join('');

      dom.classMount.querySelectorAll('[data-class-id]').forEach((button) => {
        button.addEventListener('click', () => selectClass(button.dataset.classId));
      });
      initReveal(dom.classMount);
    } catch (error) {
      state.classes = [];
      renderClassOptions();
      renderError(dom.classMount, 'We could not load the class list.', loadClasses);
      renderSelectedClass();
    }
  }

  async function loadTestimonials() {
    try {
      const testimonials = await window.YogaApi.getTestimonials();
      clearStatus(dom.testimonialStatus);

      if (!testimonials.length) {
        renderEmpty(dom.testimonialMount, 'No testimonials are available right now.');
        return;
      }

      dom.testimonialMount.innerHTML = `
        <div id="storyCarousel" class="carousel slide story-carousel reveal" data-bs-ride="false" data-bs-touch="true">
          <div class="carousel-inner">
            ${testimonials.map((item, index) => `
              <div class="carousel-item ${index === 0 ? 'active' : ''}">
                <article class="story-card">
                  <div class="story-avatar">${renderAvatar(item)}</div>
                  <blockquote>${escapeHtml(item.comment || '')}</blockquote>
                  <p>${escapeHtml(item.name || 'Yoga participant')}</p>
                </article>
              </div>
            `).join('')}
          </div>
          ${testimonials.length > 1 ? carouselControls('storyCarousel', 'story') : ''}
        </div>
      `;
      initReveal(dom.testimonialMount);
    } catch (error) {
      renderError(dom.testimonialMount, 'We could not load testimonials.', loadTestimonials);
    }
  }

  function selectClass(classId) {
    state.selectedClassId = classId;
    dom.classSelect.value = classId;
    validateField('classId');
    renderSelectedClass();
    scrollToRegistration();
  }

  async function submitRegistration(event) {
    event.preventDefault();

    if (!validateAll() || state.submitting) {
      return;
    }

    state.submitting = true;
    updateSubmitState();
    setFormStatus('info', 'Submitting your registration...');

    const payload = {
      Name: dom.name.value.trim(),
      Phone: dom.phone.value.trim(),
      Email: dom.email.value.trim(),
      Class_ID: dom.classSelect.value,
    };

    try {
      await window.YogaFirebase.saveRegistration(payload);
      dom.form.reset();
      state.selectedClassId = '';
      Object.keys(state.validity).forEach((key) => {
        state.validity[key] = false;
        setFieldState(key, '', false);
      });
      renderSelectedClass();
      setFormStatus('success', 'Registration saved. We will send the class details soon.');
    } catch (error) {
      setFormStatus('error', `${error.message} Please try again.`);
    } finally {
      state.submitting = false;
      validateAll(false);
      updateSubmitState();
    }
  }

  function validateAll(showErrors = true) {
    return ['name', 'phone', 'email', 'classId'].map((field) => validateField(field, showErrors)).every(Boolean);
  }

  function validateField(field, showErrors = true) {
    const validators = {
      name: validateName,
      phone: validatePhone,
      email: validateEmail,
      classId: validateClass,
    };
    const result = validators[field]();
    state.validity[field] = result.valid;

    if (showErrors) {
      setFieldState(field, result.message, result.valid);
    }

    updateSubmitState();
    return result.valid;
  }

  function validateName() {
    const raw = dom.name.value;
    const value = raw.trim();

    if (!value) return invalid('Name is required.');
    if (raw !== value) return invalid('Name cannot start or end with a space.');
    if (value.length < 2) return invalid('Name must be at least 2 characters.');
    if (value.length > 50) return invalid('Name must be 50 characters or less.');
    if (!/^[A-Za-z ]+$/.test(value)) return invalid('Name can contain only letters and spaces.');

    return valid();
  }

  function validatePhone() {
    const value = dom.phone.value.trim();

    if (!value) return invalid('Phone number is required.');
    if (!/^\d+$/.test(value)) return invalid('Phone number must contain digits only.');
    if (value.length !== 10) return invalid('Phone number must be exactly 10 digits.');
    if (!/^[6-9]/.test(value)) return invalid('Phone number must start with 6, 7, 8, or 9.');

    return valid();
  }

  function validateEmail() {
    const value = dom.email.value.trim();

    if (!value) return invalid('Email is required.');
    if (/\s/.test(value)) return invalid('Email cannot contain spaces.');
    if ((value.match(/@/g) || []).length !== 1) return invalid('Email must contain one @ symbol.');
    if (value.includes('..')) return invalid('Email cannot contain consecutive dots.');

    const [local, domain] = value.split('@');
    if (!local) return invalid('Email must include text before @.');
    if (!domain) return invalid('Email must include a domain after @.');
    if (!domain.includes('.')) return invalid('Email domain must include a dot.');
    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value)) return invalid('Enter a valid email address.');

    return valid();
  }

  function validateClass() {
    return dom.classSelect.value ? valid() : invalid('Please select a class.');
  }

  function renderClassOptions() {
    if (!state.classes.length) {
      dom.classSelect.innerHTML = '<option value="">No classes available</option>';
      return;
    }

    dom.classSelect.innerHTML = `
      <option value="">Select a class</option>
      ${state.classes.map((item) => `<option value="${escapeAttribute(item.id)}">${escapeHtml(item.title || `Class ${item.id}`)}</option>`).join('')}
    `;
  }

  function renderSelectedClass() {
    const selected = state.classes.find((item) => String(item.id) === String(dom.classSelect.value));

    if (!selected) {
      dom.selectedClassCard.textContent = state.classes.length
        ? 'Choose a class from the list, or select one in the form.'
        : 'Classes are not available yet. Please try again after the list loads.';
      return;
    }

    dom.selectedClassCard.innerHTML = `
      <strong>${escapeHtml(selected.title || 'Selected class')}</strong>
      <span>${escapeHtml(formatDate(selected.date))} / ${escapeHtml(formatTimeRange(selected.start_time, selected.end_time))}</span>
    `;
  }

  function setFieldState(field, message, isValid) {
    const inputMap = {
      name: dom.name,
      phone: dom.phone,
      email: dom.email,
      classId: dom.classSelect,
    };
    const errorMap = {
      name: dom.nameError,
      phone: dom.phoneError,
      email: dom.emailError,
      classId: dom.classError,
    };
    inputMap[field].classList.toggle('is-valid', isValid);
    inputMap[field].classList.toggle('is-invalid', Boolean(message));
    errorMap[field].textContent = message;
  }

  function updateSubmitState() {
    dom.submit.disabled = !Object.values(state.validity).every(Boolean) || state.submitting;
  }

  function setFormStatus(type, message) {
    dom.formStatus.className = `form-status form-status-${type}`;
    dom.formStatus.textContent = message;
  }

  function scrollToRegistration(event) {
    if (event) {
      event.preventDefault();
    }

    document.querySelector('#registration').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function setLoading(statusNode, mountNode, markup) {
    statusNode.innerHTML = '<span class="loading-text">Loading...</span>';
    mountNode.innerHTML = markup;
  }

  function clearStatus(node) {
    node.innerHTML = '';
  }

  function renderEmpty(node, message) {
    node.innerHTML = `<div class="empty-state">${escapeHtml(message)}</div>`;
  }

  function renderError(node, message, retry) {
    node.innerHTML = `
      <div class="error-state">
        <span>${escapeHtml(message)}</span>
        <button class="btn btn-outline-primary btn-sm" type="button">Retry</button>
      </div>
    `;
    node.querySelector('button').addEventListener('click', retry);
  }

  function skeleton(type) {
    return `<div class="skeleton skeleton-${type}"></div>`;
  }

  function carouselControls(id, label) {
    return `
      <button class="carousel-control-prev" type="button" data-bs-target="#${id}" data-bs-slide="prev">
        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
        <span class="visually-hidden">Previous ${label}</span>
      </button>
      <button class="carousel-control-next" type="button" data-bs-target="#${id}" data-bs-slide="next">
        <span class="carousel-control-next-icon" aria-hidden="true"></span>
        <span class="visually-hidden">Next ${label}</span>
      </button>
    `;
  }

  function initReveal(root = document) {
    const items = root.querySelectorAll('.reveal:not(.is-visible)');

    if (!items.length) {
      return;
    }

    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach((item) => item.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16 });

    items.forEach((item) => observer.observe(item));

    window.setTimeout(() => items.forEach((item) => item.classList.add('is-visible')), 1200);
  }

  function renderAvatar(item) {
    if (item.image) {
      return `<img src="${escapeAttribute(item.image)}" alt="${escapeAttribute(item.name || 'Yoga participant')}" loading="lazy">`;
    }

    return `<span aria-hidden="true">${escapeHtml(initials(item.name))}</span>`;
  }

  function getYouTubeId(url) {
    try {
      const parsed = new URL(url);
      let id = '';

      if (parsed.hostname.includes('youtu.be')) {
        id = parsed.pathname.replace('/', '');
      } else if (parsed.searchParams.has('v')) {
        id = parsed.searchParams.get('v');
      } else if (parsed.pathname.includes('/embed/')) {
        id = parsed.pathname.split('/embed/')[1];
      } else if (parsed.pathname.includes('/shorts/')) {
        id = parsed.pathname.split('/shorts/')[1];
      }

      id = id.split(/[?&/]/)[0];
      return id;
    } catch (error) {
      return '';
    }
  }

  function toYouTubeEmbed(url) {
    const id = getYouTubeId(url);

    return id ? `https://www.youtube-nocookie.com/embed/${id}` : '';
  }

  function toYouTubeWatchUrl(id) {
    return `https://www.youtube.com/watch?v=${id}`;
  }

  function isOffline(item) {
    return String(item.type || '').toLowerCase() === 'offline' && item.place && String(item.place).toLowerCase() !== 'null';
  }

  function formatDate(value) {
    if (!value) return 'Date TBA';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  }

  function formatTimeRange(start, end) {
    return `${start || 'Start TBA'} - ${end || 'End TBA'}`;
  }

  function formatCurrency(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return 'Fee TBA';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  }

  function shorten(text, limit) {
    return text.length > limit ? `${text.slice(0, limit - 3).trim()}...` : text;
  }

  function initials(name) {
    return name
      ? name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('')
      : 'Y';
  }

  function valid() {
    return { valid: true, message: '' };
  }

  function invalid(message) {
    return { valid: false, message };
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }
}());
