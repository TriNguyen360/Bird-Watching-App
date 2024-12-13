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
import datetime

url_signer = URLSigner(session)

@action('index', method=['GET'])
@action.uses('index.html', db, auth, url_signer)
def index():
    if not auth.current_user:
        redirect(URL('auth/login'))
    return dict(
        my_callback_url=URL('my_callback', signer=url_signer),
    )

@action('stats', method=['GET'])
@action.uses('stats.html', db, auth, url_signer)
def stats():
    # Pass any required data to stats.html
    return dict(
        species_data_url=URL('get_species_data', signer=url_signer),
    )

@action('get_species_data', method=['GET'])
@action.uses(db, auth.user)
def get_species_data():
    # Return species data for testing or real implementation
    species = db(db.species).select().as_list()
    return dict(species=species)


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
    species_param = request.params.get('species')
    q = (db.sightings.sampling_event_identifier == db.checklists.sampling_event_identifier)
    if species_param and species_param.strip():
        q &= (db.sightings.common_name == species_param)

    rows = db(q).select(
        db.sightings.observation_count,
        db.checklists.latitude,
        db.checklists.longitude
    )

    points = []
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


@action('submit_checklist', method=['POST'])
@action.uses(db, auth.user)
def submit_checklist():
    data = request.json.get('checklist', [])
    if not data:
        return dict(status="error", message="No checklist data provided.")

    try:
        # Generate a unique identifier for the checklist
        import uuid
        sampling_event_identifier = str(uuid.uuid4())

        # Get the user ID
        user_id = auth.current_user.get('id')

        # Extract location data from the first entry
        first_entry = data[0]
        latitude = first_entry['location']['lat']
        longitude = first_entry['location']['lng']

        db.checklists.insert(
            sampling_event_identifier=sampling_event_identifier,
            latitude=latitude,
            longitude=longitude,
            observation_date=datetime.date.today(),
            time_observations_started=datetime.datetime.now().time(),  # Add current time
            observer_id=user_id
        )

        # Insert sightings
        for entry in data:
            species = db(db.species.id == entry['species_id']).select().first()
            if species:
                db.sightings.insert(
                    sampling_event_identifier=sampling_event_identifier,
                    common_name=species.common_name,
                    observation_count=entry['count']
                )

        return dict(status="success", message="Checklist added successfully!")

    except Exception as e:
        logger.error(f"Error in submit_checklist: {e}")
        return dict(status="error", message="An error occurred while submitting the checklist.")



@action('my_checklists', method=['GET'])
@action.uses('my_checklists.html', db, auth.user)
def my_checklists():
    user_id = auth.current_user.get('id')  # Ensure correct user ID
    logger.info(f"Fetching checklists for user_id: {user_id}")  # Log user_id for debugging
    
    checklists = db(db.checklists.observer_id == user_id).select(
        db.checklists.id,
        db.checklists.latitude,
        db.checklists.longitude,
        db.checklists.observation_date,
        db.checklists.time_observations_started,
    ).as_list()
    
    # Convert observation_date and time_observations_started to strings
    for checklist in checklists:
        checklist['date'] = checklist.pop('observation_date').isoformat()
        checklist['time'] = str(checklist.pop('time_observations_started'))  # Convert time to string
    
    logger.info(f"Checklists fetched: {checklists}")  # Log fetched data for debugging
    
    return dict(checklists=checklists)




@action('get_region_data', method=['GET'])
@action.uses(db, auth.user)
def get_region_data():

    ne_lat = float(request.params.get('ne_lat', 90))
    ne_lng = float(request.params.get('ne_lng', 180))
    sw_lat = float(request.params.get('sw_lat', -90))
    sw_lng = float(request.params.get('sw_lng', -180))
    
    # Get all data form checklists database inside the rectangular region
    # Connect sightings database
    rows = db(
        (db.checklists.latitude <= ne_lat) &
        (db.checklists.latitude >= sw_lat) &
        (db.checklists.longitude <= ne_lng) &
        (db.checklists.longitude >= sw_lng)
    ).select(
        db.checklists.sampling_event_identifier,
        db.checklists.observer_id,
        db.sightings.common_name,
        db.sightings.observation_count,
        join=db.sightings.on(db.sightings.sampling_event_identifier == db.checklists.sampling_event_identifier)
    )

    species_stats = {} 

    contributor_counts = {}

    observer_checklists = {}

    for row in rows:
        species = row.sightings.common_name
        count = row.sightings.observation_count or 0
        observer = row.checklists.observer_id
        sei = row.checklists.sampling_event_identifier

        if species not in species_stats:
            species_stats[species] = 0
        species_stats[species] += count

        if observer not in observer_checklists:
            observer_checklists[observer] = set()
        observer_checklists[observer].add(sei)

    for obs, checklist_set in observer_checklists.items():
        contributor_counts[obs] = len(checklist_set)

    region_species_data = [
        {
            'species': s,
            'sightings': species_stats[s]
        }
        for s in species_stats
    ]

    # Prepares species data and cleans up 0 sighted data
    region_species_data = [
        {
            'species': s,
            'sightings': species_stats[s]
        }
        for s in species_stats
        if species_stats[s] > 0
    ]
    region_species_data.sort(key=lambda x: x['sightings'], reverse=True)

    # Prepares top contributors data and sorting
    top_contributors = [
        {
            'name': obs,
            'contributions': contributor_counts[obs]
        }
        for obs in contributor_counts
    ]
    top_contributors.sort(key=lambda x: x['contributions'], reverse=True)


    return dict(
        region_species=region_species_data,
        top_contributors=top_contributors
    )


@action('get_species_time_data', method=['GET'])
@action.uses(db, auth.user)
def get_species_time_data():

    ne_lat = float(request.params.get('ne_lat', 90))
    ne_lng = float(request.params.get('ne_lng', 180))
    sw_lat = float(request.params.get('sw_lat', -90))
    sw_lng = float(request.params.get('sw_lng', -180))
    species_name = request.params.get('species')


    rows = db(
        (db.checklists.latitude <= ne_lat) &
        (db.checklists.latitude >= sw_lat) &
        (db.checklists.longitude <= ne_lng) &
        (db.checklists.longitude >= sw_lng) &
        (db.sightings.sampling_event_identifier == db.checklists.sampling_event_identifier) &
        (db.sightings.common_name == species_name)
    ).select(db.checklists.observation_date, db.sightings.observation_count)

    time_data = {}
    for row in rows:
        date_str = row.checklists.observation_date.isoformat()
        if date_str not in time_data:
            time_data[date_str] = 0
        time_data[date_str] += row.sightings.observation_count

    time_series = [
        {'date': d, 'count': time_data[d]} 
        for d in sorted(time_data.keys())
    ]

    return dict(time_series=time_series)



# Debug checklist function:
@action('debug-my-checklists', method=['GET'])
@action.uses(db, auth.user)
def debug_my_checklists():
    user_id = auth.current_user.get('id')
    checklists = db(db.checklists.observer_id == user_id).select().as_list()
    return dict(checklists=checklists)
