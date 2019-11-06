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

app = Flask(__name__, template_folder=os.path.join(os.path.dirname(os.path.abspath(__file__)), "../templates"))
app.register_blueprint(browse_api.api, url_prefix='/browse')
app.register_blueprint(thumb_api.api, url_prefix='/thumb')
app.register_blueprint(scaled_api.api, url_prefix='/scaled')
app.register_blueprint(config_api.api, url_prefix='/config')
