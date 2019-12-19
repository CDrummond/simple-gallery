#
# Gallery WebApp
# Copyright 2019 Craig Drummond <craig.p.drummond@gmail.com>
# Licensed under the MIT license.
#

import os
from flask import Flask
from . import browse_api
from . import scaled_api
from . import thumb_api
from . import config_api
from . import view_api

app = Flask(__name__)
app.register_blueprint(browse_api.api, url_prefix='/browse')
app.register_blueprint(thumb_api.api, url_prefix='/thumb')
app.register_blueprint(scaled_api.api, url_prefix='/scaled')
app.register_blueprint(config_api.api, url_prefix='/config')
app.register_blueprint(view_api.api, url_prefix='/view')
