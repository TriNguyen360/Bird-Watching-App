"""
This file defines the database models
"""

import datetime
from .common import db, Field, auth
from pydal.validators import *


def get_user_email():
    return auth.current_user.get('email') if auth.current_user else None

def get_time():
    return datetime.datetime.utcnow()


### Define your table below
#
# db.define_table('thing', Field('name'))
#
## always commit your models to avoid problems later

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
    Field('observation_date', 'date'),
    Field('time_observations_started', 'time'),
    Field('observer_id', 'string'),
    Field('duration_minutes', 'integer'),
)

db.commit()
