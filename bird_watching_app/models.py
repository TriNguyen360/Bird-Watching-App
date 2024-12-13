"""
This file defines the database models
"""

import datetime
import csv
import os
from .common import db, Field, auth
from pydal.validators import *


def get_user_email():
    return auth.current_user.get('email') if auth.current_user else None

def get_time():
    return datetime.datetime.utcnow()


db.define_table(
    'species',
    Field('common_name', 'string')
)

db.define_table(
    'sightings',
    Field('sampling_event_identifier', 'string'),
    Field('common_name', 'string'),
    Field('observation_count', 'integer')
)

db.define_table(
    'checklists',
    Field('sampling_event_identifier', 'string'),
    Field('latitude', 'double'),
    Field('longitude', 'double'),
    Field('observation_date', 'date'),
    Field('time_observations_started', 'time'),
    Field('observer_id', 'string'),
    Field('duration_minutes', 'double'),
    Field('user_id', 'reference auth_user', required=True), 
)


data_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')

species_file = os.path.join(data_folder, 'species.csv')
checklists_file = os.path.join(data_folder, 'checklists.csv')
sightings_file = os.path.join(data_folder, 'sightings.csv')

if db(db.species).isempty():
    with open(species_file, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            db.species.insert(common_name=row['COMMON NAME'])

if db(db.checklists).isempty():
    with open(checklists_file, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            time_observations_started = row['TIME OBSERVATIONS STARTED']
            if not time_observations_started:
                time_observations_started = "00:00:00"

            db.checklists.insert(
                sampling_event_identifier=row['SAMPLING EVENT IDENTIFIER'],
                latitude=float(row['LATITUDE']),
                longitude=float(row['LONGITUDE']),
                observation_date=datetime.datetime.strptime(row['OBSERVATION DATE'], '%Y-%m-%d').date(),
                time_observations_started=datetime.datetime.strptime(time_observations_started, '%H:%M:%S').time(),
                observer_id=row['OBSERVER ID'],
                duration_minutes=float(row['DURATION MINUTES']) if row['DURATION MINUTES'] else None,
            )

if db(db.sightings).isempty():
    with open(sightings_file, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            species = db(db.species.common_name == row['COMMON NAME']).select().first()
            if not species:
                continue
            observation_count = 0 if row['OBSERVATION COUNT'] == 'X' else int(row['OBSERVATION COUNT'])
            db.sightings.insert(
                sampling_event_identifier=row['SAMPLING EVENT IDENTIFIER'],
                species_id=species.id,
                observation_count=observation_count,
            )

db.commit()
