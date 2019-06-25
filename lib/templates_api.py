#
# Gallery WebApp
# Copyright 2019 Craig Drummond <craig.p.drummond@gmail.com>
# Licensed under the MIT license.
#

import os
from . import config
from . import utils
from . import log
from flask import Blueprint, abort, render_template

api = Blueprint(__name__, __name__)

@api.route('/<path:path>')
def root(path):
    log.info("Template "+path)
    if ('/../' in path):
        log.error("Invalid path "+path)
        abort(403)
        return

    return render_template(path, SERVER_ROOT=config.serverRoot, DEF_BROWSE='browse')

