#
# Gallery WebApp
# Copyright 2019-2022 Craig Drummond <craig.p.drummond@gmail.com>
# Licensed under the MIT license.
#

import json
import os
from . import config
from . import image
from . import utils
from . import log
from flask import Blueprint, abort, send_file

api = Blueprint(__name__, __name__)

@api.route('/<path:path>')
def root(path):
    log.info("Scaled "+path)
    if ('/../' in path):
        log.error("Invalid path "+path)
        abort(403)
        return
    fType=utils.fileType(path)
    if not ('image'==fType or'video'==fType):
        log.error("Invalid file type on path "+path)
        abort(403)
        return

    fullPath=config.cacheFolder+path
    if not utils.createDir(os.path.dirname(fullPath)):
        log.error("Failed to create folder for "+path)
        abort(403)
        return
    scaledName=utils.removeExtension(fullPath)+config.scaledSuffix
    if not image.createImage(config.sourceFolder+path, scaledName, fType, config.scaledSize, config.scaledQuality):
        log.error("Failed to create scaled for "+path)
        abort(404)
        return
    if scaledName.startswith('/'):
        fullPath=scaledName
    else:
        fullPath=os.path.join(os.path.dirname(os.path.abspath(__file__)), "../"+scaledName)
    log.info("Send file "+fullPath)
    return send_file(fullPath, mimetype='image/jpeg')


