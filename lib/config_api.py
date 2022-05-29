#
# Gallery WebApp
# Copyright 2019-2022 Craig Drummond <craig.p.drummond@gmail.com>
# Licensed under the MIT license.
#

from . import config
from . import log
from flask import Blueprint, abort, render_template

api = Blueprint(__name__, __name__)

@api.route('/')
def root():
    log.info("Config")
    return '{"serverRoot":"%s"}' % config.serverRoot, 200, {'Content-Type': 'application/json; charset=utf-8'}

