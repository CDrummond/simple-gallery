#
# Gallery WebApp
# Copyright 2019-2022 Craig Drummond <craig.p.drummond@gmail.com>
# Licensed under the MIT license.
#

import io
import json
import os
import subprocess
from . import config
from . import utils
from . import log
from flask import Blueprint, abort, request, send_file

api = Blueprint(__name__, __name__)

@api.route('/<path:path>')
def root(path):
    log.info("View %s " % path)

    if ('/../' in path) or not path.rsplit('.', 1)[1].lower()=='jpg':
        log.error("Invalid path %s " % path)
        abort(403)
        return

    fullPath=config.sourceFolder+path
    if not os.path.exists(fullPath):
        log.error("Failed to locate %s " % path)
        abort(404)
        return

    result = subprocess.check_output([config.exiftran, '-a', '-o', '/dev/stdout', fullPath])
    return send_file(io.BytesIO(result), attachment_filename=os.path.basename(path), mimetype='image/jpg')

