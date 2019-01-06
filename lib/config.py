#
# Gallery WebApp
# Copyright 2019 Craig Drummond <craig.p.drummond@gmail.com>
# Licensed under the MIT license.
#

import argparse
import os
import json
from . import log
from . import utils

port=8008
sourceFolder='photos'
cacheFolder='thumb'
thumbSize="200x200"
scaledSize="1440x1080"
htmlThumbSize=150
thumbQuality=75
scaledQuality=82
thumbSuffix='_thumb.jpg'
scaledSuffix='_scaled.jpg'
serverRoot='/source'
convert=None
ffmpeg=None
ignoreFolders=None

def load():
    global port
    global sourceFolder
    global cacheFolder
    global thumbSize
    global htmlThumbSize
    global thumbSuffix
    global thumbQuality
    global scaledSuffix
    global scaledSize
    global thumbQuality
    global serverRoot
    global convert
    global ffmpeg
    global ignoreFolders
    enableLog = log.enabled
    parser = argparse.ArgumentParser(description='Gallery WebApp.')
    parser.add_argument('-c', '--config', type=str, help='Config file (default: config.json)', default='config.json')
    parser.add_argument('-m', '--mode', type=str, help='Mode - cache (Generate thumbnails and scaled images), server (Start web server)', default='server')
    args = parser.parse_args()

    if os.path.exists(args.config):
        try:
            log.info("Reading config from "+args.config)
            with open(args.config, 'r') as configFile:
                config = json.load(configFile)
                if 'port' in config:
                    port=config['port']
                if 'sourceFolder' in config:
                    sourceFolder=config['sourceFolder']
                if 'cacheFolder' in config:
                    cacheFolder=config['cacheFolder']
                if 'thumbSize' in config:
                    thumbSize=config['thumbSize']
                if 'htmlThumbSize' in config:
                    htmlThumbSize=config['htmlThumbSize']
                if 'thumbSuffix' in config:
                    thumbSuffix=config['thumbSuffix']
                if 'thumbQuality' in config:
                    thumbQuality=config['thumbQuality']
                if 'scaledSuffix' in config:
                    scaledSuffix=config['scaledSuffix']
                if 'scaledSize' in config:
                    scaledSize=config['scaledSize']
                if 'scaledQuality' in config:
                    scaledQuality=config['scaledQuality']
                if 'serverRoot' in config:
                    serverRoot=config['serverRoot']
                if 'ignoreFolders' in config:
                    ignoreFolders=config['ignoreFolders']
                if 'log' in config:
                    enableLog=True==config['log']
        except ValueError:
            log.error("Failed to parse config file")
            return None
        except IOError:
            log.error("Failed to read config file")
            return None
    else:
        log.info("Config file does not exist, using defaults")
    if port<1 or port>65535:
        log.error("port must be in range 1..65535")
        return None
    if not sourceFolder:
        log.error("sourceFolder cannot be empty")
        return None
    if not cacheFolder:
        log.error("cacheFolder cannot be empty")
        return None
    if not thumbSuffix:
        log.error("thumbSuffix cannot be empty")
        return None
    if not scaledSuffix:
        log.error("scaledSuffix cannot be empty")
        return None
    if not os.path.isdir(sourceFolder):
        log.error("sourceFolder ("+sourceFolder+") folder does not exist")
        return None
    if not sourceFolder.endswith('/'):
        sourceFolder+='/'
    if not cacheFolder.endswith('/'):
        cacheFolder+='/'
    convert=utils.which('convert')
    ffmpeg=utils.which('ffmpeg')
    if None==ffmpeg:    
        ffmpeg=utils.which('avconv')
    if None==ffmpeg:
        log.error("Please install 'ffmpeg' or 'avconv'")
        return None
    if None==convert:
        log.error("Please install 'convert' from imagemagick")
        return None
    log.enabled = enableLog
    return args.mode


