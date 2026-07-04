(function () {
  const API_BASE_URL = 'https://ht-admin-api-stg.bienapp.in/api/home/webinar';

  const endpoints = {
    banners: `${API_BASE_URL}/banner-list`,
    videos: `${API_BASE_URL}/video-list`,
    classes: `${API_BASE_URL}/class-list`,
    testimonials: `${API_BASE_URL}/testimonial-list`,
  };

  async function requestList(endpoint) {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const payload = await response.json();

    if (!payload || payload.success_status !== true || !Array.isArray(payload.info)) {
      throw new Error('Unexpected API response format');
    }

    return payload.info;
  }

  function activeOnly(items) {
    return items.filter((item) => Number(item.status) === 1);
  }

  window.YogaApi = {
    getBanners: () => requestList(endpoints.banners).then(activeOnly),
    getVideos: () => requestList(endpoints.videos).then(activeOnly),
    getClasses: () => requestList(endpoints.classes).then(activeOnly),
    getTestimonials: () => requestList(endpoints.testimonials).then(activeOnly),
  };
}());
