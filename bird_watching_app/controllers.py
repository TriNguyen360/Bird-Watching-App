"""
This file defines actions, i.e. functions the URLs are mapped into
The @action(path) decorator exposed the function at URL:

    http://127.0.0.1:8000/{app_name}/{path}

If app_name == '_default' then simply

    http://127.0.0.1:8000/{path}

If path == 'index' it can be omitted:

    http://127.0.0.1:8000/

The path follows the bottlepy syntax.

@action.uses('generic.html')  indicates that the action uses the generic.html template
@action.uses(session)         indicates that the action uses the session
@action.uses(db)              indicates that the action uses the db
@action.uses(T)               indicates that the action uses the i18n & pluralization
@action.uses(auth.user)       indicates that the action requires a logged in user
@action.uses(auth)            indicates that the action requires the auth object

session, db, T, auth, and tempates are examples of Fixtures.
Warning: Fixtures MUST be declared with @action.uses({fixtures}) else your app will result in undefined behavior
"""

from py4web import action, request, abort, redirect, URL
from yatl.helpers import A
from .common import db, session, T, cache, auth, logger, authenticated, unauthenticated, flash
from py4web.utils.url_signer import URLSigner
from .models import get_user_email

url_signer = URLSigner(session)

@action('index', method=['GET'])
@action.uses('index.html', db, auth, url_signer)
def index():
    if not auth.current_user:
        redirect(URL('auth/login'))
    return dict(
        my_callback_url=URL('my_callback', signer=url_signer),
    )

@action('my_callback')
@action.uses() # Add here things like db, auth, etc.
def my_callback():
    # The return value should be a dictionary that will be sent as JSON.
    return dict(my_value=3)

@action('stats', method=['GET'])
@action.uses('stats.html', auth.user)
def stats():
    return dict()

@action('checklist', method=['GET'])
@action.uses('checklist.html', auth.user)
def checklist():
    return dict()

@action('location', method=['GET'])
@action.uses('location.html', auth.user)
def location():
    return dict()

@action('heatmap_data', method=['GET'])
@action.uses(db, auth.user)
def heatmap_data():
    points = []
    rows = db(db.sightings).select(
        db.sightings.observation_count,
        db.checklists.latitude,
        db.checklists.longitude,
        join=db.sightings.on(
            db.sightings.sampling_event_identifier == db.checklists.sampling_event_identifier
        ),
    )

    for row in rows:
        points.append([row.checklists.latitude, row.checklists.longitude, row.sightings.observation_count])

    return dict(points=points)


@action('region_stats', method=['POST'])
@action.uses(db, auth.user)
def region_stats():
    data = request.json
    ne_lat = data.get('ne_lat')
    ne_lng = data.get('ne_lng')
    sw_lat = data.get('sw_lat')
    sw_lng = data.get('sw_lng')

    rows = db(
        (db.checklists.latitude <= ne_lat) &
        (db.checklists.latitude >= sw_lat) &
        (db.checklists.longitude <= ne_lng) &
        (db.checklists.longitude >= sw_lng)
    ).select(db.sightings.common_name, db.sightings.observation_count, db.checklists.ALL, 
             join=db.sightings.on(db.sightings.sampling_event_identifier == db.checklists.sampling_event_identifier))

    species_stats = {}
    for row in rows:
        species = row.sightings.common_name
        count = row.sightings.observation_count
        if species not in species_stats:
            species_stats[species] = 0
        species_stats[species] += count

    return dict(stats=species_stats)