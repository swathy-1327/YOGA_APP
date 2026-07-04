# StillPoint Yoga Live

A responsive yoga webinar landing page for a friend, built with HTML, Bootstrap 5, CSS, vanilla JavaScript, Firebase, and the same webinar backend APIs.

## Included Sections

- Webinar banner carousel
- YouTube intro video section
- Yoga class listing
- Testimonial carousel
- Registration form

## Backend APIs

- Banner: `https://ht-admin-api-stg.bienapp.in/api/home/webinar/banner-list`
- Video: `https://ht-admin-api-stg.bienapp.in/api/home/webinar/video-list`
- Classes: `https://ht-admin-api-stg.bienapp.in/api/home/webinar/class-list`
- Testimonials: `https://ht-admin-api-stg.bienapp.in/api/home/webinar/testimonial-list`

## Firebase

Add your Firebase web app config in `assets/js/firebase.js`.

Submissions are written to the `registrations` collection as:

```json
{
  "Name": "...",
  "Phone": "...",
  "Email": "...",
  "Class_ID": "..."
}
```

## Run Locally

For best testing, especially YouTube embeds, serve the folder locally:

```bash
cd yogaApp2
python3 -m http.server 5600
```

Open:

```text
http://localhost:5600
```
